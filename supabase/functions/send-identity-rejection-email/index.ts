import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  user_id: string;
  reason: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Require admin JWT
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, reason }: Payload = await req.json();

    if (!user_id || !reason) {
      return new Response(
        JSON.stringify({ error: "user_id et reason requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer email + nom
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userError || !userData?.user?.email) {
      throw new Error("Impossible de récupérer l'email de l'utilisateur");
    }

    const email = userData.user.email;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("user_id", user_id)
      .maybeSingle();

    const userName = profile?.full_name || "";

    const logoUrl =
      "https://fkfdjibqpmdaobjrryja.supabase.co/storage/v1/object/public/email-assets/logo-collabcrea.png?v=1";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a0a2e; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: linear-gradient(180deg, #2d1a47 0%, #1a0a2e 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
    <div style="padding: 40px; text-align: center;">
      <img src="${logoUrl}" alt="CollabCréa" style="height: 60px; width: auto; margin-bottom: 8px;" />
    </div>
    <div style="padding: 0 40px 40px;">
      <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0;">Vérification d'identité refusée${userName ? `, ${userName}` : ""}</h2>
      <p style="color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        Votre document d'identité n'a pas pu être validé par notre équipe.
      </p>
      <div style="background: rgba(212, 175, 55, 0.1); border-left: 3px solid #d4af37; padding: 16px 20px; border-radius: 8px; margin: 0 0 28px 0;">
        <p style="color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1.6; margin: 0;">
          <strong style="color: #d4af37;">Raison :</strong><br/>
          ${reason.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}
        </p>
      </div>
      <p style="color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
        Veuillez soumettre un nouveau document conforme depuis votre profil pour continuer à utiliser CollabCréa.
      </p>
      <a href="https://collabcrea.com/creator/profile" target="_blank"
         style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
        Soumettre un nouveau document →
      </a>
      <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 28px 0 0 0;">
        Une question ? Contactez-nous à support@collabcrea.com
      </p>
    </div>
  </div>
</body>
</html>`.trim();

    const resend = new Resend(RESEND_API_KEY);
    const emailResponse = await resend.emails.send({
      from: "CollabCréa <noreply@collabcrea.com>",
      to: [email],
      subject: "❌ Vérification d'identité refusée – CollabCréa",
      html,
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending identity rejection email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
