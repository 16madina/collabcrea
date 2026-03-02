import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Country-specific provider suffixes
const PROVIDER_COUNTRY_MAP: Record<string, Record<string, string>> = {
  "Sénégal": {
    wave: "wave-senegal",
    orange: "orange-money-senegal",
    free: "free-money-senegal",
    expresso: "expresso-senegal",
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
    tmoney: "t-money-togo",
  },
  "Burkina Faso": {
    orange: "orange-money-burkina",
    moov: "moov-burkina-faso",
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

const DEFAULT_PROVIDER_MAP: Record<string, string> = {
  wave: "wave-senegal",
  orange: "orange-money-senegal",
  mtn: "mtn-ci",
  moov: "moov-ci",
  free: "free-money-senegal",
};

// Strip country code prefix from phone number
function stripCountryCode(phone: string): string {
  // Remove + prefix
  let cleaned = phone.replace(/^\+/, "");
  // Common West African country codes
  const countryCodes = ["225", "221", "229", "228", "226", "223", "237"];
  for (const code of countryCodes) {
    if (cleaned.startsWith(code)) {
      cleaned = cleaned.substring(code.length);
      break;
    }
  }
  return cleaned;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const withdrawMode = countryProviders?.[provider] || DEFAULT_PROVIDER_MAP[provider] || "wave-senegal";

    // PayDunya API credentials
    const masterKey = Deno.env.get("PAYDUNYA_MASTER_KEY");
    const privateKey = Deno.env.get("PAYDUNYA_PRIVATE_KEY");
    const paydunyaToken = Deno.env.get("PAYDUNYA_TOKEN");

    // Debug: log key prefixes (safe - only first chars)
    console.log("PayDunya keys check:", {
      masterKey: masterKey ? masterKey.substring(0, 8) + "..." : "MISSING",
      privateKey: privateKey ? privateKey.substring(0, 15) + "..." : "MISSING",
      token: paydunyaToken ? paydunyaToken.substring(0, 6) + "..." : "MISSING",
    });

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

    const paydunyaHeaders = {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": masterKey,
      "PAYDUNYA-PRIVATE-KEY": privateKey,
      "PAYDUNYA-TOKEN": paydunyaToken,
    };

    // account_alias must be WITHOUT country code per PayDunya docs
    const accountAlias = stripCountryCode(withdrawal.mobile_number || "");
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/paydunya-webhook`;

    // ===== STEP 1: Create disbursement invoice =====
    const invoicePayload = {
      account_alias: accountAlias,
      amount: withdrawal.amount,
      withdraw_mode: withdrawMode,
      callback_url: callbackUrl,
    };

    console.log("PayDunya Step 1 - get-invoice:", JSON.stringify(invoicePayload));

    const baseUrl = "https://app.paydunya.com/api/v2";

    const invoiceResponse = await fetch(
      `${baseUrl}/disburse/get-invoice`,
      {
        method: "POST",
        headers: paydunyaHeaders,
        body: JSON.stringify(invoicePayload),
      }
    );

    const invoiceText = await invoiceResponse.text();
    let invoiceResult: Record<string, unknown>;
    try {
      invoiceResult = JSON.parse(invoiceText);
    } catch {
      console.error("PayDunya get-invoice returned non-JSON:", invoiceText.substring(0, 500));
      // Log the error
      await supabaseAdmin.from("paydunya_logs").insert({
        event_type: "payout_error",
        withdrawal_request_id,
        payload: { error: "Non-JSON response from get-invoice", body: invoiceText.substring(0, 1000) },
        status: "failed",
        amount: withdrawal.amount,
        matched: true,
      });
      // Revert to pending
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({ status: "pending", reviewed_by: null, reviewed_at: null })
        .eq("id", withdrawal_request_id);

      return new Response(
        JSON.stringify({ success: false, error: "PayDunya a retourné une réponse invalide. Vérifiez vos clés API." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PayDunya get-invoice response:", JSON.stringify(invoiceResult));

    // Log step 1
    await supabaseAdmin.from("paydunya_logs").insert({
      event_type: "payout_get_invoice",
      withdrawal_request_id,
      payload: invoiceResult,
      response_code: String(invoiceResult.response_code || ""),
      status: invoiceResult.response_code === "00" ? "created" : "failed",
      transaction_id: String(invoiceResult.disburse_token || ""),
      amount: withdrawal.amount,
      matched: true,
    });

    if (invoiceResult.response_code !== "00" || !invoiceResult.disburse_token) {
      // Step 1 failed - revert
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({ status: "pending", reviewed_by: null, reviewed_at: null })
        .eq("id", withdrawal_request_id);

      const errorMsg = String(invoiceResult.response_text || invoiceResult.message || "Erreur lors de la création du décaissement");
      return new Response(
        JSON.stringify({ success: false, error: `PayDunya: ${errorMsg}`, paydunya_response: invoiceResult }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const disburseToken = String(invoiceResult.disburse_token);

    // Store token in proof_url for webhook matching
    await supabaseAdmin
      .from("withdrawal_requests")
      .update({ proof_url: `PayDunya Token: ${disburseToken}` })
      .eq("id", withdrawal_request_id);

    // ===== STEP 2: Submit disbursement =====
    const submitPayload = {
      disburse_invoice: disburseToken,
    };

    console.log("PayDunya Step 2 - submit-invoice:", JSON.stringify(submitPayload));

    const submitResponse = await fetch(
      `${baseUrl}/disburse/submit-invoice`,
      {
        method: "POST",
        headers: paydunyaHeaders,
        body: JSON.stringify(submitPayload),
      }
    );

    const submitText = await submitResponse.text();
    let submitResult: Record<string, unknown>;
    try {
      submitResult = JSON.parse(submitText);
    } catch {
      console.error("PayDunya submit-invoice returned non-JSON:", submitText.substring(0, 500));
      await supabaseAdmin.from("paydunya_logs").insert({
        event_type: "payout_submit_error",
        withdrawal_request_id,
        payload: { error: "Non-JSON response from submit-invoice", body: submitText.substring(0, 1000) },
        status: "failed",
        transaction_id: disburseToken,
        amount: withdrawal.amount,
        matched: true,
      });
      // Keep as processing - callback may still arrive
      return new Response(
        JSON.stringify({ success: false, error: "Réponse invalide lors de la soumission. Le callback pourrait encore arriver." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PayDunya submit-invoice response:", JSON.stringify(submitResult));

    // Log step 2
    await supabaseAdmin.from("paydunya_logs").insert({
      event_type: "payout_submit_invoice",
      withdrawal_request_id,
      payload: submitResult,
      response_code: String(submitResult.response_code || ""),
      status: String(submitResult.status || (submitResult.response_code === "00" ? "success" : "failed")),
      transaction_id: String(submitResult.transaction_id || disburseToken),
      amount: withdrawal.amount,
      matched: true,
    });

    const isSuccess = submitResult.response_code === "00";
    const isPending = String(submitResult.status || "").toLowerCase() === "pending";

    if (isSuccess && !isPending) {
      // Immediate success
      const transactionRef = String(submitResult.transaction_id || disburseToken);

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

      await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          status: "completed",
          proof_url: `PayDunya TX: ${transactionRef}`,
        })
        .eq("id", withdrawal_request_id);

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

      await supabaseAdmin.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "✅ Retrait effectué !",
        message: `Votre retrait de ${new Intl.NumberFormat("fr-FR").format(withdrawal.amount)} FCFA a été envoyé sur votre compte ${withdrawal.mobile_provider} (${withdrawal.mobile_number}).`,
        type: "success",
      });

      return new Response(
        JSON.stringify({ success: true, transaction_id: transactionRef, message: "Payout envoyé avec succès" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (isSuccess && isPending) {
      // Pending - will be confirmed via IPN callback
      await supabaseAdmin.from("admin_logs").insert({
        admin_id: adminId,
        target_user_id: withdrawal.user_id,
        action_type: "withdrawal_auto_payout_pending",
        details: {
          withdrawal_id: withdrawal_request_id,
          amount: withdrawal.amount,
          provider: withdrawMode,
          disburse_token: disburseToken,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          pending: true,
          disburse_token: disburseToken,
          message: "Payout en cours de traitement. Le statut sera mis à jour automatiquement via le callback.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Failed - revert to pending
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({ status: "pending", reviewed_by: null, reviewed_at: null })
        .eq("id", withdrawal_request_id);

      const errorMsg = String(submitResult.response_text || submitResult.message || "Erreur PayDunya inconnue");
      console.error("PayDunya submit-invoice failed:", errorMsg);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Échec du payout PayDunya: ${errorMsg}`,
          paydunya_response: submitResult,
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
