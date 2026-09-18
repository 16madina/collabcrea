import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { finalizeFedaPayment, unwrapFedaTransaction } from "../_shared/fedapay-finalize.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fedapayBase = () =>
  (Deno.env.get("FEDAPAY_MODE") || "live") === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const secretKey = Deno.env.get("FEDAPAY_SECRET_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secretKey || !url || !serviceKey) throw new Error("Payment service unavailable");

    const admin = createClient(url, serviceKey);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Non autorisé" }, 401);
    const { data: userData, error: userError } = await admin.auth.getUser(authHeader.slice(7));
    if (userError || !userData.user) return json({ error: "Non autorisé" }, 401);

    const body = await req.json().catch(() => null);
    const transactionId = String(body?.transactionId ?? "");
    const collaborationId = String(body?.collaborationId ?? "");
    if (!/^\d+$/.test(transactionId) || !/^[0-9a-f-]{36}$/i.test(collaborationId)) {
      return json({ error: "Paramètres de paiement invalides" }, 400);
    }

    const { data: collab } = await admin
      .from("collaborations")
      .select("brand_id")
      .eq("id", collaborationId)
      .maybeSingle();
    if (!collab || collab.brand_id !== userData.user.id) return json({ error: "Accès refusé" }, 403);

    const response = await fetch(`${fedapayBase()}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return json({ error: "Transaction introuvable" }, 404);
    const transaction = unwrapFedaTransaction(payload);
    if (!transaction) throw new Error("Invalid payment response");

    const result = await finalizeFedaPayment(admin, transaction, collaborationId);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FEDAPAY-VERIFY]", message);
    return json({ error: "La vérification du paiement a échoué" }, 500);
  }
});