import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AuthEmailType = "magic_link" | "signup" | "password_reset" | "email_change";

interface AuthEmailRequest {
  type: AuthEmailType;
  email: string;
  redirectTo?: string;
  userName?: string;
  // Backward compat fields (ignored)
  token?: string;
  tokenHash?: string;
}

function assertEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getAdminLinkType(type: AuthEmailType):
  | "magiclink"
  | "signup"
  | "recovery"
  | "email_change" {
  switch (type) {
    case "magic_link":
      return "magiclink";
    case "signup":
      return "signup";
    case "password_reset":
      return "recovery";
    case "email_change":
      return "email_change";
  }
}

function getSubject(type: AuthEmailType) {
  switch (type) {
    case "magic_link":
      return "🔑 Votre lien de connexion CollabCréa";
    case "signup":
      return "✨ Confirmez votre email – CollabCréa";
    case "password_reset":
      return "🔒 Réinitialisez votre mot de passe – CollabCréa";
    case "email_change":
      return "📧 Confirmez votre nouvelle adresse email – CollabCréa";
  }
}

function getCtaLabel(type: AuthEmailType) {
  switch (type) {
    case "magic_link":
      return "Se connecter →";
    case "signup":
      return "Confirmer mon email →";
    case "password_reset":
      return "Réinitialiser →";
    case "email_change":
      return "Confirmer →";
  }
}

function getTitle(type: AuthEmailType, userName?: string) {
  switch (type) {
    case "magic_link":
      return "Connectez-vous en un clic";
    case "signup":
      return `Bienvenue${userName ? `, ${userName}` : ""} ! 🎉`;
    case "password_reset":
      return "Réinitialisation du mot de passe";
    case "email_change":
      return "Confirmez votre nouvelle adresse";
  }
}

function getBody(type: AuthEmailType) {
  switch (type) {
    case "magic_link":
      return "Cliquez sur le bouton ci-dessous pour vous connecter à votre compte CollabCréa.";
    case "signup":
      return "Confirmez votre email pour activer votre compte CollabCréa.";
    case "password_reset":
      return "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.";
    case "email_change":
      return "Vous avez demandé à changer votre adresse email. Confirmez ce changement en cliquant ci-dessous.";
  }
}

function buildHtml(params: { type: AuthEmailType; actionLink: string; userName?: string }) {
  const logoUrl =
    "https://fkfdjibqpmdaobjrryja.supabase.co/storage/v1/object/public/email-assets/logo-collabcrea.png?v=1";
  const title = getTitle(params.type, params.userName);
  const body = getBody(params.type);
  const cta = getCtaLabel(params.type);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #1a0a2e; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: linear-gradient(180deg, #2d1a47 0%, #1a0a2e 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
    <div style="padding: 40px; text-align: center;">
      <img src="${logoUrl}" alt="CollabCréa" style="height: 60px; width: auto; margin-bottom: 8px;" />
      <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0;">La plateforme des créateurs africains</p>
    </div>
    <div style="padding: 0 40px 40px;">
      <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0;">${title}</h2>
      <p style="color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">${body}</p>
      <a href="${params.actionLink}" target="_blank"
         style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
        ${cta}
      </a>
      <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 28px 0 0 0;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = assertEnv("RESEND_API_KEY");
    const SUPABASE_URL = assertEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = assertEnv("SUPABASE_SERVICE_ROLE_KEY");

    const body: AuthEmailRequest = await req.json();

    if (!body?.email || !body?.type) {
      throw new Error("Email and type are required");
    }

    const redirectTo =
      body.redirectTo?.toString() || "https://collabcrea.com/creator/profile";

    // Generate a REAL auth action link (verification / magic link / recovery)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: getAdminLinkType(body.type),
      email: body.email,
      options: {
        redirectTo,
      },
    });

    // If the user already exists, generating a "signup" link can fail.
    // For resending a verification flow, we fallback to a magic link, which still proves email ownership.
    if (linkError && body.type === "signup" && (linkError as any)?.code === "email_exists") {
      ({ data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: body.email,
        options: {
          redirectTo,
        },
      }));
    }

    if (linkError) {
      console.error("generateLink failed:", linkError);
      throw new Error("Failed to generate verification link");
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      throw new Error("No action_link returned by generateLink");
    }

    const resend = new Resend(RESEND_API_KEY);

    const subject = getSubject(body.type);
    const html = buildHtml({
      type: body.type,
      actionLink,
      userName: body.userName,
    });

    const emailResponse = await resend.emails.send({
      from: "CollabCréa <noreply@collabcrea.com>",
      to: [body.email],
      subject,
      html,
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending auth email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
