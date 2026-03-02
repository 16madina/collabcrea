import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * PayDunya IPN (Instant Payment Notification) Webhook
 * 
 * Receives async notifications from PayDunya about disbursement status changes.
 * Updates withdrawal_requests and wallets accordingly.
 * 
 * IPN Endpoint URL to configure in PayDunya dashboard:
 * https://fkfdjibqpmdaobjrryja.supabase.co/functions/v1/paydunya-webhook
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("PayDunya IPN received:", JSON.stringify(body));

    // PayDunya IPN payload fields:
    // - response_code: "00" = success
    // - response_text: description
    // - transaction_id / disburse_token: reference
    // - status: "completed", "failed", etc.
    // - custom_data: any data we passed (we use withdrawal_request_id)

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract relevant fields from PayDunya IPN
    const responseCode = body.response_code;
    const status = body.status?.toLowerCase();
    const transactionId = body.transaction_id || body.disburse_token || body.token || "";
    const amount = body.amount;
    const responseText = body.response_text || body.message || "";

    // Try to find the withdrawal by matching the transaction reference
    // PayDunya stores the proof_url as "PayDunya TX: <ref>" during payout
    let withdrawal = null;

    if (transactionId) {
      const { data } = await supabaseAdmin
        .from("withdrawal_requests")
        .select("*")
        .eq("status", "processing")
        .ilike("proof_url", `%${transactionId}%`)
        .maybeSingle();
      withdrawal = data;
    }

    // Fallback: match by amount + status=processing if no TX match
    if (!withdrawal && amount) {
      const { data } = await supabaseAdmin
        .from("withdrawal_requests")
        .select("*")
        .eq("status", "processing")
        .eq("amount", amount)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      withdrawal = data;
    }

    if (!withdrawal) {
      console.log("IPN: No matching withdrawal found for TX:", transactionId);
      // Return 200 to acknowledge receipt (avoid retries)
      return new Response(
        JSON.stringify({ received: true, matched: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("IPN: Matched withdrawal:", withdrawal.id);

    const isSuccess = responseCode === "00" || status === "completed" || status === "success";
    const isFailed = responseCode !== "00" && (status === "failed" || status === "error" || status === "reversed");

    if (isSuccess && withdrawal.status === "processing") {
      // Payout confirmed - finalize
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
          proof_url: `PayDunya TX: ${transactionId} (IPN confirmed)`,
        })
        .eq("id", withdrawal.id);

      // Notify creator
      await supabaseAdmin.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "✅ Retrait confirmé !",
        message: `Votre retrait de ${new Intl.NumberFormat("fr-FR").format(withdrawal.amount)} FCFA a été confirmé et envoyé.`,
        type: "success",
      });

      console.log("IPN: Withdrawal completed:", withdrawal.id);

    } else if (isFailed && withdrawal.status === "processing") {
      // Payout failed - restore balance
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("balance, pending_balance")
        .eq("id", withdrawal.wallet_id)
        .single();

      if (wallet) {
        const newPending = Math.max(0, (wallet.pending_balance || 0) - withdrawal.amount);
        await supabaseAdmin
          .from("wallets")
          .update({
            balance: wallet.balance + withdrawal.amount,
            pending_balance: newPending,
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.wallet_id);
      }

      await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          rejection_reason: `Échec PayDunya: ${responseText}`,
        })
        .eq("id", withdrawal.id);

      // Notify creator
      await supabaseAdmin.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "❌ Retrait échoué",
        message: `Votre retrait de ${new Intl.NumberFormat("fr-FR").format(withdrawal.amount)} FCFA a échoué. Votre solde a été restauré. ${responseText ? `Raison: ${responseText}` : ""}`,
        type: "error",
      });

      // Notify admins
      const { data: admins } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      for (const admin of admins || []) {
        await supabaseAdmin.from("notifications").insert({
          user_id: admin.user_id,
          title: "⚠️ Payout échoué",
          message: `Le payout de ${new Intl.NumberFormat("fr-FR").format(withdrawal.amount)} FCFA pour le retrait ${withdrawal.id} a échoué: ${responseText}`,
          type: "error",
        });
      }

      console.log("IPN: Withdrawal failed, balance restored:", withdrawal.id);
    } else {
      console.log("IPN: No action needed. Status:", status, "Withdrawal status:", withdrawal.status);
    }

    return new Response(
      JSON.stringify({ received: true, matched: true, withdrawal_id: withdrawal.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("IPN webhook error:", error);
    // Always return 200 to avoid PayDunya retries on our errors
    return new Response(
      JSON.stringify({ received: true, error: "Internal processing error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
