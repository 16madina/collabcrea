import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[APPROVE-CONTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { collaborationId, feedback, mode } = await req.json();
    if (!collaborationId) throw new Error("collaborationId is required");

    // Fetch collaboration
    const { data: collab, error: collabError } = await supabaseClient
      .from("collaborations")
      .select("*, offer:offers(delivery_mode, title)")
      .eq("id", collaborationId)
      .single();

    if (collabError || !collab) throw new Error("Collaboration not found");

    // Verify user is the brand
    if (collab.brand_id !== userId) {
      throw new Error("Only the brand can approve content");
    }

    const deliveryMode = (collab as any).offer?.delivery_mode;

    // Network mode: approve preview → pending_publication
    if (mode === "approve_preview" || (deliveryMode === "network" && mode !== "approve_publication")) {
      const { error: updateError } = await supabaseClient
        .from("collaborations")
        .update({
          status: "pending_publication",
          brand_feedback: feedback || null,
        })
        .eq("id", collaborationId);

      if (updateError) throw updateError;

      logStep("Preview approved, status → pending_publication");
      return new Response(JSON.stringify({ success: true, status: "pending_publication" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Final approval: complete collaboration + release payment
    const { error: updateError } = await supabaseClient
      .from("collaborations")
      .update({
        status: "completed",
        approved_at: new Date().toISOString(),
        brand_feedback: feedback || null,
      })
      .eq("id", collaborationId);

    if (updateError) throw updateError;
    logStep("Collaboration marked completed");

    // Get or create creator wallet
    let { data: wallet } = await supabaseClient
      .from("wallets")
      .select("*")
      .eq("user_id", collab.creator_id)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet, error: walletError } = await supabaseClient
        .from("wallets")
        .insert({ user_id: collab.creator_id })
        .select()
        .single();
      if (walletError) {
        logStep("Warning: wallet creation failed", { error: walletError.message });
      } else {
        wallet = newWallet;
      }
    }

    if (wallet) {
      // Mark existing escrow transaction as completed
      const { error: escrowUpdateError } = await supabaseClient
        .from("transactions")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("collaboration_id", collaborationId)
        .eq("type", "escrow")
        .eq("status", "pending");

      if (escrowUpdateError) {
        logStep("Warning: escrow transaction update failed", { error: escrowUpdateError.message });
      } else {
        logStep("Escrow transaction marked completed");
      }

      // Create release transaction
      const { error: txError } = await supabaseClient.from("transactions").insert({
        collaboration_id: collaborationId,
        wallet_id: wallet.id,
        user_id: collab.creator_id,
        type: "release",
        status: "completed",
        amount: collab.creator_amount,
        fee: 0,
        net_amount: collab.creator_amount,
        description: `Paiement pour collaboration`,
      });

      if (txError) {
        logStep("Warning: transaction creation failed", { error: txError.message });
      } else {
        logStep("Release transaction created");
      }

      // Update wallet balance
      const newBalance = (wallet.balance || 0) + collab.creator_amount;
      const { error: walletUpdateError } = await supabaseClient
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

      if (walletUpdateError) {
        logStep("Warning: wallet update failed", { error: walletUpdateError.message });
      } else {
        logStep("Wallet balance updated", { newBalance });
      }
    }

    return new Response(JSON.stringify({ success: true, status: "completed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
