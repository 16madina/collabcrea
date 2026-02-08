import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe keys verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is set
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      // For development/testing without signature verification
      event = JSON.parse(body);
      logStep("Webhook parsed (no signature verification)");
    }

    logStep("Event type", { type: event.type });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { sessionId: session.id });

      const metadata = session.metadata;
      if (!metadata?.collaboration_id) {
        logStep("No collaboration_id in metadata, skipping");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const collaborationId = metadata.collaboration_id;
      const brandId = metadata.brand_id;
      const agreedAmount = parseInt(metadata.agreed_amount || "0");
      const platformFee = parseInt(metadata.platform_fee || "0");
      const creatorAmount = parseInt(metadata.creator_amount || "0");

      logStep("Processing collaboration payment", {
        collaborationId,
        agreedAmount,
        platformFee,
        creatorAmount,
      });

      // Create escrow transaction
      const { error: txError } = await supabase.from("transactions").insert({
        collaboration_id: collaborationId,
        user_id: brandId,
        type: "escrow",
        status: "completed",
        amount: agreedAmount,
        fee: platformFee,
        net_amount: creatorAmount,
        description: `Paiement Stripe - ${session.payment_intent}`,
        reference: session.payment_intent as string,
      });

      if (txError) {
        logStep("Error creating transaction", { error: txError.message });
        throw txError;
      }
      logStep("Escrow transaction created");

      // Update collaboration status to in_progress
      const { error: updateError } = await supabase
        .from("collaborations")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", collaborationId);

      if (updateError) {
        logStep("Error updating collaboration", { error: updateError.message });
        throw updateError;
      }
      logStep("Collaboration status updated to in_progress");

      // Create notification for creator
      const { data: collab } = await supabase
        .from("collaborations")
        .select("creator_id, offer:offers(title)")
        .eq("id", collaborationId)
        .single();

      if (collab) {
        await supabase.from("notifications").insert({
          user_id: collab.creator_id,
          type: "payment",
          title: "Paiement reçu",
          message: `La marque a payé pour "${collab.offer?.title}". Vous pouvez maintenant livrer le contenu.`,
        });
        logStep("Creator notification sent");
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logStep("Payment failed", { paymentIntentId: paymentIntent.id });
      // Could update collaboration status or notify brand here
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
