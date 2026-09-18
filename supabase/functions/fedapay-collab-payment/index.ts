import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[FEDAPAY-PAYIN] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const BRAND_FEE = 0.10; // commission plateforme prélevée sur la marque

const fedapayBase = () =>
  (Deno.env.get("FEDAPAY_MODE") || "live") === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

// Opérateur + pays -> mode d'encaissement
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { collaborationId, returnUrl, provider, phone, country } = await req.json();
    if (!collaborationId) throw new Error("collaborationId required");

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

    const headers = {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    };

    // 1) Create the transaction
    const txRes = await fetch(`${fedapayBase()}/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        description: `Collaboration ${collaborationId}`,
        amount: totalFCFA,
        currency: { iso: "XOF" },
        callback_url: returnUrl || null,
        customer: {
          firstname: firstname || "Marque",
          lastname: rest.join(" ") || "CollabCrea",
          email: user.email,
        },
        custom_metadata: {
          collaboration_id: collaborationId,
          brand_id: collab.brand_id,
          creator_id: collab.creator_id,
          agreed_amount: amountFCFA,
        },
      }),
    });
    const txJson = await txRes.json();
    if (!txRes.ok) {
      log("Transaction creation failed", txJson);
      throw new Error(txJson?.message || "Erreur FedaPay lors de la création du paiement");
    }
    const transactionId = txJson?.["v1/transaction"]?.id;
    if (!transactionId) throw new Error("FedaPay: identifiant de transaction manquant");

    // 2) Direct charge on the chosen operator when we have provider + phone
    const iso = String(country || "").toUpperCase();
    const mode = provider ? PAYIN_MODES[String(provider)]?.[iso] : null;
    const digits = String(phone || "").replace(/\D/g, "");

    if (provider && digits) {
      if (!mode) throw new Error("Cet opérateur n'est pas disponible dans ce pays");
      const chargeRes = await fetch(`${fedapayBase()}/transactions/${transactionId}/${mode}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phone_number: { number: digits, country: iso.toLowerCase() },
        }),
      });
      const chargeJson = await chargeRes.json();
      if (!chargeRes.ok) {
        log("Direct charge failed", chargeJson);
        throw new Error(
          chargeJson?.message || "Le paiement n'a pas pu être envoyé à votre opérateur"
        );
      }
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

    // Fallback: hosted checkout token
    const tokenRes = await fetch(`${fedapayBase()}/transactions/${transactionId}/token`, {
      method: "POST",
      headers,
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.url) {
      log("Token generation failed", tokenJson);
      throw new Error(tokenJson?.message || "Erreur lors de l'ouverture du paiement");
    }

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
