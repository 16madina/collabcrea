import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeEmailRequest {
  email: string;
  userName?: string;
  userRole?: "creator" | "brand";
}

function assertEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function buildHtml(params: { userName?: string; userRole?: "creator" | "brand" }) {
  const logoUrl =
    "https://fkfdjibqpmdaobjrryja.supabase.co/storage/v1/object/public/email-assets/logo-collabcrea.png?v=1";
  const profileUrl = params.userRole === "brand" 
    ? "https://collabcrea.lovable.app/brand/profile"
    : "https://collabcrea.lovable.app/creator/profile";
  const exploreUrl = "https://collabcrea.lovable.app/explore";
  
  const greeting = params.userName ? `${params.userName}` : "là";
  const isCreator = params.userRole !== "brand";

  const features = isCreator ? `
    <div style="background: rgba(212, 175, 55, 0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #d4af37; font-size: 16px; margin: 0 0 16px 0;">✨ Ce que CollabCréa vous offre :</h3>
      <ul style="color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong>Visibilité auprès des grandes marques</strong> – Des entreprises recherchent activement des créateurs comme vous</li>
        <li><strong>Opportunités rémunérées</strong> – Accédez à des offres de collaboration exclusives</li>
        <li><strong>Gestion simplifiée</strong> – Un seul endroit pour gérer vos candidatures et messages</li>
        <li><strong>Réseau africain</strong> – Rejoignez une communauté de créateurs talentueux</li>
      </ul>
    </div>
    
    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid rgba(212, 175, 55, 0.15);">
      <h3 style="color: #ffffff; font-size: 16px; margin: 0 0 12px 0;">🚀 Prochaine étape : Complétez votre profil</h3>
      <p style="color: rgba(255,255,255,0.75); font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Un profil complet augmente vos chances d'être contacté par les marques de <strong style="color: #d4af37;">3x</strong> !
      </p>
      <ul style="color: rgba(255,255,255,0.75); font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px;">
        <li>📸 Ajoutez une photo de profil professionnelle</li>
        <li>📝 Rédigez une bio qui vous démarque</li>
        <li>🔗 Connectez vos réseaux sociaux (TikTok, YouTube, Instagram)</li>
        <li>💰 Définissez vos tarifs de collaboration</li>
        <li>✅ Vérifiez votre identité pour débloquer toutes les fonctionnalités</li>
      </ul>
    </div>
  ` : `
    <div style="background: rgba(212, 175, 55, 0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #d4af37; font-size: 16px; margin: 0 0 16px 0;">✨ Ce que CollabCréa vous offre :</h3>
      <ul style="color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong>Accès à des créateurs vérifiés</strong> – Des influenceurs africains authentiques et engagés</li>
        <li><strong>Recherche simplifiée</strong> – Filtrez par pays, catégorie et audience</li>
        <li><strong>Gestion centralisée</strong> – Publiez des offres et gérez vos collaborations</li>
        <li><strong>Communication directe</strong> – Échangez facilement avec les créateurs</li>
      </ul>
    </div>
    
    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid rgba(212, 175, 55, 0.15);">
      <h3 style="color: #ffffff; font-size: 16px; margin: 0 0 12px 0;">🚀 Prochaine étape : Complétez votre profil marque</h3>
      <p style="color: rgba(255,255,255,0.75); font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Un profil complet inspire confiance aux créateurs et attire les meilleurs talents !
      </p>
      <ul style="color: rgba(255,255,255,0.75); font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px;">
        <li>🏢 Ajoutez le logo de votre entreprise</li>
        <li>📝 Décrivez votre marque et vos valeurs</li>
        <li>🌐 Ajoutez votre site web</li>
        <li>📢 Publiez votre première offre de collaboration</li>
      </ul>
    </div>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #1a0a2e; margin: 0; padding: 40px 20px;">
  <div style="max-width: 580px; margin: 0 auto; background: linear-gradient(180deg, #2d1a47 0%, #1a0a2e 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
    <div style="padding: 40px; text-align: center;">
      <img src="${logoUrl}" alt="CollabCréa" style="height: 60px; width: auto; margin-bottom: 8px;" />
      <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0;">La plateforme des créateurs africains</p>
    </div>
    
    <div style="padding: 0 40px 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px; margin-bottom: 16px;">
          🎉
        </div>
        <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 8px 0;">Félicitations, ${greeting} !</h1>
        <p style="color: #d4af37; font-size: 16px; margin: 0;">Votre email est maintenant vérifié</p>
      </div>
      
      <p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.7; margin: 0 0 8px 0; text-align: center;">
        Bienvenue dans la communauté CollabCréa ! Vous avez franchi la première étape pour ${isCreator ? "connecter votre talent aux plus grandes marques" : "découvrir les meilleurs créateurs africains"}.
      </p>
      
      ${features}
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="${profileUrl}" target="_blank"
           style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; margin-bottom: 12px;">
          Compléter mon profil →
        </a>
        <br>
        <a href="${exploreUrl}" target="_blank"
           style="display: inline-block; color: #d4af37; text-decoration: none; padding: 12px 24px; font-size: 14px; margin-top: 8px;">
          ${isCreator ? "Découvrir les offres disponibles" : "Explorer les créateurs"}
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0;">
      
      <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; margin: 0;">
        Des questions ? Répondez à cet email ou contactez-nous sur<br>
        <a href="https://collabcrea.lovable.app/contact" style="color: #d4af37; text-decoration: none;">collabcrea.com/contact</a>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 24px;">
    <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
      © 2025 CollabCréa. Tous droits réservés.
    </p>
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
    const SUPABASE_ANON_KEY = assertEnv("SUPABASE_ANON_KEY");

    // Get authorization header for user context
    const authHeader = req.headers.get("authorization");
    
    const body: WelcomeEmailRequest = await req.json();
    console.log("Received welcome email request:", { email: body.email, userName: body.userName, userRole: body.userRole });

    if (!body?.email) {
      throw new Error("Email is required");
    }

    // If no role provided, try to fetch from database
    let userRole = body.userRole;
    let userName = body.userName;

    if (authHeader && (!userRole || !userName)) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get role if not provided
        if (!userRole) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();
          
          if (roleData) {
            userRole = roleData.role as "creator" | "brand";
          }
        }

        // Get name if not provided
        if (!userName) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single();
          
          if (profileData?.full_name) {
            userName = profileData.full_name.split(" ")[0]; // First name only
          }
        }
      }
    }

    console.log("Sending welcome email with:", { userRole, userName });

    const resend = new Resend(RESEND_API_KEY);

    const html = buildHtml({
      userName,
      userRole,
    });

    const emailResponse = await resend.emails.send({
      from: "CollabCréa <noreply@collabcrea.com>",
      to: [body.email],
      subject: "🎉 Bienvenue sur CollabCréa – Votre aventure commence !",
      html,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
