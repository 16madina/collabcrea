import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Payment service unavailable");

    const admin = createClient(url, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Non autorisé" }, 401);
    const { data: userData, error: userError } = await admin.auth.getUser(authHeader.slice(7));
    if (userError || !userData.user) return json({ error: "Non autorisé" }, 401);

    const body = await req.json().catch(() => null);
    const collaborationId = String(body?.collaborationId ?? "");
    const reference = String(body?.reference ?? body?.customId ?? "");
    const status = String(body?.status ?? "").toUpperCase();
    if (!UUID.test(collaborationId) || !reference) {
      return json({ error: "Paramètres de paiement invalides" }, 400);
    }
    if (status && !["SUCCESSFUL", "SUCCESS"].includes(status)) {
      return json({ verified: false, paymentStatus: status.toLowerCase() });
    }

    const { data: collab, error: collabError } = await admin
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .maybeSingle();
    if (collabError || !collab) return json({ error: "Collaboration introuvable" }, 404);
    if (collab.brand_id !== userData.user.id) return json({ error: "Accès refusé" }, 403);

    const txReference = `feexpay-${reference}`;
    const gatewayAmount = Number(body?.amount);
    const { error: txError } = await admin.from("transactions").insert({
      collaboration_id: collaborationId,
      user_id: collab.brand_id,
      type: "escrow",
      status: "pending",
      amount: collab.agreed_amount,
      fee: collab.platform_fee,
      net_amount: collab.creator_amount,
      gateway_amount: Number.isFinite(gatewayAmount) ? Math.round(gatewayAmount) : null,
      description: `Paiement Mobile Money - ${txReference}`,
      reference: txReference,
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

    return json({ verified: true, nextStatus, reference: txReference, collaborationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FEEXPAY-VERIFY]", message);
    return json({ error: "La vérification du paiement a échoué" }, 500);
  }
});
