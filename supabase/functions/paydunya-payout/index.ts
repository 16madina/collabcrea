import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// PayDunya Mobile Money provider mapping
const PAYDUNYA_PROVIDER_MAP: Record<string, string> = {
  wave: "wave-senegal",
  orange: "orange-money-senegal",
  mtn: "mtn-ci",
  moov: "moov-ci",
  free: "free-money-senegal",
};

// Country-specific provider suffixes
const PROVIDER_COUNTRY_MAP: Record<string, Record<string, string>> = {
  "Sénégal": {
    wave: "wave-senegal",
    orange: "orange-money-senegal",
    free: "free-money-senegal",
  },
  "Côte d'Ivoire": {
    wave: "wave-ci",
    orange: "orange-money-ci",
    mtn: "mtn-ci",
    moov: "moov-ci",
  },
  "Bénin": {
    mtn: "mtn-benin",
    moov: "moov-benin",
  },
  "Togo": {
    moov: "moov-togo",
  },
  "Burkina Faso": {
    orange: "orange-money-burkina",
    moov: "moov-burkina",
  },
  "Mali": {
    orange: "orange-money-mali",
    moov: "moov-mali",
  },
  "Cameroun": {
    orange: "orange-money-cameroun",
    mtn: "mtn-cameroun",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: only allow service_role or admin calls
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminId = userData.user.id;

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { withdrawal_request_id } = await req.json();

    if (!withdrawal_request_id) {
      return new Response(JSON.stringify({ error: "withdrawal_request_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch withdrawal request
    const { data: withdrawal, error: wError } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawal_request_id)
      .single();

    if (wError || !withdrawal) {
      return new Response(JSON.stringify({ error: "Demande de retrait introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (withdrawal.status !== "pending") {
      return new Response(JSON.stringify({ error: "Cette demande a déjà été traitée" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (withdrawal.method !== "mobile_money") {
      return new Response(
        JSON.stringify({ error: "Le payout automatique n'est disponible que pour Mobile Money" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's country for provider mapping
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("country, full_name")
      .eq("user_id", withdrawal.user_id)
      .single();

    const country = profile?.country || "Sénégal";
    const provider = withdrawal.mobile_provider?.toLowerCase() || "wave";

    // Resolve PayDunya withdraw_mode
    const countryProviders = PROVIDER_COUNTRY_MAP[country];
    const withdrawMode = countryProviders?.[provider] || PAYDUNYA_PROVIDER_MAP[provider] || "wave-senegal";

    // PayDunya API credentials
    const masterKey = Deno.env.get("PAYDUNYA_MASTER_KEY");
    const privateKey = Deno.env.get("PAYDUNYA_PRIVATE_KEY");
    const paydunyaToken = Deno.env.get("PAYDUNYA_TOKEN");

    if (!masterKey || !privateKey || !paydunyaToken) {
      console.error("PayDunya credentials not configured");
      return new Response(
        JSON.stringify({ error: "Configuration PayDunya manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as processing
    await supabaseAdmin
      .from("withdrawal_requests")
      .update({
        status: "processing",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal_request_id);

    // Call PayDunya Disbursement (PUSH) API
    // Docs: https://paydunya.com/docs/disbursement
    const paydunyaUrl = "https://app.paydunya.com/api/v1/disburse/get-paid";

    const paydunyaPayload = {
      account_alias: withdrawal.mobile_number,
      amount: withdrawal.amount,
      withdraw_mode: withdrawMode,
    };

    console.log("PayDunya payout request:", JSON.stringify(paydunyaPayload));

    const paydunyaResponse = await fetch(paydunyaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": masterKey,
        "PAYDUNYA-PRIVATE-KEY": privateKey,
        "PAYDUNYA-TOKEN": paydunyaToken,
      },
      body: JSON.stringify(paydunyaPayload),
    });

    const paydunyaResult = await paydunyaResponse.json();
    console.log("PayDunya response:", JSON.stringify(paydunyaResult));

    if (paydunyaResult.response_code === "00" || paydunyaResult.success) {
      // Payout successful
      const transactionRef = paydunyaResult.transaction_id || paydunyaResult.disburse_token || "";

      // Update pending_balance on wallet
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("pending_balance")
        .eq("id", withdrawal.wallet_id)
        .single();

      if (wallet) {
        const newPending = Math.max(0, (wallet.pending_balance || 0) - withdrawal.amount);
        await supabaseAdmin
          .from("wallets")
          .update({ pending_balance: newPending, updated_at: new Date().toISOString() })
          .eq("id", withdrawal.wallet_id);
      }

      // Mark withdrawal as completed
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          status: "completed",
          proof_url: `PayDunya TX: ${transactionRef}`,
        })
        .eq("id", withdrawal_request_id);

      // Log admin action
      await supabaseAdmin.from("admin_logs").insert({
        admin_id: adminId,
        target_user_id: withdrawal.user_id,
        action_type: "withdrawal_auto_payout",
        details: {
          withdrawal_id: withdrawal_request_id,
          amount: withdrawal.amount,
          provider: withdrawMode,
          paydunya_tx: transactionRef,
        },
      });

      // Notification to creator
      await supabaseAdmin.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "✅ Retrait effectué !",
        message: `Votre retrait de ${new Intl.NumberFormat("fr-FR").format(withdrawal.amount)} FCFA a été envoyé sur votre compte ${withdrawal.mobile_provider} (${withdrawal.mobile_number}).`,
        type: "success",
      });

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transactionRef,
          message: "Payout envoyé avec succès",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Payout failed - revert to pending
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({ status: "pending", reviewed_by: null, reviewed_at: null })
        .eq("id", withdrawal_request_id);

      const errorMsg = paydunyaResult.response_text || paydunyaResult.message || "Erreur PayDunya inconnue";
      console.error("PayDunya payout failed:", errorMsg);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Échec du payout PayDunya: ${errorMsg}`,
          paydunya_response: paydunyaResult,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Payout error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne lors du payout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
