import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FINCRA_API_URL = "https://sandboxapi.fincra.com"; // TODO: Switch to https://api.fincra.com for production

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FINCRA-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const fincraSecretKey = Deno.env.get("FINCRA_SECRET_KEY");
    const fincraPublicKey = Deno.env.get("FINCRA_PUBLIC_KEY");
    const fincraBusinessId = Deno.env.get("FINCRA_BUSINESS_ID");

    if (!fincraSecretKey) throw new Error("FINCRA_SECRET_KEY is not set");
    if (!fincraPublicKey) throw new Error("FINCRA_PUBLIC_KEY is not set");
    if (!fincraBusinessId) throw new Error("FINCRA_BUSINESS_ID is not set");
    logStep("Fincra keys verified");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

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
      .select("title")
      .eq("id", collab.offer_id)
      .single();

    // Get creator name
    const { data: creator } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", collab.creator_id)
      .single();

    // Get brand profile for name
    const { data: brand } = await supabaseClient
      .from("profiles")
      .select("company_name, full_name")
      .eq("user_id", collab.brand_id)
      .single();

    logStep("Collaboration found", { amount: collab.agreed_amount, status: collab.status });

    // Verify the user is the brand owner
    if (collab.brand_id !== user.id) {
      throw new Error("Only the brand can pay for this collaboration");
    }

    // Verify collaboration is awaiting payment
    if (collab.status !== "content_submitted" && collab.status !== "pending_payment") {
      throw new Error(`Invalid collaboration status: ${collab.status}. Expected content_submitted or pending_payment.`);
    }

    const creatorName = creator?.full_name || "Créateur";
    const offerTitle = offer?.title || "Collaboration";
    const brandName = brand?.company_name || brand?.full_name || "Marque";

    // Generate unique reference
    const reference = `collab-${collaborationId}-${Date.now()}`;

    const origin = req.headers.get("origin") || "https://collabcrea.lovable.app";

    // Convert FCFA to NGN (Fincra doesn't support XOF)
    // Using approximate rate: 1 FCFA ≈ 0.93 NGN (adjust as needed)
    const FCFA_TO_NGN_RATE = 0.93;
    const amountInNGN = Math.ceil(collab.agreed_amount * FCFA_TO_NGN_RATE);

    // Create Fincra checkout payment
    const checkoutPayload = {
      amount: amountInNGN,
      currency: "NGN",
      customer: {
        name: brandName,
        email: user.email,
      },
      feeBearer: "customer",
      reference: reference,
      redirectUrl: `${origin}/brand/collabs?payment=success&collaboration=${collaborationId}&reference=${reference}`,
      settlementDestination: "wallet",
      metadata: {
        collaboration_id: collaborationId,
        brand_id: collab.brand_id,
        creator_id: collab.creator_id,
        agreed_amount_fcfa: collab.agreed_amount.toString(),
        agreed_amount_ngn: amountInNGN.toString(),
        platform_fee: collab.platform_fee.toString(),
        creator_amount: collab.creator_amount.toString(),
      },
      successMessage: `Paiement réussi pour "${offerTitle}" - Créateur: ${creatorName}`,
    };

    logStep("Creating Fincra checkout", { amountFCFA: collab.agreed_amount, amountNGN: amountInNGN, currency: "NGN" });

    const fincraResponse = await fetch(`${FINCRA_API_URL}/checkout/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": fincraSecretKey,
        "x-pub-key": fincraPublicKey,
        "x-business-id": fincraBusinessId,
      },
      body: JSON.stringify(checkoutPayload),
    });

    const fincraData = await fincraResponse.json();

    if (!fincraResponse.ok || !fincraData.status) {
      logStep("Fincra checkout error", { status: fincraResponse.status, data: fincraData });
      throw new Error(`Fincra error: ${fincraData.message || JSON.stringify(fincraData)}`);
    }

    logStep("Fincra checkout created", { link: fincraData.data?.link, reference });

    // Store the reference in the collaboration for later verification
    await supabaseClient
      .from("collaborations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", collaborationId);

    return new Response(
      JSON.stringify({
        url: fincraData.data.link,
        reference: reference,
        payCode: fincraData.data.payCode,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
