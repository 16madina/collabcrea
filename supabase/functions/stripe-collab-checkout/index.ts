import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-COLLAB-CHECKOUT] ${step}${d}`);
};

// Approximate FCFA → EUR/USD conversion (XOF pegged to EUR ≈ 655.957)
const FCFA_TO_EUR = 1 / 655.957;
const FCFA_TO_USD = 1 / 600; // approximate
const PAYIN_MARKUP = 0.05; // 5% markup to cover Stripe fees + currency conversion
const BRAND_FEE = 0.10; // 10% commission plateforme prélevée sur la marque

const convertFCFA = (amountFCFA: number, currency: "eur" | "usd") => {
  const rate = currency === "eur" ? FCFA_TO_EUR : FCFA_TO_USD;
  // Add brand commission (10%) then Stripe markup (5%)
  const withBrandFee = amountFCFA * (1 + BRAND_FEE);
  const base = withBrandFee * rate;
  const withMarkup = base * (1 + PAYIN_MARKUP);
  // Stripe expects amounts in minor units (cents)
  return Math.max(50, Math.round(withMarkup * 100));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;

    const body = await req.json();
    const { collaborationId, currency = "eur" } = body;
    if (!collaborationId) throw new Error("collaborationId required");
    if (!["eur", "usd"].includes(currency)) throw new Error("currency must be eur or usd");

    const { data: collab, error: collabError } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .single();

    if (collabError || !collab) throw new Error("Collaboration not found");
    if (collab.brand_id !== user.id) throw new Error("Only the brand can pay");
    if (!["pending_payment", "content_submitted"].includes(collab.status)) {
      throw new Error(`Invalid collaboration status: ${collab.status}`);
    }

    const amountFCFA = Number(collab.agreed_amount || 0);
    if (amountFCFA < 200) throw new Error("Amount too low");

    const stripeAmount = convertFCFA(amountFCFA, currency as "eur" | "usd");

    const [{ data: offer }, { data: creator }] = await Promise.all([
      supabase.from("offers").select("title").eq("id", collab.offer_id).single(),
      supabase.from("profiles").select("full_name").eq("user_id", collab.creator_id).single(),
    ]);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const origin = req.headers.get("origin") || "https://collabcrea.com";
    const returnPath = `${origin}/brand/collabs`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: offer?.title || "Collaboration",
              description: `Créateur: ${creator?.full_name || "Créateur"} • ${amountFCFA.toLocaleString("fr-FR")} FCFA`,
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        collaboration_id: collaborationId,
        brand_id: collab.brand_id,
        creator_id: collab.creator_id,
        amount_fcfa: String(amountFCFA),
      },
      success_url: `${returnPath}?payment=success&provider=stripe&collaboration=${collaborationId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnPath}?payment=cancelled&provider=stripe&collaboration=${collaborationId}`,
    });

    log("Session created", { sessionId: session.id, amountFCFA, stripeAmount, currency });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        amountFCFA,
        stripeAmount,
        currency,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
