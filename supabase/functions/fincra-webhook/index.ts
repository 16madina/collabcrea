import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FINCRA-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const fincraSecretKey = Deno.env.get("FINCRA_SECRET_KEY");
    if (!fincraSecretKey) throw new Error("FINCRA_SECRET_KEY is not set");

    const body = await req.text();
    const signature = req.headers.get("signature");

    // Verify webhook signature using HMAC SHA-512
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(fincraSecretKey),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const computedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (computedSignature !== signature) {
        logStep("Webhook signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
      logStep("Webhook signature verified");
    } else {
      logStep("No signature header, proceeding without verification");
    }

    const event = JSON.parse(body);
    logStep("Event received", { event: event.event, type: event.data?.type });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle checkout payment success
    if (event.event === "charge.successful") {
      const data = event.data;
      logStep("Payment successful", { reference: data.reference, merchantReference: data.merchantReference, amount: data.amount });

      const reference = data.merchantReference || data.reference;

      // Extract collaboration_id from reference (format: collab-{uuid}-{timestamp})
      let collaborationId: string | null = null;

      if (reference && reference.startsWith("collab-")) {
        const parts = reference.split("-");
        // UUID is parts[1] through parts[5] (5 groups)
        if (parts.length >= 7) {
          collaborationId = parts.slice(1, 6).join("-");
        }
      }

      // Also check metadata if available
      if (!collaborationId && data.metadata?.collaboration_id) {
        collaborationId = data.metadata.collaboration_id;
      }

      if (!collaborationId) {
        logStep("No collaboration_id found, skipping");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      logStep("Processing collaboration", { collaborationId });

      // Get collaboration details
      const { data: collab, error: collabError } = await supabase
        .from("collaborations")
        .select("*")
        .eq("id", collaborationId)
        .single();

      if (collabError || !collab) {
        logStep("Collaboration not found", { error: collabError?.message });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Prevent duplicate processing
      if (collab.status === "in_review" || collab.status === "completed") {
        logStep("Collaboration already processed, skipping");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Update collaboration status to in_review
      const { error: updateError } = await supabase
        .from("collaborations")
        .update({
          status: "in_review",
          updated_at: new Date().toISOString(),
        })
        .eq("id", collaborationId);

      if (updateError) {
        logStep("Error updating collaboration", { error: updateError.message });
        throw updateError;
      }
      logStep("Collaboration status updated to in_review");

      // Ensure wallet exists for creator
      const { data: existingWallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", collab.creator_id)
        .maybeSingle();

      if (!existingWallet) {
        await supabase.from("wallets").insert({ user_id: collab.creator_id });
        logStep("Wallet created for creator");
      }

      // Create escrow transaction
      const { error: txError } = await supabase.from("transactions").insert({
        collaboration_id: collaborationId,
        user_id: collab.brand_id,
        type: "escrow",
        status: "completed",
        amount: collab.agreed_amount,
        fee: collab.platform_fee,
        net_amount: collab.creator_amount,
        description: `Paiement Fincra - ${reference}`,
        reference: reference,
      });

      if (txError) {
        logStep("Error creating transaction", { error: txError.message });
      } else {
        logStep("Escrow transaction created");
      }

      // Create notification for creator
      const { data: offer } = await supabase
        .from("offers")
        .select("title")
        .eq("id", collab.offer_id)
        .single();

      await supabase.from("notifications").insert({
        user_id: collab.creator_id,
        type: "payment",
        title: "💰 Paiement reçu",
        message: `La marque a payé pour "${offer?.title || "Collaboration"}". Le contenu est maintenant en revue.`,
      });
      logStep("Creator notification sent");
    }

    // Handle payment failure
    if (event.event === "charge.failed") {
      const data = event.data;
      logStep("Payment failed", { reference: data.reference });
    }

    // Handle disbursement/payout success
    if (event.event === "disbursement.successful") {
      const data = event.data;
      logStep("Payout successful", { reference: data.customerReference });
      
      // Could update withdrawal status here
      if (data.customerReference) {
        const { error } = await supabase
          .from("withdrawal_requests")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.customerReference);

        if (!error) {
          logStep("Withdrawal request marked as completed");
        }
      }
    }

    if (event.event === "disbursement.failed") {
      const data = event.data;
      logStep("Payout failed", { reference: data.customerReference });

      if (data.customerReference) {
        const { error } = await supabase
          .from("withdrawal_requests")
          .update({
            status: "rejected",
            rejection_reason: "Le virement a échoué. Veuillez réessayer.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.customerReference);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
