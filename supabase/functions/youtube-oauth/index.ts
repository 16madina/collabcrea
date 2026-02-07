import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials");
      throw new Error("Google OAuth credentials not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase credentials");
      throw new Error("Supabase credentials not configured");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Generate OAuth URL for authorization
    if (action === "authorize") {
      const redirectUri = url.searchParams.get("redirect_uri");
      const state = url.searchParams.get("state"); // user_id

      if (!redirectUri || !state) {
        throw new Error("Missing redirect_uri or state parameter");
      }

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.readonly");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("prompt", "consent");

      console.log("Generated YouTube OAuth URL for user:", state);

      return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle OAuth callback - exchange code for tokens and fetch channel stats
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const userId = url.searchParams.get("state");
      const redirectUri = url.searchParams.get("redirect_uri");

      if (!code || !userId || !redirectUri) {
        throw new Error("Missing code, state, or redirect_uri");
      }

      console.log("Processing OAuth callback for user:", userId);

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", errorText);
        throw new Error("Failed to exchange authorization code");
      }

      const tokens = await tokenResponse.json();
      console.log("Tokens received successfully");

      // Fetch YouTube channel statistics
      const channelResponse = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true",
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      if (!channelResponse.ok) {
        const errorText = await channelResponse.text();
        console.error("YouTube API error:", errorText);
        throw new Error("Failed to fetch YouTube channel data");
      }

      const channelData = await channelResponse.json();
      console.log("YouTube channel data received:", JSON.stringify(channelData));

      if (!channelData.items || channelData.items.length === 0) {
        throw new Error("No YouTube channel found for this account");
      }

      const stats = channelData.items[0].statistics;
      const subscriberCount = stats.subscriberCount;

      console.log("Subscriber count:", subscriberCount);

      // Update the user's profile with YouTube followers
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ youtube_followers: subscriberCount })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
        throw new Error("Failed to update profile with YouTube data");
      }

      console.log("Profile updated successfully for user:", userId);

      return new Response(
        JSON.stringify({
          success: true,
          subscribers: subscriberCount,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action parameter");
  } catch (error) {
    console.error("YouTube OAuth error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
