import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[ADMIN-FINALIZE-WITHDRAWAL] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const callerId = userData.user.id;

    // Verify admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin role required");

    const body = await req.json();
    const { withdrawal_id, proof_url } = body as { withdrawal_id?: string; proof_url?: string };
    if (!withdrawal_id) throw new Error("withdrawal_id is required");

    // Load the withdrawal request
    const { data: wr, error: wrError } = await admin
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawal_id)
      .single();
    if (wrError || !wr) throw new Error("Withdrawal request not found");

    if (wr.status === "completed") {
      log("Already completed, returning success");
      return new Response(JSON.stringify({ success: true, already: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Mark withdrawal_request as completed
    const { error: updateWrError } = await admin
      .from("withdrawal_requests")
      .update({
        status: "completed",
        reviewed_by: callerId,
        reviewed_at: new Date().toISOString(),
        proof_url: proof_url ?? wr.proof_url ?? null,
      })
      .eq("id", withdrawal_id);
    if (updateWrError) throw updateWrError;
    log("withdrawal_request marked completed");

    // 2) Reset wallet pending_balance
    const { data: wallet } = await admin
      .from("wallets")
      .select("pending_balance")
      .eq("id", wr.wallet_id)
      .single();
    if (wallet) {
      await admin
        .from("wallets")
        .update({
          pending_balance: Math.max(0, (wallet.pending_balance || 0) - wr.amount),
          updated_at: new Date().toISOString(),
        })
        .eq("id", wr.wallet_id);
      log("wallet pending_balance reset");
    }

    // 3) Upsert transaction (mark existing pending one completed, otherwise insert one)
    const { data: existingTx } = await admin
      .from("transactions")
      .select("id")
      .eq("reference", withdrawal_id)
      .eq("type", "withdrawal")
      .maybeSingle();

    if (existingTx) {
      await admin
        .from("transactions")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", existingTx.id);
      log("Existing withdrawal transaction marked completed", { tx_id: existingTx.id });
    } else {
      const description =
        wr.method === "paypal"
          ? `Retrait PayPal - ${wr.paypal_email}`
          : wr.method === "bank"
          ? `Retrait bancaire - ${wr.bank_name}`
          : `Retrait ${wr.mobile_provider} - ${wr.mobile_number}`;

      const details =
        wr.method === "paypal"
          ? { paypal_email: wr.paypal_email, payout_currency: wr.payout_currency }
          : wr.method === "bank"
          ? { bank_name: wr.bank_name, account_number: wr.account_number, account_holder: wr.account_holder }
          : { mobile_provider: wr.mobile_provider, mobile_number: wr.mobile_number };

      await admin.from("transactions").insert({
        user_id: wr.user_id,
        wallet_id: wr.wallet_id,
        type: "withdrawal",
        status: "completed",
        amount: wr.amount,
        fee: 0,
        net_amount: wr.amount,
        withdrawal_method: wr.method,
        withdrawal_details: details,
        description,
        reference: withdrawal_id,
      });
      log("New withdrawal transaction inserted as completed");
    }

    // 4) In-app notification (push is handled by existing trigger on status change)
    const methodLabel =
      wr.method === "paypal"
        ? "PayPal"
        : wr.method === "bank"
        ? "virement bancaire"
        : wr.mobile_provider || "Mobile Money";

    await admin.from("notifications").insert({
      user_id: wr.user_id,
      title: "✅ Retrait effectué !",
      message: `Votre retrait de ${new Intl.NumberFormat("fr-FR").format(wr.amount)} FCFA a été envoyé via ${methodLabel}.`,
      type: "success",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
