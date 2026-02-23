import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { collaboration_id } = await req.json();
    if (!collaboration_id) {
      return new Response(
        JSON.stringify({ error: "collaboration_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get collaboration with offer details
    const { data: collab, error: collabError } = await supabase
      .from("collaborations")
      .select("*, offer:offers(title, description, category, content_type, delivery_mode)")
      .eq("id", collaboration_id)
      .single();

    if (collabError || !collab) {
      return new Response(
        JSON.stringify({ error: "Collaboration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicationUrl = collab.publication_url;
    if (!publicationUrl) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Aucun lien de publication soumis." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect platform from URL
    const platform = detectPlatform(publicationUrl);

    // Build AI verification prompt
    const offerInfo = collab.offer;
    const prompt = `Tu es un vérificateur de liens de publication pour une plateforme de collaboration créateurs-marques.

Le créateur devait produire du contenu pour l'offre suivante :
- Titre : "${offerInfo?.title || "N/A"}"
- Description : "${offerInfo?.description || "N/A"}"
- Catégorie : ${offerInfo?.category || "N/A"}
- Type de contenu : ${offerInfo?.content_type || "N/A"}

Le créateur a soumis la description suivante pour son contenu :
"${collab.content_description || "Aucune description"}"

Le créateur a soumis ce lien de publication : ${publicationUrl}

Analyse ce lien et donne ton verdict :

1. **Validité du lien** : Est-ce un lien valide vers un réseau social connu (TikTok, Instagram, YouTube, Facebook, Twitter/X, Snapchat) ? Le format de l'URL est-il correct pour un post/vidéo sur cette plateforme ?

2. **Plateforme détectée** : Quelle plateforme est-ce ? (${platform || "Non détectée"})

3. **Cohérence** : Le lien semble-t-il cohérent avec le brief de l'offre ? (basé sur l'URL et la description du contenu soumis)

Réponds UNIQUEMENT avec un JSON valide (sans markdown) au format :
{
  "valid": true/false,
  "platform": "nom de la plateforme",
  "confidence": 0-100,
  "reason": "explication courte en français",
  "warnings": ["liste d'avertissements éventuels"]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Tu es un assistant de vérification de liens. Réponds uniquement en JSON valide." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response - handle potential markdown wrapping
    let verification;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      verification = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      verification = {
        valid: false,
        platform: platform || "unknown",
        confidence: 0,
        reason: "Impossible d'analyser le lien automatiquement.",
        warnings: ["L'analyse IA n'a pas pu être effectuée."],
      };
    }

    // Also do basic URL format validation
    const urlChecks = validateUrl(publicationUrl);
    if (!urlChecks.valid) {
      verification.valid = false;
      verification.warnings = [...(verification.warnings || []), urlChecks.reason];
    }

    console.log("Verification result:", verification);

    return new Response(
      JSON.stringify(verification),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying publication link:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function detectPlatform(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes("tiktok.com") || lower.includes("vm.tiktok.com")) return "TikTok";
  if (lower.includes("instagram.com")) return "Instagram";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "YouTube";
  if (lower.includes("facebook.com") || lower.includes("fb.watch")) return "Facebook";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "X (Twitter)";
  if (lower.includes("snapchat.com")) return "Snapchat";
  if (lower.includes("threads.net")) return "Threads";
  return null;
}

function validateUrl(url: string): { valid: boolean; reason?: string } {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, reason: "Le lien doit commencer par http:// ou https://" };
    }
    const platform = detectPlatform(url);
    if (!platform) {
      return { valid: false, reason: "Le lien ne correspond à aucun réseau social reconnu." };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Le format de l'URL est invalide." };
  }
}
