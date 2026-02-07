import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuthEmailRequest {
  type: "magic_link" | "signup" | "password_reset" | "email_change";
  email: string;
  token?: string;
  tokenHash?: string;
  redirectTo?: string;
  userName?: string;
}

// Email templates
const getEmailContent = (
  type: string,
  data: { 
    token?: string; 
    tokenHash?: string; 
    redirectTo?: string; 
    userName?: string;
    supabaseUrl?: string;
  }
) => {
  const baseUrl = data.redirectTo || "https://collabor.app";
  const logoUrl = "https://fkfdjibqpmdaobjrryja.supabase.co/storage/v1/object/public/email-assets/logo-collabcrea.png?v=1";
  
  const templates: Record<string, { subject: string; html: string }> = {
    magic_link: {
      subject: "🔑 Votre lien de connexion CollabCréa",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #1a0a2e; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(180deg, #2d1a47 0%, #1a0a2e 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
            <div style="padding: 40px; text-align: center;">
              <img src="${logoUrl}" alt="CollabCréa" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0;">La plateforme des créateurs africains</p>
            </div>
            <div style="padding: 0 40px 40px;">
              <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0;">Connectez-vous en un clic</h2>
              <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                Cliquez sur le bouton ci-dessous pour vous connecter à votre compte CollabCréa.
              </p>
              <a href="${data.supabaseUrl}/auth/v1/verify?token=${data.tokenHash}&type=magiclink&redirect_to=${baseUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Se connecter →
              </a>
              <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 32px 0 0 0;">
                Ce lien expire dans 1 heure. Si vous n'avez pas demandé ce lien, ignorez cet email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    signup: {
      subject: "✨ Bienvenue sur CollabCréa !",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #1a0a2e; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(180deg, #2d1a47 0%, #1a0a2e 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
            <div style="padding: 40px; text-align: center;">
              <img src="${logoUrl}" alt="CollabCréa" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0;">La plateforme des créateurs africains</p>
            </div>
            <div style="padding: 0 40px 40px;">
              <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0;">Bienvenue${data.userName ? `, ${data.userName}` : ""} ! 🎉</h2>
              <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Merci de rejoindre CollabCréa, la plateforme qui connecte les créateurs africains aux plus grandes marques.
              </p>
              <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                Confirmez votre email pour activer votre compte :
              </p>
              <a href="${data.supabaseUrl}/auth/v1/verify?token=${data.tokenHash}&type=signup&redirect_to=${baseUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Confirmer mon email →
              </a>
              <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 32px 0 0 0;">
                Ce lien expire dans 24 heures.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    password_reset: {
      subject: "🔒 Réinitialisez votre mot de passe CollabCréa",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #1a0a2e; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(180deg, #2d1a47 0%, #1a0a2e 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
            <div style="padding: 40px; text-align: center;">
              <img src="${logoUrl}" alt="CollabCréa" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0;">La plateforme des créateurs africains</p>
            </div>
            <div style="padding: 0 40px 40px;">
              <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0;">Réinitialisation du mot de passe</h2>
              <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
              </p>
              <a href="${data.supabaseUrl}/auth/v1/verify?token=${data.tokenHash}&type=recovery&redirect_to=${baseUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Réinitialiser →
              </a>
              <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 32px 0 0 0;">
                Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    email_change: {
      subject: "📧 Confirmez votre nouvelle adresse email",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #1a0a2e; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(180deg, #2d1a47 0%, #1a0a2e 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
            <div style="padding: 40px; text-align: center;">
              <img src="${logoUrl}" alt="CollabCréa" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0;">La plateforme des créateurs africains</p>
            </div>
            <div style="padding: 0 40px 40px;">
              <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0;">Confirmez votre nouvelle adresse</h2>
              <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                Vous avez demandé à changer votre adresse email. Confirmez ce changement en cliquant ci-dessous.
              </p>
              <a href="${data.supabaseUrl}/auth/v1/verify?token=${data.tokenHash}&type=email_change&redirect_to=${baseUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Confirmer →
              </a>
              <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 32px 0 0 0;">
                Ce lien expire dans 24 heures.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
  };

  return templates[type] || templates.signup;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-auth-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AuthEmailRequest = await req.json();
    console.log("Email request received:", { type: body.type, email: body.email });

    // Validate required fields
    if (!body.email || !body.type) {
      console.error("Missing required fields");
      throw new Error("Email and type are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    
    const emailContent = getEmailContent(body.type, {
      token: body.token,
      tokenHash: body.tokenHash,
      redirectTo: body.redirectTo,
      userName: body.userName,
      supabaseUrl,
    });

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "CollabCréa <noreply@collabcrea.com>",
      to: [body.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
