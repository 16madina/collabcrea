import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user from the JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { collaborationId, provider, phoneNumber } = await req.json();

    if (!collaborationId || !provider || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate provider
    if (!["orange_money", "wave"].includes(provider)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating mobile payment for collaboration ${collaborationId} via ${provider}`);

    // Get the collaboration
    const { data: collaboration, error: collabError } = await supabase
      .from("collaborations")
      .select("*, offer:offers(*)")
      .eq("id", collaborationId)
      .single();

    if (collabError || !collaboration) {
      console.error("Collaboration error:", collabError);
      return new Response(
        JSON.stringify({ error: "Collaboration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is the brand
    if (collaboration.brand_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if collaboration is in correct status
    if (collaboration.status !== "accepted") {
      return new Response(
        JSON.stringify({ error: "Collaboration must be accepted to pay" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a pending transaction for mobile money
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        collaboration_id: collaborationId,
        type: "mobile_payment",
        amount: collaboration.agreed_amount,
        fee: 0,
        net_amount: collaboration.agreed_amount,
        status: "pending",
        description: `Paiement ${provider === "orange_money" ? "Orange Money" : "Wave"} pour ${collaboration.offer?.title}`,
        withdrawal_method: provider,
        withdrawal_details: {
          phone_number: phoneNumber,
          provider: provider,
        },
      })
      .select()
      .single();

    if (txError) {
      console.error("Transaction error:", txError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Mobile payment request created: ${transaction.id}`);

    // Update collaboration status to pending_payment
    await supabase
      .from("collaborations")
      .update({ status: "pending_mobile_payment" })
      .eq("id", collaborationId);

    // Create notification for admin
    await supabase.from("notifications").insert({
      user_id: user.id, // Will be replaced with admin notification system
      type: "mobile_payment_pending",
      title: "Nouvelle demande de paiement mobile",
      message: `Demande de paiement ${provider === "orange_money" ? "Orange Money" : "Wave"} de ${collaboration.agreed_amount} FCFA pour "${collaboration.offer?.title}"`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        message: "Payment request created",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});