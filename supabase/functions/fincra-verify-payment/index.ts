import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FINCRA_API_URL = "https://sandboxapi.fincra.com"; // TODO: Switch to https://api.fincra.com for production

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FINCRA-VERIFY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const fincraSecretKey = Deno.env.get("FINCRA_SECRET_KEY");
    const fincraBusinessId = Deno.env.get("FINCRA_BUSINESS_ID");
    if (!fincraSecretKey) throw new Error("FINCRA_SECRET_KEY is not set");
    if (!fincraBusinessId) throw new Error("FINCRA_BUSINESS_ID is not set");

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
    if (!user) throw new Error("User not authenticated");

    const { reference, collaborationId } = await req.json();
    if (!reference) throw new Error("reference is required");
    logStep("Verifying payment", { reference });

    // Call Fincra verify endpoint
    const verifyResponse = await fetch(
      `${FINCRA_API_URL}/checkout/payments/merchant-reference/${reference}`,
      {
        headers: {
          "api-key": fincraSecretKey,
          "x-business-id": fincraBusinessId,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    logStep("Fincra verify response", { status: verifyData.data?.status });

    if (!verifyResponse.ok || !verifyData.status) {
      throw new Error(`Fincra verify error: ${verifyData.message || "Unknown error"}`);
    }

    const paymentStatus = verifyData.data?.status;

    if (paymentStatus === "success" && collaborationId) {
      // Payment confirmed — update collaboration if not already done
      const { data: collab } = await supabaseClient
        .from("collaborations")
        .select("status")
        .eq("id", collaborationId)
        .single();

      if (collab && collab.status === "content_submitted") {
        // Update to in_review (same as webhook handler)
        await supabaseClient
          .from("collaborations")
          .update({
            status: "in_review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", collaborationId);

        logStep("Collaboration updated to in_review via verification");

        // Ensure wallet + escrow transaction
        const { data: collabFull } = await supabaseClient
          .from("collaborations")
          .select("*")
          .eq("id", collaborationId)
          .single();

        if (collabFull) {
          const { data: existingWallet } = await supabaseClient
            .from("wallets")
            .select("id")
            .eq("user_id", collabFull.creator_id)
            .maybeSingle();

          if (!existingWallet) {
            await supabaseClient.from("wallets").insert({ user_id: collabFull.creator_id });
          }

          await supabaseClient.from("transactions").insert({
            collaboration_id: collaborationId,
            user_id: collabFull.brand_id,
            type: "escrow",
            status: "completed",
            amount: collabFull.agreed_amount,
            fee: collabFull.platform_fee,
            net_amount: collabFull.creator_amount,
            description: `Paiement Fincra vérifié - ${reference}`,
            reference: reference,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        verified: true,
        paymentStatus: paymentStatus,
        amount: verifyData.data?.amount,
        currency: verifyData.data?.currency,
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
