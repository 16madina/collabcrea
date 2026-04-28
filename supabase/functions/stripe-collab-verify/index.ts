import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-COLLAB-VERIFY] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const { sessionId, paymentIntentId, collaborationId } = await req.json();
    if (!collaborationId) throw new Error("collaborationId required");
    if (!sessionId && !paymentIntentId) throw new Error("sessionId or paymentIntentId required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let isPaid = false;
    let reference = "";
    let paymentStatus = "";

    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      log("PI retrieved", { id: pi.id, status: pi.status });
      paymentStatus = pi.status;
      isPaid = pi.status === "succeeded";
      reference = `stripe-pi-${pi.id}`;
    } else {
      const session = await stripe.checkout.sessions.retrieve(sessionId!);
      log("Session retrieved", { id: session.id, status: session.payment_status });
      paymentStatus = session.payment_status;
      isPaid = session.payment_status === "paid";
      reference = `stripe-${session.id}`;
    }

    if (!isPaid) {
      return new Response(
        JSON.stringify({ verified: false, paymentStatus }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { data: collab, error: collabError } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .single();
    if (collabError || !collab) throw new Error("Collaboration not found");
    if (collab.brand_id !== user.id) throw new Error("Forbidden");

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
        description: `Paiement Stripe - ${session.id}`,
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

    return new Response(
      JSON.stringify({ verified: true, nextStatus, reference }),
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
