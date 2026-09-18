import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { finalizeFedaPayment, unwrapFedaTransaction } from "../_shared/fedapay-finalize.ts";

const acceptedEvents = new Set([
  "transaction.approved",
  "transaction.transferred",
  "transaction.declined",
  "transaction.canceled",
  "transaction.updated",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fedapayBase = () =>
  (Deno.env.get("FEDAPAY_MODE") || "live") === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

const findTransactionId = (body: Record<string, unknown>) => {
  const candidates = [body.object, body.entity, body.data];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    const nested = record.object && typeof record.object === "object"
      ? record.object as Record<string, unknown>
      : record;
    if (nested.id !== undefined && /^\d+$/.test(String(nested.id))) return String(nested.id);
  }
  return "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid payload" }, 400);
    const event = body as Record<string, unknown>;
    const eventName = String(event.name ?? event.type ?? "");
    if (!acceptedEvents.has(eventName)) return json({ received: true, ignored: true });

    const transactionId = findTransactionId(event);
    if (!transactionId) return json({ error: "Missing transaction ID" }, 400);

    const secretKey = Deno.env.get("FEDAPAY_SECRET_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secretKey || !url || !serviceKey) throw new Error("Payment service unavailable");

    // Never trust the webhook body: retrieve the canonical transaction from FedaPay.
    const response = await fetch(`${fedapayBase()}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`Transaction lookup failed (${response.status})`);
    const transaction = unwrapFedaTransaction(payload);
    if (!transaction) throw new Error("Invalid payment response");

    const admin = createClient(url, serviceKey);
    const result = await finalizeFedaPayment(admin, transaction);
    console.log("[FEDAPAY-WEBHOOK] processed", JSON.stringify({ eventName, transactionId, result }));
    return json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FEDAPAY-WEBHOOK]", message);
    return json({ error: "Webhook processing failed" }, 500);
  }
});