import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[FEDAPAY-PAYOUT] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const fedapayBase = () =>
  (Deno.env.get("FEDAPAY_MODE") || "live") === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

// Phone dial code -> ISO2 country supported by FedaPay payouts
const DIAL_TO_ISO: Record<string, string> = {
  "+229": "BJ",
  "+225": "CI",
  "+221": "SN",
  "+228": "TG",
  "+226": "BF",
  "+223": "ML",
  "+227": "NE",
  "+245": "GW",
};

// provider + country -> FedaPay payout mode
const PAYOUT_MODES: Record<string, Record<string, string>> = {
  wave: { CI: "wave_ci", SN: "wave_sn", BF: "wave_bf", ML: "wave_ml" },
  orange: {
    CI: "orange_money_ci",
    SN: "orange_money_sn",
    BF: "orange_money_bf",
    ML: "orange_money_ml",
    GW: "orange_money_gw",
  },
  mtn: { BJ: "mtn", CI: "mtn_ci" },
  moov: { BJ: "moov", TG: "moov_tg", BF: "moov_bf", ML: "moov_ml" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const secretKey = Deno.env.get("FEDAPAY_SECRET_KEY");
    if (!secretKey) return json({ error: "Clés FedaPay non configurées" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Non autorisé" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !userData.user) return json({ error: "Non autorisé" }, 401);
    const adminId = userData.user.id;

    const { data: adminRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return json({ error: "Accès refusé" }, 403);

    const { withdrawal_id } = await req.json();
    if (!withdrawal_id) return json({ error: "withdrawal_id requis" }, 400);

    const { data: wr, error: wrError } = await admin
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawal_id)
      .single();
    if (wrError || !wr) return json({ error: "Demande introuvable" }, 404);
    if (wr.method !== "mobile_money") {
      return json({ error: "Cette demande n'est pas un retrait Mobile Money" }, 400);
    }
    if (wr.status !== "pending") {
      return json({ error: "Cette demande a déjà été traitée" }, 400);
    }

    const rawNumber: string = wr.mobile_number || "";
    const dial = Object.keys(DIAL_TO_ISO).find((code) => rawNumber.startsWith(code));
    const iso = dial ? DIAL_TO_ISO[dial] : null;
    if (!iso) {
      return json({ error: `Pays non supporté par FedaPay pour ${rawNumber}` }, 400);
    }
    const mode = PAYOUT_MODES[wr.mobile_provider || ""]?.[iso];
    if (!mode) {
      return json(
        { error: `Opérateur ${wr.mobile_provider} non supporté par FedaPay en ${iso}` },
        400
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", wr.user_id)
      .maybeSingle();
    const [firstname, ...rest] = (profile?.full_name || "Createur CollabCrea").split(" ");

    const headers = {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    };

    // Lock the request while we call FedaPay
    await admin
      .from("withdrawal_requests")
      .update({ status: "processing", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
      .eq("id", withdrawal_id);

    const revert = async () => {
      await admin
        .from("withdrawal_requests")
        .update({ status: "pending", reviewed_by: null, reviewed_at: null })
        .eq("id", withdrawal_id);
    };

    try {
      // 1) Create the payout
      const createRes = await fetch(`${fedapayBase()}/payouts`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: wr.amount,
          currency: { iso: "XOF" },
          mode,
          customer: {
            firstname: firstname || "Createur",
            lastname: rest.join(" ") || "CollabCrea",
            phone_number: { number: rawNumber, country: iso },
          },
downloads: undefined,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        log("Payout creation failed", createJson);
        await revert();
        return json({ error: createJson?.message || "Erreur FedaPay", details: createJson }, 500);
      }
      const payoutId = createJson?.["v1/payout"]?.id;
      if (!payoutId) {
        await revert();
        return json({ error: "FedaPay: identifiant de virement manquant" }, 500);
      }

      // 2) Start the payout (immediate send)
      const startRes = await fetch(`${fedapayBase()}/payouts/start`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ payouts: [{ id: payoutId }] }),
      });
      const startJson = await startRes.json();
      if (!startRes.ok) {
        log("Payout start failed", startJson);
        await revert();
        return json({ error: startJson?.message || "Envoi FedaPay refusé", details: startJson }, 500);
      }

      // 3) Finalize locally
      await admin
        .from("withdrawal_requests")
        .update({ status: "completed", transaction_id: String(payoutId) })
        .eq("id", withdrawal_id);

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
      }

      await admin
        .from("transactions")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("reference", withdrawal_id)
        .eq("type", "withdrawal")
        .eq("status", "pending");

      await admin.from("notifications").insert({
        user_id: wr.user_id,
        title: "✅ Retrait envoyé !",
        message: `Votre retrait de ${new Intl.NumberFormat("fr-FR").format(wr.amount)} FCFA a été envoyé sur ${rawNumber}.`,
        type: "success",
      });

      log("Payout sent", { payoutId, amount: wr.amount, mode });
      return json({ success: true, payout_id: payoutId, amount: wr.amount, mode });
    } catch (err) {
      log("FedaPay API error", { message: err instanceof Error ? err.message : String(err) });
      await revert();
      return json({ error: "Erreur de communication avec FedaPay" }, 500);
    }
  } catch (error) {
    log("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return json({ error: "Erreur interne" }, 500);
  }
});
