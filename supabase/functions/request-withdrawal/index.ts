import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map country names to their phone codes
const countryPhoneCodes: Record<string, string> = {
  "Algérie": "+213", "Angola": "+244", "Bénin": "+229", "Botswana": "+267",
  "Burkina Faso": "+226", "Burundi": "+257", "Cap-Vert": "+238", "Cameroun": "+237",
  "Centrafrique": "+236", "Tchad": "+235", "Comores": "+269", "Congo": "+242",
  "RD Congo": "+243", "RDC": "+243", "Côte d'Ivoire": "+225", "Djibouti": "+253",
  "Égypte": "+20", "Guinée équatoriale": "+240", "Guinée Équatoriale": "+240",
  "Érythrée": "+291", "Eswatini": "+268", "Éthiopie": "+251", "Gabon": "+241",
  "Gambie": "+220", "Ghana": "+233", "Guinée": "+224", "Guinée-Bissau": "+245",
  "Kenya": "+254", "Lesotho": "+266", "Libéria": "+231", "Libye": "+218",
  "Madagascar": "+261", "Malawi": "+265", "Mali": "+223", "Mauritanie": "+222",
  "Maurice": "+230", "Maroc": "+212", "Mozambique": "+258", "Namibie": "+264",
  "Niger": "+227", "Nigeria": "+234", "Rwanda": "+250", "São Tomé-et-Príncipe": "+239",
  "Sénégal": "+221", "Seychelles": "+248", "Sierra Leone": "+232", "Somalie": "+252",
  "Afrique du Sud": "+27", "Soudan du Sud": "+211", "Soudan": "+249",
  "Tanzanie": "+255", "Togo": "+228", "Tunisie": "+216", "Ouganda": "+256",
  "Zambie": "+260", "Zimbabwe": "+263",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { wallet_id, amount, mobile_provider, mobile_number } = await req.json();

    // Validate inputs
    if (!wallet_id || !amount || !mobile_provider || !mobile_number) {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount < 1000) {
      return new Response(JSON.stringify({ error: "Le montant minimum est de 1 000 FCFA" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["wave", "orange"].includes(mobile_provider)) {
      return new Response(JSON.stringify({ error: "Opérateur non supporté" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate phone number format (digits only after code, reasonable length)
    const localPart = mobile_number.replace(/^\+\d{1,3}/, "");
    if (!/^\d{7,10}$/.test(localPart)) {
      return new Response(
        JSON.stringify({ error: "Format de numéro invalide. Le numéro local doit contenir entre 7 et 10 chiffres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch user profile country
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("country")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile?.country) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate phone number matches user's country
    const expectedPhoneCode = countryPhoneCodes[profile.country];
    if (expectedPhoneCode && !mobile_number.startsWith(expectedPhoneCode)) {
      return new Response(
        JSON.stringify({
          error: `Le numéro de téléphone ne correspond pas à votre pays d'inscription (${profile.country}). Le numéro doit commencer par ${expectedPhoneCode}.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check wallet balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("balance, user_id")
      .eq("id", wallet_id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Portefeuille introuvable" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (wallet.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (wallet.balance < amount) {
      return new Response(JSON.stringify({ error: "Solde insuffisant" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create withdrawal request
    const { error: insertError } = await supabaseAdmin
      .from("withdrawal_requests")
      .insert({
        user_id: userId,
        wallet_id,
        amount,
        method: "mobile_money",
        mobile_provider,
        mobile_number,
      });

    if (insertError) throw insertError;

    // Deduct from wallet
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance - amount,
        pending_balance: amount,
      })
      .eq("id", wallet_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la demande de retrait" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
