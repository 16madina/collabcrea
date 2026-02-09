import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CONFIRM-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) throw new Error("paymentIntentId is required");
    logStep("Payment Intent ID received", { paymentIntentId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve PaymentIntent to check status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    logStep("Payment Intent retrieved", { status: paymentIntent.status });

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({
          success: false,
          status: paymentIntent.status,
          message: "Le paiement n'est pas encore confirmé",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get collaboration ID from metadata
    const collaborationId = paymentIntent.metadata.collaboration_id;
    if (!collaborationId) {
      throw new Error("Collaboration ID not found in payment metadata");
    }

    // Get collaboration
    const { data: collab, error: collabError } = await supabaseClient
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .single();

    if (collabError || !collab) {
      throw new Error(`Collaboration not found: ${collabError?.message}`);
    }

    // Verify the user is the brand owner
    if (collab.brand_id !== user.id) {
      throw new Error("Only the brand can confirm this payment");
    }

    // Check if already processed
    if (collab.status !== "pending_payment") {
      logStep("Collaboration already processed", { status: collab.status });
      return new Response(
        JSON.stringify({
          success: true,
          status: collab.status,
          message: "Paiement déjà traité",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Update collaboration status to in_progress
    const { error: updateError } = await supabaseClient
      .from("collaborations")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", collaborationId);

    if (updateError) {
      throw new Error(`Failed to update collaboration: ${updateError.message}`);
    }
    logStep("Collaboration updated to in_progress");

    // Get or create wallet for creator
    let { data: wallet } = await supabaseClient
      .from("wallets")
      .select("id")
      .eq("user_id", collab.creator_id)
      .single();

    if (!wallet) {
      const { data: newWallet, error: walletError } = await supabaseClient
        .from("wallets")
        .insert({ user_id: collab.creator_id })
        .select()
        .single();
      
      if (walletError) {
        logStep("Warning: Failed to create wallet", { error: walletError.message });
      } else {
        wallet = newWallet;
      }
    }

    // Create escrow transaction
    const { error: transactionError } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: collab.creator_id,
        wallet_id: wallet?.id,
        collaboration_id: collaborationId,
        type: "escrow",
        amount: collab.agreed_amount,
        fee: collab.platform_fee,
        net_amount: collab.creator_amount,
        status: "pending",
        description: `Paiement en séquestre - Collaboration`,
        reference: paymentIntentId,
      });

    if (transactionError) {
      logStep("Warning: Failed to create transaction", { error: transactionError.message });
    } else {
      logStep("Escrow transaction created");
    }

    // Send notification to creator
    try {
      const { data: offer } = await supabaseClient
        .from("offers")
        .select("title")
        .eq("id", collab.offer_id)
        .single();

      await supabaseClient.from("notifications").insert({
        user_id: collab.creator_id,
        title: "Paiement reçu ! 🎉",
        message: `Le paiement pour "${offer?.title || "la collaboration"}" a été effectué. L'argent est en séquestre et vous sera versé après validation du contenu.`,
        type: "success",
      });
      logStep("Notification sent to creator");
    } catch (notifError) {
      logStep("Warning: Failed to send notification", { error: notifError });
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "in_progress",
        message: "Paiement confirmé avec succès",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
