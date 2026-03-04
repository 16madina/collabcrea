import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * PayDunya IPN (Instant Payment Notification) Webhook
 * 
 * Endpoint URL: https://fkfdjibqpmdaobjrryja.supabase.co/functions/v1/paydunya-webhook
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    let body: Record<string, unknown>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // PayDunya sends IPN as application/x-www-form-urlencoded
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        // Parse URL-encoded form data
        const params = new URLSearchParams(text);
        body = {};
        for (const [key, value] of params.entries()) {
          // Handle nested keys like data[response_code]
          const match = key.match(/^data\[(.+)\]$/);
          if (match) {
            body[match[1]] = value;
          } else {
            body[key] = value;
          }
        }
      }
    }
    console.log("PayDunya IPN received:", JSON.stringify(body));

    const responseCode = body.response_code || null;
    const status = (body.status || "").toLowerCase();
    const transactionId = body.transaction_id || body.disburse_token || body.token || "";
    const amount = body.amount || null;
    const responseText = body.response_text || body.message || "";

    // Try to find the withdrawal by matching the transaction reference or token
    let withdrawal = null;
    const token = body.token || body.disburse_token || "";

    if (transactionId) {
      const { data } = await supabaseAdmin
        .from("withdrawal_requests")
        .select("*")
        .eq("status", "processing")
        .ilike("proof_url", `%${transactionId}%`)
        .maybeSingle();
      withdrawal = data;
    }

    // Try matching by disburse token
    if (!withdrawal && token) {
      const { data } = await supabaseAdmin
        .from("withdrawal_requests")
        .select("*")
        .eq("status", "processing")
        .ilike("proof_url", `%${token}%`)
        .maybeSingle();
      withdrawal = data;
    }

    // Fallback: match by amount + status=processing
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

    const matched = !!withdrawal;

    // Log IPN event
    await supabaseAdmin.from("paydunya_logs").insert({
      event_type: "ipn",
      withdrawal_request_id: withdrawal?.id || null,
      payload: body,
      response_code: responseCode,
      status: status || null,
      transaction_id: transactionId || null,
      amount: amount ? Number(amount) : null,
      matched,
    });

    if (!withdrawal) {
      console.log("IPN: No matching withdrawal found for TX:", transactionId);
      return new Response(
        JSON.stringify({ received: true, matched: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("IPN: Matched withdrawal:", withdrawal.id);

    const isSuccess = responseCode === "00" || status === "completed" || status === "success";
    const isFailed = responseCode !== "00" && (status === "failed" || status === "error" || status === "reversed");

    if (isSuccess && withdrawal.status === "processing") {
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

      await supabaseAdmin.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "✅ Retrait confirmé !",
        message: `Votre retrait de ${new Intl.NumberFormat("fr-FR").format(withdrawal.amount)} FCFA a été confirmé et envoyé.`,
        type: "success",
      });

    } else if (isFailed && withdrawal.status === "processing") {
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

      await supabaseAdmin.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "❌ Retrait échoué",
        message: `Votre retrait de ${new Intl.NumberFormat("fr-FR").format(withdrawal.amount)} FCFA a échoué. Votre solde a été restauré.${responseText ? ` Raison: ${responseText}` : ""}`,
        type: "error",
      });

      const { data: admins } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      for (const admin of admins || []) {
        await supabaseAdmin.from("notifications").insert({
          user_id: admin.user_id,
          title: "⚠️ Payout échoué",
          message: `Payout de ${new Intl.NumberFormat("fr-FR").format(withdrawal.amount)} FCFA échoué: ${responseText}`,
          type: "error",
        });
      }
    }

    return new Response(
      JSON.stringify({ received: true, matched: true, withdrawal_id: withdrawal.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("IPN webhook error:", error);

    // Log error too
    try {
      await supabaseAdmin.from("paydunya_logs").insert({
        event_type: "ipn_error",
        payload: { error: String(error) },
        matched: false,
      });
    } catch (_) { /* ignore logging errors */ }

    return new Response(
      JSON.stringify({ received: true, error: "Internal processing error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
