import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FINCRA_API_URL = "https://sandboxapi.fincra.com"; // TODO: Switch to https://api.fincra.com for production

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FINCRA-PAYOUT] ${step}${detailsStr}`);
};

// Mobile money codes for Fincra
const MOBILE_MONEY_CODES: Record<string, string> = {
  // Côte d'Ivoire
  "orange_ci": "ORANGE_CI",
  "wave_ci": "WAVE_CI", 
  "mtn_ci": "MTN_CI",
  // Sénégal
  "orange_sn": "ORANGE_SN",
  "wave_sn": "WAVE_SN",
  // Cameroun
  "orange_cm": "ORANGE_CM",
  "mtn_cm": "MTN_CM",
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This function can be called by admin or by the system (approve-content)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const { withdrawalRequestId } = await req.json();
    if (!withdrawalRequestId) throw new Error("withdrawalRequestId is required");

    // Get withdrawal request
    const { data: withdrawal, error: wError } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawalRequestId)
      .single();

    if (wError || !withdrawal) {
      throw new Error(`Withdrawal request not found: ${wError?.message}`);
    }

    if (withdrawal.status !== "pending" && withdrawal.status !== "approved") {
      throw new Error(`Invalid withdrawal status: ${withdrawal.status}`);
    }

    // Get creator profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, residence_country")
      .eq("user_id", withdrawal.user_id)
      .single();

    const fullName = profile?.full_name || "Créateur";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Créateur";
    const lastName = nameParts.slice(1).join(" ") || "CollabCrea";

    // Determine mobile money code based on provider and country
    const country = (profile?.residence_country || "CI").toUpperCase();
    const provider = (withdrawal.mobile_provider || "wave").toLowerCase();
    const mobileMoneyCodeKey = `${provider}_${country.toLowerCase()}`;
    const mobileMoneyCode = MOBILE_MONEY_CODES[mobileMoneyCodeKey] || `${provider.toUpperCase()}_${country}`;

    logStep("Initiating payout", {
      amount: withdrawal.amount,
      provider: withdrawal.mobile_provider,
      mobileMoneyCode,
      country,
    });

    // Create Fincra payout
    const payoutPayload = {
      business: fincraBusinessId,
      sourceCurrency: "XOF",
      destinationCurrency: "XOF",
      amount: withdrawal.amount.toString(),
      description: `Paiement créateur CollabCrea - ${fullName}`,
      paymentDestination: "mobile_money_wallet",
      customerReference: withdrawalRequestId,
      beneficiary: {
        firstName: firstName,
        lastName: lastName,
        accountHolderName: fullName,
        accountNumber: withdrawal.mobile_number || "",
        country: country === "CI" ? "CI" : country === "SN" ? "SN" : country === "CM" ? "CM" : "CI",
        email: "",
        phone: withdrawal.mobile_number || "",
        type: "individual",
        mobileMoneyCode: mobileMoneyCode,
      },
    };

    const payoutResponse = await fetch(`${FINCRA_API_URL}/disbursements/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": fincraSecretKey,
      },
      body: JSON.stringify(payoutPayload),
    });

    const payoutData = await payoutResponse.json();

    if (!payoutResponse.ok) {
      logStep("Fincra payout error", { status: payoutResponse.status, data: payoutData });
      throw new Error(`Fincra payout error: ${payoutData.message || JSON.stringify(payoutData)}`);
    }

    logStep("Payout initiated", { reference: payoutData.data?.reference });

    // Update withdrawal status to approved/processing
    await supabase
      .from("withdrawal_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalRequestId);

    logStep("Withdrawal request updated to approved");

    return new Response(
      JSON.stringify({
        success: true,
        reference: payoutData.data?.reference,
        status: payoutData.data?.status,
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
