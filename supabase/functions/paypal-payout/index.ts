import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Approximate exchange rates FCFA -> target currency
const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1 / 656,
  USD: 1 / 610,
};

async function getPayPalAccessToken(clientId: string, clientSecret: string, sandbox: boolean): Promise<string> {
  const baseUrl = sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`PayPal auth error: ${JSON.stringify(data)}`);
  }
  return data.access_token;
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

    // Verify admin role
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminId = claimsData.claims.sub;

    // Check admin role
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { withdrawal_id } = await req.json();
    if (!withdrawal_id) {
      return new Response(JSON.stringify({ error: "withdrawal_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the withdrawal request
    const { data: withdrawal, error: wError } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawal_id)
      .single();

    if (wError || !withdrawal) {
      return new Response(JSON.stringify({ error: "Demande introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (withdrawal.method !== "paypal") {
      return new Response(JSON.stringify({ error: "Cette demande n'est pas un retrait PayPal" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (withdrawal.status !== "pending") {
      return new Response(JSON.stringify({ error: "Cette demande a déjà été traitée" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_SECRET");

    if (!paypalClientId || !paypalSecret) {
      return new Response(
        JSON.stringify({ error: "Clés PayPal non configurées" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if sandbox
    const isSandbox = paypalClientId.startsWith("A") ? false : true; // sandbox keys start with different prefix
    // Actually just check env
    const paypalMode = Deno.env.get("PAYPAL_MODE") || "sandbox";
    const useSandbox = paypalMode === "sandbox";

    const currency = withdrawal.payout_currency || "EUR";
    const rate = EXCHANGE_RATES[currency];
    if (!rate) {
      return new Response(JSON.stringify({ error: `Devise non supportée: ${currency}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate amount in target currency (FCFA amount * rate)
    // Deduct 2% PayPal fee from the creator's amount
    const grossAmount = withdrawal.amount * rate;
    const paypalFee = grossAmount * 0.02;
    const netAmount = grossAmount - paypalFee;
    const formattedAmount = netAmount.toFixed(2);

    console.log(`PayPal payout: ${withdrawal.amount} FCFA -> ${formattedAmount} ${currency} (fee: ${paypalFee.toFixed(2)})`);

    // Update status to processing
    await supabaseAdmin
      .from("withdrawal_requests")
      .update({ status: "processing", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
      .eq("id", withdrawal_id);

    try {
      const accessToken = await getPayPalAccessToken(paypalClientId, paypalSecret, useSandbox);
      const baseUrl = useSandbox
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

      const batchId = `collabcrea_${withdrawal_id.slice(0, 8)}_${Date.now()}`;

      const payoutPayload = {
        sender_batch_header: {
          sender_batch_id: batchId,
          recipient_type: "EMAIL",
          email_subject: "Vous avez reçu un paiement de CollabCrea",
          email_message: "Votre retrait CollabCrea a été traité. Merci d'utiliser notre plateforme !",
        },
        items: [
          {
            amount: {
              value: formattedAmount,
              currency: currency,
            },
            receiver: withdrawal.paypal_email,
            recipient_type: "EMAIL",
            note: `Retrait CollabCrea #${withdrawal_id.slice(0, 8)}`,
            sender_item_id: withdrawal_id,
          },
        ],
      };

      const payoutResponse = await fetch(`${baseUrl}/v1/payments/payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payoutPayload),
      });

      const payoutResult = await payoutResponse.json();
      console.log("PayPal payout response:", JSON.stringify(payoutResult));

      if (!payoutResponse.ok) {
        // Revert to pending
        await supabaseAdmin
          .from("withdrawal_requests")
          .update({ status: "pending", reviewed_by: null, reviewed_at: null })
          .eq("id", withdrawal_id);

        return new Response(
          JSON.stringify({ error: "Erreur PayPal", details: payoutResult }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const batchStatus = payoutResult.batch_header?.batch_status;

      if (batchStatus === "SUCCESS" || batchStatus === "PENDING" || batchStatus === "PROCESSING") {
        // Mark as completed
        await supabaseAdmin
          .from("withdrawal_requests")
          .update({
            status: "completed",
            transaction_id: payoutResult.batch_header?.payout_batch_id,
          })
          .eq("id", withdrawal_id);

        // Update wallet - clear pending balance
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("pending_balance")
          .eq("id", withdrawal.wallet_id)
          .single();

        if (wallet) {
          await supabaseAdmin
            .from("wallets")
            .update({
              pending_balance: Math.max(0, (wallet.pending_balance || 0) - withdrawal.amount),
            })
            .eq("id", withdrawal.wallet_id);
        }

        // Notify user
        await supabaseAdmin.from("notifications").insert({
          user_id: withdrawal.user_id,
          title: "💸 Retrait PayPal envoyé !",
          message: `Votre retrait de ${formattedAmount} ${currency} a été envoyé sur ${withdrawal.paypal_email}.`,
          type: "info",
        });

        return new Response(
          JSON.stringify({
            success: true,
            batch_id: payoutResult.batch_header?.payout_batch_id,
            amount: formattedAmount,
            currency,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: batchStatus, details: payoutResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (paypalError) {
      console.error("PayPal API error:", paypalError);

      // Revert to pending
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({ status: "pending", reviewed_by: null, reviewed_at: null })
        .eq("id", withdrawal_id);

      return new Response(
        JSON.stringify({ error: "Erreur de communication avec PayPal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
