import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[FEDAPAY-VERIFY] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const fedapayBase = () =>
  (Deno.env.get("FEDAPAY_MODE") || "live") === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

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

    const { transactionId, collaborationId } = await req.json();
    if (!transactionId || !collaborationId) {
      throw new Error("transactionId and collaborationId required");
    }

    const res = await fetch(`${fedapayBase()}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const json = await res.json();
    if (!res.ok) {
      log("Fetch transaction failed", json);
      throw new Error(json?.message || "Transaction FedaPay introuvable");
    }

    const fedaTx = json?.["v1/transaction"];
    const paymentStatus: string = fedaTx?.status || "unknown";
    const isPaid = ["approved", "transferred"].includes(paymentStatus);

    if (!isPaid) {
      return new Response(JSON.stringify({ verified: false, paymentStatus }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: collab, error: collabError } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .single();
    if (collabError || !collab) throw new Error("Collaboration not found");
    if (collab.brand_id !== user.id) throw new Error("Forbidden");

    const reference = `fedapay-${transactionId}`;

    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (!existingTx) {
      await supabase.from("transactions").insert({
        collaboration_id: collaborationId,
        user_id: collab.brand_id,
        type: "escrow",
        status: "pending",
        amount: collab.agreed_amount,
        fee: collab.platform_fee,
        net_amount: collab.creator_amount,
        description: `Paiement FedaPay - ${reference}`,
        reference,
      });
    }

    let nextStatus = collab.status;
    if (collab.status === "pending_payment") nextStatus = "in_progress";
    else if (collab.status === "content_submitted") nextStatus = "in_review";

    if (nextStatus !== collab.status) {
      await supabase
        .from("collaborations")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", collaborationId);
    }

    if (nextStatus === "in_progress") {
      await supabase.from("notifications").insert({
        user_id: collab.creator_id,
        type: "payment",
        title: "💰 Paiement reçu",
        message: "La marque a payé. Vous pouvez commencer la collaboration.",
      });
    } else if (nextStatus === "in_review") {
      await supabase.from("notifications").insert({
        user_id: collab.creator_id,
        type: "payment",
        title: "🔓 Contenu débloqué",
        message: "La marque a payé et votre contenu est maintenant en revue.",
      });
    }

    log("Verified", { transactionId, nextStatus });

    return new Response(JSON.stringify({ verified: true, nextStatus, reference }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
