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
    const TIKTOK_CLIENT_KEY = Deno.env.get("TIKTOK_CLIENT_KEY");
    const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
      console.error("Missing TikTok OAuth credentials");
      throw new Error("TikTok OAuth credentials not configured");
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

      // Generate a code verifier and challenge for PKCE
      const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await crypto.subtle.digest("SHA-256", data);
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
      authUrl.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "user.info.stats");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      console.log("Generated TikTok OAuth URL for user:", state);

      return new Response(
        JSON.stringify({ 
          authUrl: authUrl.toString(),
          codeVerifier 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle OAuth callback - exchange code for tokens and fetch user stats
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const userId = url.searchParams.get("state");
      const redirectUri = url.searchParams.get("redirect_uri");
      const codeVerifier = url.searchParams.get("code_verifier");

      if (!code || !userId || !redirectUri || !codeVerifier) {
        throw new Error("Missing code, state, redirect_uri, or code_verifier");
      }

      console.log("Processing TikTok OAuth callback for user:", userId);

      // Exchange code for tokens
      const tokenResponse = await fetch(
        "https://open.tiktokapis.com/v2/oauth/token/",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_key: TIKTOK_CLIENT_KEY,
            client_secret: TIKTOK_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          }),
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("TikTok token exchange failed:", errorText);
        throw new Error("Failed to exchange authorization code");
      }

      const tokens = await tokenResponse.json();
      console.log("TikTok tokens received successfully");

      if (tokens.error) {
        console.error("TikTok token error:", tokens.error);
        throw new Error(tokens.error_description || "Token exchange failed");
      }

      // Fetch TikTok user info with stats
      const userResponse = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=follower_count",
        {
          headers: { 
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("TikTok API error:", errorText);
        throw new Error("Failed to fetch TikTok user data");
      }

      const userData = await userResponse.json();
      console.log("TikTok user data received:", JSON.stringify(userData));

      if (userData.error?.code !== "ok" && userData.error?.code) {
        throw new Error(userData.error.message || "Failed to get user info");
      }

      const followerCount = userData.data?.user?.follower_count;

      if (followerCount === undefined) {
        throw new Error("No follower count found in TikTok response");
      }

      console.log("TikTok follower count:", followerCount);

      // Format follower count for display
      let formattedFollowers: string;
      if (followerCount >= 1000000) {
        formattedFollowers = (followerCount / 1000000).toFixed(1) + "M";
      } else if (followerCount >= 1000) {
        formattedFollowers = (followerCount / 1000).toFixed(1) + "K";
      } else {
        formattedFollowers = followerCount.toString();
      }

      // Update the user's profile with TikTok followers
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ tiktok_followers: formattedFollowers })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
        throw new Error("Failed to update profile with TikTok data");
      }

      console.log("Profile updated successfully for user:", userId);

      return new Response(
        JSON.stringify({
          success: true,
          followers: formattedFollowers,
          rawCount: followerCount,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action parameter");
  } catch (error) {
    console.error("TikTok OAuth error:", error);
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
