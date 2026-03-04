import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PAYDUNYA-CHECKOUT] ${step}${detailsStr}`);
};

const normalizeReference = (value: string) =>
  decodeURIComponent(value).trim().split("?")[0].split("&")[0];

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

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("Utilisateur non authentifié");

    const { collaborationId } = await req.json();
    if (!collaborationId) throw new Error("collaborationId est requis");

    const { data: collab, error: collabError } = await supabaseClient
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .single();

    if (collabError || !collab) {
      throw new Error(`Collaboration introuvable: ${collabError?.message || "not found"}`);
    }

    if (collab.brand_id !== user.id) {
      throw new Error("Seule la marque peut payer cette collaboration");
    }

    if (collab.status !== "content_submitted" && collab.status !== "pending_payment") {
      throw new Error(`Statut invalide: ${collab.status}`);
    }

    const [{ data: offer }, { data: creator }, { data: brand }] = await Promise.all([
      supabaseClient.from("offers").select("title, logo_url").eq("id", collab.offer_id).single(),
      supabaseClient.from("profiles").select("full_name").eq("user_id", collab.creator_id).single(),
      supabaseClient.from("profiles").select("company_name, full_name").eq("user_id", collab.brand_id).single(),
    ]);

    const isSandbox = privateKey.startsWith("test_");
    const apiBase = isSandbox
      ? "https://app.paydunya.com/sandbox-api/v1"
      : "https://app.paydunya.com/api/v1";

    const reference = normalizeReference(`collab-${collaborationId}-${Date.now()}`);
    const origin = req.headers.get("origin") || "https://collabcrea.lovable.app";
    const returnPath = `${origin}/brand/collabs`;

    const checkoutPayload = {
      invoice: {
        items: [
          {
            name: offer?.title || "Collaboration",
            quantity: 1,
            unit_price: collab.agreed_amount,
            total_price: collab.agreed_amount,
            description: `Créateur: ${creator?.full_name || "Créateur"}`,
          },
        ],
        total_amount: collab.agreed_amount,
        description: `Paiement collaboration - ${offer?.title || "Collaboration"}`,
      },
      store: {
        name: "CollabCrea",
        tagline: "Paiement sécurisé",
        website_url: origin,
        ...(offer?.logo_url ? { logo_url: offer.logo_url } : {}),
      },
      actions: {
        return_url: `${returnPath}?payment=success&provider=paydunya&collaboration=${collaborationId}`,
        cancel_url: `${returnPath}?payment=cancelled&provider=paydunya&collaboration=${collaborationId}`,
      },
      custom_data: {
        reference,
        collaboration_id: collaborationId,
        brand_id: collab.brand_id,
        creator_id: collab.creator_id,
        brand_name: brand?.company_name || brand?.full_name || "Marque",
      },
    };

    logStep("Creating PayDunya checkout", {
      collaborationId,
      amountFCFA: collab.agreed_amount,
      status: collab.status,
      sandbox: isSandbox,
    });

    const response = await fetch(`${apiBase}/checkout-invoice/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": masterKey,
        "PAYDUNYA-PRIVATE-KEY": privateKey,
        "PAYDUNYA-TOKEN": paydunyaToken,
      },
      body: JSON.stringify(checkoutPayload),
    });

    const responseText = await response.text();
    let checkoutData: Record<string, unknown>;
    try {
      checkoutData = JSON.parse(responseText);
    } catch {
      throw new Error("Réponse PayDunya invalide");
    }

    const responseCode = String(checkoutData.response_code || "");
    const responseMessage = String(checkoutData.response_text || "");
    const invoiceToken = String(checkoutData.token || "");

    if (!response.ok || responseCode !== "00" || (!responseMessage && !invoiceToken)) {
      throw new Error(
        `PayDunya error: ${responseMessage || String(checkoutData.description || "checkout échoué")}`
      );
    }

    const fallbackCheckoutUrl = isSandbox
      ? `https://app.paydunya.com/sandbox-checkout/invoice/${invoiceToken}`
      : `https://app.paydunya.com/checkout/invoice/${invoiceToken}`;

    const checkoutUrl = responseMessage.startsWith("http") ? responseMessage : fallbackCheckoutUrl;

    await supabaseClient
      .from("collaborations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", collaborationId);

    return new Response(
      JSON.stringify({
        url: checkoutUrl,
        token: invoiceToken,
        reference,
        amountFCFA: collab.agreed_amount,
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
