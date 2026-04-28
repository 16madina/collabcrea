import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-PI] ${step}${d}`);
};

const FCFA_TO_EUR = 1 / 655.957;
const FCFA_TO_USD = 1 / 600;
const PAYIN_MARKUP = 0.05;

const convertFCFA = (amountFCFA: number, currency: "eur" | "usd") => {
  const rate = currency === "eur" ? FCFA_TO_EUR : FCFA_TO_USD;
  const base = amountFCFA * rate;
  return Math.max(50, Math.round(base * (1 + PAYIN_MARKUP) * 100));
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;

    const { collaborationId, currency = "eur" } = await req.json();
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
      throw new Error(`Invalid status: ${collab.status}`);
    }

    const amountFCFA = Number(collab.agreed_amount || 0);
    if (amountFCFA < 200) throw new Error("Amount too low");

    const stripeAmount = convertFCFA(amountFCFA, currency as "eur" | "usd");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer =
      customers.data.length > 0
        ? customers.data[0]
        : await stripe.customers.create({ email: user.email });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency,
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      description: `Collaboration ${collaborationId} • ${amountFCFA} FCFA`,
      metadata: {
        collaboration_id: collaborationId,
        brand_id: collab.brand_id,
        creator_id: collab.creator_id,
        amount_fcfa: String(amountFCFA),
      },
    });

    log("PI created", { id: paymentIntent.id, amount: stripeAmount, currency });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
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
