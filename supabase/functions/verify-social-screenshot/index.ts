import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { verification_id } = await req.json();
    if (!verification_id) {
      return new Response(
        JSON.stringify({ error: "verification_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch verification request
    const { data: verification, error: fetchError } = await supabase
      .from("social_verifications")
      .select("*")
      .eq("id", verification_id)
      .single();

    if (fetchError || !verification) {
      return new Response(
        JSON.stringify({ error: "Verification not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get signed URL for the screenshot
    const { data: signedUrlData } = await supabase.storage
      .from("social-screenshots")
      .createSignedUrl(verification.screenshot_url, 3600);

    if (!signedUrlData?.signedUrl) {
      return new Response(
        JSON.stringify({ error: "Could not access screenshot" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download the image and convert to base64
    const imageResponse = await fetch(signedUrlData.signedUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Call AI to analyze the screenshot
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this social media screenshot. The user claims:
- Platform: ${verification.platform}
- Page/Account name: "${verification.page_name}"
- Follower count: "${verification.claimed_followers}"

Your task:
1. Extract the account/page name visible on the screenshot
2. Extract the follower/subscriber count visible on the screenshot
3. Determine if they match what the user claimed

IMPORTANT: 
- For the name, allow minor variations (e.g. "@dina" matches "Dina", "Dina Official" matches "Dina")
- For followers, allow reasonable rounding (e.g. "49.8K" matches "50K", "1.2M" matches "1200000")
- The screenshot should clearly be from the claimed platform (${verification.platform})

Respond using the tool provided.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_social_screenshot",
              description: "Report the verification results of a social media screenshot",
              parameters: {
                type: "object",
                properties: {
                  extracted_name: {
                    type: "string",
                    description: "The account/page name found in the screenshot",
                  },
                  extracted_followers: {
                    type: "string",
                    description: "The follower/subscriber count found in the screenshot (e.g. '50K', '1.2M')",
                  },
                  name_matches: {
                    type: "boolean",
                    description: "Whether the extracted name matches the claimed name (allowing minor variations)",
                  },
                  followers_match: {
                    type: "boolean",
                    description: "Whether the extracted follower count matches the claimed count (allowing reasonable rounding)",
                  },
                  is_correct_platform: {
                    type: "boolean",
                    description: "Whether the screenshot appears to be from the claimed platform",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 0 to 100 that this is a legitimate screenshot",
                  },
                  reason: {
                    type: "string",
                    description: "Brief explanation of the verification result",
                  },
                },
                required: [
                  "extracted_name",
                  "extracted_followers",
                  "name_matches",
                  "followers_match",
                  "is_correct_platform",
                  "confidence",
                  "reason",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "verify_social_screenshot" },
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service temporairement surchargé, réessayez dans un moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If AI fails, send to admin review
      await supabase
        .from("social_verifications")
        .update({
          status: "pending_admin",
          ai_reason: "AI analysis failed, sent to admin review",
        })
        .eq("id", verification_id);

      return new Response(
        JSON.stringify({ status: "pending_admin", reason: "Envoyé en vérification manuelle" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // AI didn't return structured data, send to admin
      await supabase
        .from("social_verifications")
        .update({
          status: "pending_admin",
          ai_reason: "AI could not analyze the screenshot",
        })
        .eq("id", verification_id);

      return new Response(
        JSON.stringify({ status: "pending_admin", reason: "Envoyé en vérification manuelle" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    const isVerified =
      result.name_matches &&
      result.followers_match &&
      result.is_correct_platform &&
      result.confidence >= 70;

    const needsAdmin = !isVerified && result.confidence >= 40;
    const status = isVerified ? "verified" : needsAdmin ? "pending_admin" : "rejected";

    // Update verification record
    await supabase
      .from("social_verifications")
      .update({
        status,
        ai_confidence: result.confidence,
        ai_extracted_name: result.extracted_name,
        ai_extracted_followers: result.extracted_followers,
        ai_reason: result.reason,
      })
      .eq("id", verification_id);

    // If verified, update the user's profile with the follower count
    if (isVerified) {
      const followerField = `${verification.platform}_followers`;
      await supabase
        .from("profiles")
        .update({ [followerField]: result.extracted_followers })
        .eq("user_id", verification.user_id);
    }

    return new Response(
      JSON.stringify({
        status,
        confidence: result.confidence,
        extracted_name: result.extracted_name,
        extracted_followers: result.extracted_followers,
        reason: result.reason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-social-screenshot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
