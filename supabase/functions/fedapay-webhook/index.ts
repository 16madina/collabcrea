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

const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");

const secureEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
};

const verifySignature = async (payload: string, header: string | null, secret: string) => {
  if (!header) return false;
  const parts = header.split(",").map((part) => part.trim().split("="));
  const timestamp = Number(parts.find(([key]) => key === "t")?.[1]);
  const signatures = parts.filter(([key]) => key === "s").map(([, value]) => value);
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expected = hex(digest);
  return signatures.some((signature) => secureEqual(signature, expected));
};

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
    const webhookSecret = Deno.env.get("FEDAPAY_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("FEDAPAY_WEBHOOK_SECRET is not configured");
    const rawBody = await req.text();
    const signatureValid = await verifySignature(
      rawBody,
      req.headers.get("X-FEDAPAY-SIGNATURE"),
      webhookSecret,
    );
    if (!signatureValid) return json({ error: "Invalid signature" }, 401);

    const body = JSON.parse(rawBody);
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