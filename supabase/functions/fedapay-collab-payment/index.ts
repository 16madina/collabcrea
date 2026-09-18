import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const log = (step: string, details?: unknown) =>
  console.log(`[FEDAPAY-PAYIN] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const BRAND_FEE = 0.10; // commission plateforme prélevée sur la marque

const fedapayBase = () =>
  (Deno.env.get("FEDAPAY_MODE") || "live") === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

// Opérateur + pays -> mode d'encaissement
// Lecture JSON tolérante (FedaPay peut renvoyer un corps vide)
const safeJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
};

const PAYIN_MODES: Record<string, Record<string, string>> = {
  wave: { CI: "wave_ci", SN: "wave_sn", BF: "wave_bf", ML: "wave_ml" },
  orange: {
    CI: "orange_money_ci",
    SN: "orange_money_sn",
    BF: "orange_money_bf",
    ML: "orange_money_ml",
    GW: "orange_money_gw",
  },
  mtn: { BJ: "mtn", CI: "mtn_ci" },
  moov: { BJ: "moov", TG: "moov_tg", BF: "moov_bf", ML: "moov_ml" },
};

// FedaPay only supports redirect-free collections for a limited set of methods.
// Wave CI must use the hosted checkout; sending it to the direct endpoint fails.
const NO_REDIRECT_MODES = new Set(["mtn_ci", "mtn", "moov", "moov_tg"]);

const COUNTRY_DIAL_CODES: Record<string, string> = {
  BJ: "229",
  BF: "226",
  CI: "225",
  GW: "245",
  ML: "223",
  SN: "221",
  TG: "228",
};

const LOCAL_PHONE_LENGTHS: Record<string, number> = {
  BJ: 8,
  BF: 8,
  CI: 10,
  GW: 9,
  ML: 8,
  SN: 9,
  TG: 8,
};

const normalizePhone = (rawPhone: unknown, country: string): string => {
  const dialCode = COUNTRY_DIAL_CODES[country];
  let digits = String(rawPhone || "").replace(/\D/g, "");
  if (dialCode && digits.startsWith(dialCode)) digits = digits.slice(dialCode.length);
  return dialCode ? `+${dialCode}${digits}` : `+${digits}`;
};

const localPhoneDigits = (rawPhone: unknown, country: string): string => {
  const dialCode = COUNTRY_DIAL_CODES[country];
  let digits = String(rawPhone || "").replace(/\D/g, "");
  if (dialCode && digits.startsWith(dialCode)) digits = digits.slice(dialCode.length);
  return digits;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const secretKey = Deno.env.get("FEDAPAY_SECRET_KEY");
    if (!secretKey) throw new Error("FEDAPAY_SECRET_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const { collaborationId, returnUrl, provider, phone, country } = await safeJson(req as unknown as Response);
    if (!/^[0-9a-f-]{36}$/i.test(String(collaborationId || ""))) throw new Error("collaborationId invalid");

    const { data: collab, error: collabError } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .single();
    if (collabError || !collab) throw new Error("Collaboration not found");
    if (collab.brand_id !== user.id) throw new Error("Only the brand can pay");
    if (!["pending_payment", "content_submitted"].includes(collab.status)) {
      throw new Error(`Invalid status: ${collab.status}`);
    }

    const amountFCFA = Number(collab.agreed_amount || 0);
    if (amountFCFA < 200) throw new Error("Amount too low");
    const totalFCFA = Math.round(amountFCFA * (1 + BRAND_FEE));

    // Brand profile for customer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const displayName = profile?.company_name || profile?.full_name || "Marque CollabCrea";
    const [firstname, ...rest] = displayName.split(" ");

    const iso = String(country || "").toUpperCase();
    const mode = provider ? PAYIN_MODES[String(provider)]?.[iso] : null;
    if (!mode) throw new Error("Cet opérateur n'est pas disponible dans ce pays");
    const localDigits = localPhoneDigits(phone, iso);
    if (localDigits.length !== LOCAL_PHONE_LENGTHS[iso]) {
      throw new Error(`Le numéro doit contenir ${LOCAL_PHONE_LENGTHS[iso]} chiffres pour ce pays`);
    }
    const normalizedPhone = normalizePhone(phone, iso);

    const headers = {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    };

    // Helper: crée une nouvelle transaction FedaPay
    const createTransaction = async (): Promise<number> => {
      const txRes = await fetch(`${fedapayBase()}/transactions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          description: `Collaboration ${collaborationId}`,
          amount: totalFCFA,
          currency: { iso: "XOF" },
          callback_url: typeof returnUrl === "string" && /^https:\/\//.test(returnUrl) ? returnUrl : "https://collabcrea.com/brand/collabs?tab=collabs",
          customer: {
            firstname: firstname || "Marque",
            lastname: rest.join(" ") || "CollabCrea",
            email: user.email,
            ...(phone && iso
              ? { phone_number: { number: normalizedPhone, country: iso.toLowerCase() } }
              : {}),
          },
          custom_metadata: {
            collaboration_id: collaborationId,
            brand_id: collab.brand_id,
            creator_id: collab.creator_id,
            agreed_amount: amountFCFA,
          },
        }),
      });
      const txJson = await safeJson(txRes);
      if (!txRes.ok) {
        log("Transaction creation failed", txJson);
        throw new Error(txJson?.message || "Erreur FedaPay lors de la création du paiement");
      }
      const id = txJson?.["v1/transaction"]?.id;
      if (!id) throw new Error("FedaPay: identifiant de transaction manquant");
      return id;
    };

    // 1) Direct charge on the chosen operator when we have provider + phone
    if (provider && phone && mode && NO_REDIRECT_MODES.has(mode)) {
      const transactionId = await createTransaction();
      const directTokenRes = await fetch(`${fedapayBase()}/transactions/${transactionId}/token`, {
        method: "POST",
        headers,
      });
      const directTokenJson = await safeJson(directTokenRes);
      const directToken = directTokenJson?.token;

      if (!directTokenRes.ok || !directToken) {
        log("Direct token generation failed", {
          transactionId,
          status: directTokenRes.status,
          body: directTokenJson,
        });
      } else {
      const chargeRes = await fetch(`${fedapayBase()}/transactions/${mode}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          token: directToken,
          phone_number: { number: normalizedPhone, country: iso.toLowerCase() },
        }),
      });
      const chargeJson = await safeJson(chargeRes);
      if (chargeRes.ok) {
        const url = chargeJson?.url || chargeJson?.["v1/transaction"]?.url || null;
        log("Charge sent", { transactionId, mode, hasUrl: !!url });
        return new Response(
          JSON.stringify({
            transactionId,
            paymentUrl: url,
            pushSent: !url,
            amountFCFA,
            totalFCFA,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      // Échec de l'envoi direct: on retombe sur la page de paiement hébergée
      log("Direct charge failed, falling back to hosted checkout", {
        status: chargeRes.status,
        mode,
        body: chargeJson,
      });
      }
    }

    // Fallback: hosted checkout token sur une transaction NEUVE
    // (réutiliser une transaction déjà refusée fait afficher "transaction échouée")
    const hostedTransactionId = await createTransaction();
    const tokenRes = await fetch(`${fedapayBase()}/transactions/${hostedTransactionId}/token`, {
      method: "POST",
      headers,
    });
    const tokenJson = await safeJson(tokenRes);
    if (!tokenRes.ok || !tokenJson?.url) {
      log("Token generation failed", tokenJson);
      throw new Error(tokenJson?.message || "Erreur lors de l'ouverture du paiement");
    }
    const transactionId = hostedTransactionId;

    log("Checkout ready", { transactionId, totalFCFA });

    return new Response(
      JSON.stringify({
        transactionId,
        paymentUrl: tokenJson.url,
        amountFCFA,
        totalFCFA,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
