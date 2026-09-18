import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const BRAND_FEE = 0.10;
const PAID_STATUSES = new Set(["approved", "transferred"]);

export type FedaTransaction = Record<string, unknown> & {
  id?: number | string;
  amount?: number | string;
  status?: string;
  currency?: { iso?: string } | string;
  custom_metadata?: Record<string, unknown>;
};

export const unwrapFedaTransaction = (payload: unknown): FedaTransaction | null => {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const nested = body["v1/transaction"];
  if (nested && typeof nested === "object") return nested as FedaTransaction;
  return body as FedaTransaction;
};

const metadataValue = (metadata: Record<string, unknown> | undefined, key: string) => {
  const value = metadata?.[key];
  return value === undefined || value === null ? "" : String(value);
};

export async function finalizeFedaPayment(
  admin: SupabaseClient,
  fedaTx: FedaTransaction,
  expectedCollaborationId?: string,
) {
  const transactionId = String(fedaTx.id ?? "");
  const status = String(fedaTx.status ?? "").toLowerCase();
  const metadata = fedaTx.custom_metadata;
  const collaborationId = metadataValue(metadata, "collaboration_id");

  if (!transactionId || !/^\d+$/.test(transactionId)) throw new Error("Invalid FedaPay transaction ID");
  if (!PAID_STATUSES.has(status)) return { verified: false, paymentStatus: status || "unknown" };
  if (!collaborationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(collaborationId)) {
    throw new Error("Missing or invalid collaboration metadata");
  }
  if (expectedCollaborationId && collaborationId !== expectedCollaborationId) {
    throw new Error("Transaction does not belong to this collaboration");
  }

  const { data: collab, error: collabError } = await admin
    .from("collaborations")
    .select("*")
    .eq("id", collaborationId)
    .single();
  if (collabError || !collab) throw new Error("Collaboration not found");

  const expectedAmount = Math.round(Number(collab.agreed_amount) * (1 + BRAND_FEE));
  const paidAmount = Number(fedaTx.amount);
  const currency = typeof fedaTx.currency === "string"
    ? fedaTx.currency
    : String(fedaTx.currency?.iso ?? "");
  if (!Number.isInteger(paidAmount) || paidAmount !== expectedAmount) {
    throw new Error(`Payment amount mismatch: received ${paidAmount}, expected ${expectedAmount}`);
  }
  if (currency.toUpperCase() !== "XOF") throw new Error("Payment currency mismatch");
  if (metadataValue(metadata, "brand_id") !== String(collab.brand_id)) {
    throw new Error("Payment brand mismatch");
  }
  if (metadataValue(metadata, "creator_id") !== String(collab.creator_id)) {
    throw new Error("Payment creator mismatch");
  }

  const reference = `fedapay-${transactionId}`;
  const { error: txError } = await admin.from("transactions").insert({
    collaboration_id: collaborationId,
    user_id: collab.brand_id,
    type: "escrow",
    status: "pending",
    amount: collab.agreed_amount,
    fee: collab.platform_fee,
    net_amount: collab.creator_amount,
    gateway_amount: paidAmount,
    description: `Paiement Mobile Money - ${reference}`,
    reference,
  });
  if (txError && txError.code !== "23505") throw txError;

  const currentStatus = String(collab.status);
  const nextStatus = currentStatus === "pending_payment"
    ? "in_progress"
    : currentStatus === "content_submitted"
      ? "in_review"
      : currentStatus;

  let transitioned = false;
  if (nextStatus !== currentStatus) {
    const { data: updated, error: updateError } = await admin
      .from("collaborations")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", collaborationId)
      .eq("status", currentStatus)
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    transitioned = Boolean(updated);
  }

  if (transitioned) {
    const notification = nextStatus === "in_progress"
      ? { title: "💰 Paiement reçu", message: "La marque a payé. Vous pouvez commencer la collaboration." }
      : { title: "🔓 Contenu débloqué", message: "La marque a payé et votre contenu est maintenant en revue." };
    const { error: notificationError } = await admin.from("notifications").insert({
      user_id: collab.creator_id,
      type: "payment",
      ...notification,
    });
    if (notificationError) throw notificationError;
  }

  return { verified: true, paymentStatus: status, nextStatus, reference, collaborationId };
}
