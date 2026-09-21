import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRAND_FEE = 0.10;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fedapayBase = () =>
  (Deno.env.get("FEDAPAY_MODE") || "live") === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

const log = (step: string, details?: unknown) =>
  console.log(`[FEDAPAY-CREATE] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const DIAL_TO_ISO: Record<string, string> = {
  "225": "CI",
  "221": "SN",
  "229": "BJ",
  "226": "BF",
  "228": "TG",
  "223": "ML",
};

const parsePhone = (raw: string): { number: string; country: string } | null => {
  let digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  for (const [code, country] of Object.entries(DIAL_TO_ISO)) {
    if (digits.startsWith(code)) {
      const local = digits.slice(code.length);
      return local ? { number: local, country } : null;
    }
  }
  return digits.length >= 8 && digits.length <= 10 ? { number: digits, country: "CI" } : null;
};

const safeJson = async (src: { text: () => Promise<string> }): Promise<any> => {
  const text = await src.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const secretKey = Deno.env.get("FEDAPAY_SECRET_KEY");
    if (!secretKey) return json({ error: "Clé FedaPay non configurée" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Non autorisé" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData.user) return json({ error: "Non autorisé" }, 401);

    const body = await safeJson(req);
    const collaborationId = String(body?.collaborationId ?? "");
    if (!UUID_RE.test(collaborationId)) return json({ error: "collaborationId invalide" }, 400);

    const { data: collab, error: collabError } = await admin
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .maybeSingle();
    if (collabError || !collab) return json({ error: "Collaboration introuvable" }, 404);
    if (collab.brand_id !== userData.user.id) return json({ error: "Accès refusé" }, 403);

    // Montant calculé côté serveur (jamais celui du client)
    const amount = Math.round(Number(collab.agreed_amount) * (1 + BRAND_FEE));
    if (!Number.isFinite(amount) || amount < 100) {
      return json({ error: "Montant de collaboration invalide" }, 400);
    }

    const phone = parsePhone(String(body?.customerPhone ?? ""));
    const rawName = String(body?.customerName ?? "").trim() || "Marque CollabCrea";
    const [firstname, ...rest] = rawName.split(" ");

    log("Creating FedaPay transaction", { collaborationId, amount });

    const txRes = await fetch(`${fedapayBase()}/transactions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        description: String(body?.description ?? "").slice(0, 40) ||
          `ColabCrea ${collaborationId.slice(0, 8)}`,
        amount,
        currency: { iso: "XOF" },
        callback_url: String(body?.callbackUrl ?? ""),
        custom_metadata: {
          collaboration_id: collaborationId,
          brand_id: collab.brand_id,
          creator_id: collab.creator_id,
        },
        customer: {
          email: String(body?.customerEmail ?? ""),
          firstname: firstname || "Marque",
          lastname: rest.join(" ") || "CollabCrea",
          ...(phone
            ? { phone_number: { number: phone.number, country: phone.country } }
            : {}),
        },
      }),
    });

    const txData = await safeJson(txRes);
    if (!txRes.ok) {
      log("Transaction creation failed", { status: txRes.status, txData });
      return json({ error: txData?.message || "Échec de création de la transaction FedaPay" }, 400);
    }

    const tx = txData?.["v1/transaction"] ?? txData?.transaction ?? txData;
    const transactionId = tx?.id;
    const reference = tx?.reference ?? "";
    if (!transactionId) {
      log("No transaction ID returned", txData);
      return json({ error: "Pas d'ID de transaction retourné par FedaPay" }, 500);
    }

    const tokenRes = await fetch(`${fedapayBase()}/transactions/${transactionId}/token`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    });
    const tokenData = await safeJson(tokenRes);
    const token = tokenData?.token;
    if (!tokenRes.ok || !token) {
      log("Token generation failed", tokenData);
      return json({ error: "Impossible de générer le lien de paiement FedaPay" }, 500);
    }

    const paymentUrl = tokenData?.url || `https://process.fedapay.com/${token}`;
    log("Payment URL generated", { transactionId, paymentUrl });

    return json({ success: true, transactionId: String(transactionId), reference, paymentUrl, token });
  } catch (error) {
    log("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return json({ error: "Erreur interne" }, 500);
  }
});
