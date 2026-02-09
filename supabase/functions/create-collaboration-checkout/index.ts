import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { collaborationId } = await req.json();
    if (!collaborationId) throw new Error("collaborationId is required");
    logStep("Collaboration ID received", { collaborationId });

    // Get collaboration details
    const { data: collab, error: collabError } = await supabaseClient
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .single();

    if (collabError || !collab) {
      throw new Error(`Collaboration not found: ${collabError?.message}`);
    }

    // Get offer details
    const { data: offer } = await supabaseClient
      .from("offers")
      .select("title, logo_url")
      .eq("id", collab.offer_id)
      .single();

    // Get creator name
    const { data: creator } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", collab.creator_id)
      .single();
    logStep("Collaboration found", { amount: collab.agreed_amount, status: collab.status });

    // Verify the user is the brand owner
    if (collab.brand_id !== user.id) {
      throw new Error("Only the brand can pay for this collaboration");
    }

    // Verify collaboration is pending payment
    if (collab.status !== "pending_payment") {
      throw new Error(`Invalid collaboration status: ${collab.status}`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    // Create line item description
    const creatorName = creator?.full_name || "Créateur";
    const offerTitle = offer?.title || "Collaboration";
    const description = `${offerTitle} - Créateur: ${creatorName}`;

    // Amount in centimes (FCFA uses centimes for Stripe)
    // Note: For XOF (FCFA), Stripe expects the amount in the smallest currency unit
    const amountInCentimes = collab.agreed_amount;

    logStep("Creating checkout session", { amount: amountInCentimes, currency: "xof" });

    const origin = req.headers.get("origin") || "https://collabcrea.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "xof", // FCFA
            product_data: {
              name: offerTitle,
              description: description,
              images: offer?.logo_url ? [offer.logo_url] : [],
            },
            unit_amount: amountInCentimes,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/brand/collabs?payment=success&collaboration=${collaborationId}`,
      cancel_url: `${origin}/brand/collabs?payment=cancelled&collaboration=${collaborationId}`,
      metadata: {
        collaboration_id: collaborationId,
        brand_id: collab.brand_id,
        creator_id: collab.creator_id,
        agreed_amount: collab.agreed_amount.toString(),
        platform_fee: collab.platform_fee.toString(),
        creator_amount: collab.creator_amount.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
