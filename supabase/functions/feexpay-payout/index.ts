import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYOUT_URL = "https://api-v2.feexpay.me/api/payouts/public/transfer/global";
const PLATFORM_KEPT = 0.1; // 10% commission

const log = (step: string, details?: unknown) =>
  console.log(`[FEEXPAY-PAYOUT] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Multi-country phone normalization & network detection ───

interface CountryConfig {
  code: string;
  localDigits: number;
  oldDigits?: number;
  detectNetwork: (local: string) => string;
  defaultNetwork: string;
  validNetworks: string[];
}

const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  BENIN: {
    code: "229",
    localDigits: 10,
    oldDigits: 8,
    detectNetwork: (local) => {
      const d = local[2];
      return ["4", "5", "8"].includes(d) ? "MOOV" : "MTN";
    },
    defaultNetwork: "MTN",
    validNetworks: ["MTN", "MOOV", "CELTIIS BJ"],
  },
  COTE_D_IVOIRE: {
    code: "225",
    localDigits: 10,
    oldDigits: 8,
    detectNetwork: (local) => {
      const prefix = local.slice(0, 2);
      if (["01", "02", "03"].includes(prefix)) return "ORANGE CI";
      if (["04", "05"].includes(prefix)) return "MTN CI";
      if (["06", "07"].includes(prefix)) return "MOOV CI";
      return "MTN CI";
    },
    defaultNetwork: "MTN CI",
    validNetworks: ["MTN CI", "MOOV CI", "ORANGE CI", "WAVE CI"],
  },
  SENEGAL: {
    code: "221",
    localDigits: 9,
    detectNetwork: (local) => {
      const prefix = local.slice(0, 2);
      if (["70", "76", "77", "78"].includes(prefix)) return "ORANGE SN";
      if (["75", "76"].includes(prefix)) return "FREE SN";
      return "ORANGE SN";
    },
    defaultNetwork: "ORANGE SN",
    validNetworks: ["ORANGE SN", "FREE SN", "WAVE SN"],
  },
  BURKINA_FASO: {
    code: "226",
    localDigits: 8,
    detectNetwork: (local) => {
      const prefix = local.slice(0, 2);
      const d1 = parseInt(prefix, 10);
      if (d1 >= 60 && d1 <= 69) return "ORANGE BF";
      if (d1 >= 70 && d1 <= 79) return "MOOV BF";
      return "ORANGE BF";
    },
    defaultNetwork: "ORANGE BF",
    validNetworks: ["MOOV BF", "ORANGE BF", "WAVE BF"],
  },
  TOGO: {
    code: "228",
    localDigits: 8,
    detectNetwork: (local) => {
      const prefix = local.slice(0, 2);
      const d1 = parseInt(prefix, 10);
      if (d1 >= 90 && d1 <= 93) return "TOGOCOM TG";
      if (d1 >= 96 && d1 <= 99) return "MOOV TG";
      return "TOGOCOM TG";
    },
    defaultNetwork: "TOGOCOM TG",
    validNetworks: ["TOGOCOM TG", "MOOV TG"],
  },
  MALI: {
    code: "223",
    localDigits: 8,
    detectNetwork: (local) => {
      const prefix = local.slice(0, 2);
      const d1 = parseInt(prefix, 10);
      if (d1 >= 70 && d1 <= 79) return "ORANGE ML";
      if (d1 >= 60 && d1 <= 69) return "MOBICASH ML";
      return "ORANGE ML";
    },
    defaultNetwork: "ORANGE ML",
    validNetworks: ["MOBICASH ML", "ORANGE ML"],
  },
};

const ALL_VALID_NETWORKS = new Set(
  Object.values(COUNTRY_CONFIGS).flatMap((c) => c.validNetworks)
);

function normalizePhone(raw: string): {
  phoneNumber: string;
  country: string;
  network: string;
  validNetworks: string[];
} | null {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);

  for (const [countryName, config] of Object.entries(COUNTRY_CONFIGS)) {
    const { code, localDigits, oldDigits } = config;
    let local: string | null = null;

    if (digits.startsWith(code)) {
      local = digits.slice(code.length);
    } else if (countryName === "BENIN" && (digits.length === 8 || (digits.length === 10 && digits.startsWith("01")))) {
      local = digits;
    }

    if (local === null) continue;

    if (oldDigits && local.length === oldDigits && localDigits > oldDigits) {
      if (countryName === "BENIN") local = `01${local}`;
    }

    if (local.length !== localDigits) continue;

    return {
      phoneNumber: `${code}${local}`,
      country: countryName,
      network: config.detectNetwork(local),
      validNetworks: config.validNetworks,
    };
  }

  return null;
}

async function safeJson(src: { text: () => Promise<string> }): Promise<any> {
  const text = await src.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const apiKey = Deno.env.get("FEEXPAY_API_KEY");
    const shopId = Deno.env.get("FEEXPAY_SHOP_ID");
    if (!apiKey || !shopId) return json({ error: "Clés FeexPay non configurées" }, 500);

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
    const callerId = userData.user.id;

    const body = await safeJson(req).catch(() => ({}));
    const collaborationId = body?.collaborationId;
    if (!collaborationId || !UUID_RE.test(String(collaborationId))) {
      return json({ error: "collaborationId invalide" }, 400);
    }

    const { data: collab, error: collabError } = await admin
      .from("collaborations")
      .select("*")
      .eq("id", collaborationId)
      .maybeSingle();
    if (collabError || !collab) return json({ error: "Collaboration introuvable" }, 404);

    const { data: adminRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRole;
    if (!isAdmin && collab.brand_id !== callerId) {
      return json({ error: "Accès refusé" }, 403);
    }

    if (!["in_progress", "in_review"].includes(collab.status)) {
      return json(
        { error: "Le paiement de la marque n'a pas encore été reçu pour cette collaboration" },
        400
      );
    }

    const { data: creatorProfile } = await admin
      .from("profiles")
      .select("full_name, pricing")
      .eq("user_id", collab.creator_id)
      .maybeSingle();

    let rawPhone: string = body?.phoneNumber || (creatorProfile?.pricing as any)?.phone || "";
    if (!rawPhone) {
      const { data: lastWr } = await admin
        .from("withdrawal_requests")
        .select("mobile_number")
        .eq("user_id", collab.creator_id)
        .eq("method", "mobile_money")
        .not("mobile_number", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      rawPhone = lastWr?.mobile_number || "";
    }

    const parsed = normalizePhone(String(rawPhone));
    if (!parsed) {
      return json(
        {
          error:
            "Numéro Mobile Money du créateur invalide ou introuvable. " +
            "Formats acceptés : Bénin (229), Côte d'Ivoire (225), Sénégal (221), " +
            "Burkina Faso (226), Togo (228), Mali (223).",
        },
        400
      );
    }

    const { phoneNumber, country } = parsed;

    let network = parsed.network;
    if (body?.network && typeof body.network === "string") {
      const override = body.network.trim().toUpperCase();
      if (ALL_VALID_NETWORKS.has(override)) {
        network = override;
      } else if (parsed.validNetworks.map((n) => n.split(" ")[0]).includes(override)) {
        const match = parsed.validNetworks.find((n) => n.startsWith(override));
        if (match) network = match;
      }
    }

    const amount = Math.round((collab.agreed_amount || 0) * (1 - PLATFORM_KEPT));
    if (amount < 50) return json({ error: "Montant trop faible pour un virement (min 50 FCFA)" }, 400);

    log("Sending payout", { collaborationId, amount, network, country, phoneNumber });

    let res: Response;
    try {
      res = await fetch(PAYOUT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          amount,
          shop: shopId,
          network,
          motif: "ColabCrea paiement",
          callback_info: String(collaborationId),
        }),
      });
    } catch (err) {
      log("Network error", { message: err instanceof Error ? err.message : String(err) });
      return json({ error: "Erreur de communication avec FeexPay" }, 502);
    }

    const payload = await safeJson(res);
    if (!res.ok) {
      log("Payout failed", { status: res.status, payload });
      const raw = JSON.stringify(payload).toLowerCase();
      if (raw.includes("solde") || raw.includes("balance") || raw.includes("insufficient")) {
        return json({ error: "Solde FeexPay insuffisant pour effectuer ce virement" }, 400);
      }
      if (raw.includes("phone") || raw.includes("numero") || raw.includes("numéro")) {
        return json({ error: "Numéro Mobile Money refusé par FeexPay" }, 400);
      }
      return json(
        { error: payload?.message || "Le virement a été refusé par FeexPay", details: payload },
        res.status >= 400 && res.status < 500 ? 400 : 502
      );
    }

    const reference: string =
      payload?.reference || payload?.transaction_id || payload?.id || payload?.data?.reference || "";
    const payoutStatus: string = payload?.status || payload?.data?.status || "PENDING";

    const { error: txError } = await admin.from("transactions").insert({
      collaboration_id: collaborationId,
      user_id: collab.creator_id,
      type: "release",
      status: "pending",
      amount,
      fee: (collab.agreed_amount || 0) - amount,
      net_amount: amount,
      withdrawal_method: "mobile_money",
      reference: reference ? `feexpay-payout-${reference}` : null,
      description: `Virement Mobile Money (${network}) vers ${phoneNumber} [${country}]`,
    });
    if (txError) log("Transaction insert failed", txError);

    await admin
      .from("collaborations")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", collaborationId)
      .eq("status", collab.status);

    log("Payout accepted", { reference, payoutStatus, amount, country, network });
    return json({ success: true, reference, status: payoutStatus, amount, network, phoneNumber, country });
  } catch (error) {
    log("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return json({ error: "Erreur interne" }, 500);
  }
});
