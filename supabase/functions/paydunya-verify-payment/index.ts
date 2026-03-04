import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PAYDUNYA-VERIFY] ${step}${detailsStr}`);
};

const normalizeReference = (raw: string | null | undefined) => {
  if (!raw) return null;
  const decoded = decodeURIComponent(String(raw)).trim();
  const nested = decoded.match(/[?&]reference=([^&]+)/);
  return (nested?.[1] ?? decoded).split("?")[0].split("&")[0];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const masterKey = Deno.env.get("PAYDUNYA_MASTER_KEY");
    const privateKey = Deno.env.get("PAYDUNYA_PRIVATE_KEY");
    const paydunyaToken = Deno.env.get("PAYDUNYA_TOKEN");

    if (!masterKey || !privateKey || !paydunyaToken) {
      throw new Error("Configuration PayDunya manquante");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const userToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(userToken);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("Utilisateur non authentifié");

    const { token, collaborationId, reference: rawReference } = await req.json();

    if (!collaborationId) throw new Error("collaborationId est requis");
    if (!token) throw new Error("token PayDunya manquant");

    const { data: collab, error: collabError } = await supabaseClient
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .single();

    if (collabError || !collab) {
      throw new Error(`Collaboration introuvable: ${collabError?.message || "not found"}`);
    }

    if (collab.brand_id !== user.id) {
      throw new Error("Seule la marque peut confirmer ce paiement");
    }

    const isSandbox = privateKey.startsWith("test_");
    const apiBase = isSandbox
      ? "https://app.paydunya.com/sandbox-api/v1"
      : "https://app.paydunya.com/api/v1";

    const confirmResponse = await fetch(`${apiBase}/checkout-invoice/confirm/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": masterKey,
        "PAYDUNYA-PRIVATE-KEY": privateKey,
        "PAYDUNYA-TOKEN": paydunyaToken,
      },
    });

    const confirmText = await confirmResponse.text();
    let confirmData: Record<string, unknown>;
    try {
      confirmData = JSON.parse(confirmText);
    } catch {
      throw new Error("Réponse PayDunya invalide lors de la vérification");
    }

    const payload = (confirmData.data as Record<string, unknown> | undefined) || confirmData;
    const responseCode = String(payload.response_code || confirmData.response_code || "");
    const responseText = String(payload.response_text || confirmData.response_text || "");

    const statusCandidates = [
      payload.status,
      payload.payment_status,
      payload.invoice_status,
      (payload.data as Record<string, unknown> | undefined)?.status,
      confirmData.status,
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());

    const paymentLooksSuccessful =
      responseCode === "00" &&
      (statusCandidates.length === 0 ||
        statusCandidates.some((s) => ["completed", "success", "successful", "paid", "succeeded", "done"].includes(s)) ||
        responseText.toLowerCase().includes("transaction found"));

    if (!confirmResponse.ok || !paymentLooksSuccessful) {
      logStep("Payment not confirmed", { responseCode, responseText, statusCandidates });
      return new Response(
        JSON.stringify({
          verified: false,
          paymentStatus: statusCandidates[0] || "pending",
          responseCode,
          responseText,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    let nextStatus = collab.status;
    if (collab.status === "pending_payment") nextStatus = "in_progress";
    if (collab.status === "content_submitted") nextStatus = "in_review";

    const normalizedReference =
      normalizeReference(rawReference) ||
      normalizeReference((payload.custom_data as Record<string, unknown> | undefined)?.reference as string | undefined) ||
      `paydunya-${token}`;

    const { data: existingTx } = await supabaseClient
      .from("transactions")
      .select("id")
      .eq("collaboration_id", collaborationId)
      .eq("reference", normalizedReference)
      .maybeSingle();

    if (!existingTx) {
      await supabaseClient.from("transactions").insert({
        collaboration_id: collaborationId,
        user_id: collab.brand_id,
        type: "escrow",
        status: "completed",
        amount: collab.agreed_amount,
        fee: collab.platform_fee,
        net_amount: collab.creator_amount,
        description: `Paiement PayDunya - ${normalizedReference}`,
        reference: normalizedReference,
      });
    }

    if (nextStatus !== collab.status) {
      await supabaseClient
        .from("collaborations")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", collaborationId);
    }

    if (nextStatus === "in_progress") {
      await supabaseClient.from("notifications").insert({
        user_id: collab.creator_id,
        type: "payment",
        title: "💰 Paiement reçu",
        message: "La marque a payé. Vous pouvez commencer la collaboration.",
      });
    } else if (nextStatus === "in_review") {
      await supabaseClient.from("notifications").insert({
        user_id: collab.creator_id,
        type: "payment",
        title: "🔓 Contenu débloqué",
        message: "La marque a payé et votre contenu est maintenant en revue.",
      });
    }

    return new Response(
      JSON.stringify({
        verified: true,
        paymentStatus: "success",
        nextStatus,
        reference: normalizedReference,
        responseCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
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
