import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const IOS_URL = "https://apps.apple.com/ca/app/collabcrea/id6758926846?l=fr-CA";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.collabcrea.app";
const WEB_URL = "https://collabcrea.com";
const LOGO_URL =
  "https://fkfdjibqpmdaobjrryja.supabase.co/storage/v1/object/public/email-assets/logo-collabcrea.png?v=1";

function buildHtml(name: string | null) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#1a0a2e; margin:0; padding:40px 20px;">
  <div style="max-width:560px; margin:0 auto; background:linear-gradient(180deg,#2d1a47 0%,#1a0a2e 100%); border-radius:24px; overflow:hidden; border:1px solid rgba(212,175,55,0.2);">
    <div style="padding:40px 40px 16px; text-align:center;">
      <img src="${LOGO_URL}" alt="CollabCréa" style="height:60px; width:auto; margin-bottom:8px;" />
      <p style="color:rgba(255,255,255,0.6); font-size:13px; margin:0;">La plateforme des créateurs africains</p>
    </div>
    <div style="padding:8px 40px 40px;">
      <h2 style="color:#ffffff; font-size:22px; margin:16px 0;">${greeting}</h2>
      <p style="color:rgba(255,255,255,0.8); font-size:15px; line-height:1.7; margin:0 0 20px;">
        Bienvenue sur <strong style="color:#d4af37;">CollabCréa</strong> 🎉 — votre compte est presque prêt !
      </p>
      <p style="color:rgba(255,255,255,0.75); font-size:15px; line-height:1.7; margin:0 0 24px;">
        Pour commencer à collaborer avec des marques (ou trouver les meilleurs créateurs), il vous reste 3 petites étapes :
      </p>
      <div style="background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.25); border-radius:14px; padding:20px 24px; margin:0 0 28px;">
        <p style="color:#f4d03f; font-size:14px; margin:0 0 12px; font-weight:600;">✅ Vérifiez votre adresse email</p>
        <p style="color:#f4d03f; font-size:14px; margin:0 0 12px; font-weight:600;">🪪 Faites vérifier votre profil (pièce d'identité)</p>
        <p style="color:#f4d03f; font-size:14px; margin:0; font-weight:600;">🔗 Ajoutez vos réseaux sociaux</p>
      </div>
      <p style="color:rgba(255,255,255,0.75); font-size:15px; line-height:1.7; margin:0 0 28px;">
        Une fois ces étapes terminées, vous pourrez démarrer vos premières collaborations rémunérées 💸
      </p>
      <div style="text-align:center; margin:0 0 24px;">
        <a href="${WEB_URL}/auth" target="_blank"
           style="display:inline-block; background:linear-gradient(135deg,#d4af37 0%,#f4d03f 50%,#d4af37 100%); color:#1a0a2e; text-decoration:none; padding:16px 36px; border-radius:12px; font-weight:700; font-size:16px;">
          Vérifier mon profil →
        </a>
      </div>
      <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:32px 0;" />
      <h3 style="color:#ffffff; font-size:17px; margin:0 0 12px; text-align:center;">📱 Téléchargez l'application</h3>
      <p style="color:rgba(255,255,255,0.7); font-size:14px; line-height:1.6; margin:0 0 20px; text-align:center;">
        Profitez de CollabCréa partout, avec des notifications en temps réel.
      </p>
      <div style="text-align:center;">
        <a href="${IOS_URL}" target="_blank"
           style="display:inline-block; background:#000000; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; margin:4px;">
           Télécharger sur l'App Store
        </a>
        <a href="${ANDROID_URL}" target="_blank"
           style="display:inline-block; background:#000000; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; margin:4px;">
           Télécharger sur Google Play
        </a>
      </div>
    </div>
    <div style="padding:20px 40px; text-align:center; background:rgba(0,0,0,0.25);">
      <p style="color:rgba(255,255,255,0.45); font-size:12px; margin:0;">
        Vous recevez cet email parce que vous êtes inscrit sur CollabCréa.<br/>
        <a href="${WEB_URL}" style="color:#d4af37; text-decoration:none;">collabcrea.com</a>
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden - admin only" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = !!body.dry_run;

    // Fetch all auth users (paginate)
    const allUsers: Array<{ id: string; email: string | null }> = [];
    let page = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      for (const u of data.users) {
        if (u.email) allUsers.push({ id: u.id, email: u.email });
      }
      if (data.users.length < 1000) break;
      page++;
    }

    // Get profile names
    const ids = allUsers.map((u) => u.id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", ids);
    const nameMap = new Map<string, string>();
    (profiles ?? []).forEach((p: any) => nameMap.set(p.user_id, p.full_name));

    if (dryRun) {
      return new Response(JSON.stringify({ would_send: allUsers.length, sample: allUsers.slice(0, 5) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    let sent = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const u of allUsers) {
      try {
        const name = nameMap.get(u.id) ?? null;
        await resend.emails.send({
          from: "CollabCréa <noreply@collabcrea.com>",
          to: [u.email!],
          subject: "✨ Finalisez votre profil et téléchargez l'app CollabCréa",
          html: buildHtml(name),
        });
        sent++;
        // Soft throttle to respect Resend rate limits (~10/s)
        await new Promise((r) => setTimeout(r, 120));
      } catch (e: any) {
        failed++;
        errors.push({ email: u.email, error: e.message });
      }
    }

    return new Response(JSON.stringify({ total: allUsers.length, sent, failed, errors: errors.slice(0, 10) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-app-download-reminder error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
