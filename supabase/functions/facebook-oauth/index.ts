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
    const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
    const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error("Missing Facebook OAuth credentials");
      throw new Error("Facebook OAuth credentials not configured");
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

      const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
      authUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "pages_show_list,pages_read_engagement");
      authUrl.searchParams.set("state", state);

      console.log("Generated Facebook OAuth URL for user:", state);

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle OAuth callback - exchange code for tokens and fetch page followers
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const userId = url.searchParams.get("state");
      const redirectUri = url.searchParams.get("redirect_uri");

      if (!code || !userId || !redirectUri) {
        throw new Error("Missing code, state, or redirect_uri");
      }

      console.log("Processing Facebook OAuth callback for user:", userId);

      // Exchange code for user access token
      const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
      tokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl.toString());

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Facebook token exchange failed:", errorText);
        throw new Error("Failed to exchange authorization code");
      }

      const tokens = await tokenResponse.json();
      console.log("Facebook tokens received successfully");

      if (tokens.error) {
        console.error("Facebook token error:", tokens.error);
        throw new Error(tokens.error.message || "Token exchange failed");
      }

      // Fetch user's Facebook Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,fan_count&access_token=${tokens.access_token}`
      );

      if (!pagesResponse.ok) {
        const errorText = await pagesResponse.text();
        console.error("Facebook Pages API error:", errorText);
        throw new Error("Failed to fetch Facebook Pages data");
      }

      const pagesData = await pagesResponse.json();
      console.log("Facebook pages data received:", JSON.stringify(pagesData));

      if (!pagesData.data || pagesData.data.length === 0) {
        // If no pages, try to get the user's profile followers
        const profileResponse = await fetch(
          `https://graph.facebook.com/v21.0/me?fields=friends&access_token=${tokens.access_token}`
        );
        
        const profileData = await profileResponse.json();
        console.log("Facebook profile data:", JSON.stringify(profileData));
        
        // Use friends count or default to 0
        const friendsCount = profileData.friends?.summary?.total_count || 0;
        
        const formattedFollowers = formatCount(friendsCount);
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ facebook_followers: formattedFollowers })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Failed to update profile:", updateError);
          throw new Error("Failed to update profile with Facebook data");
        }

        return new Response(
          JSON.stringify({
            success: true,
            followers: formattedFollowers,
            pageName: "Profil personnel",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Find the page with the most fans
      let bestPage = pagesData.data[0];
      let totalFans = 0;
      for (const page of pagesData.data) {
        totalFans += page.fan_count || 0;
        if ((page.fan_count || 0) > (bestPage.fan_count || 0)) {
          bestPage = page;
        }
      }

      // Use total fans across all pages
      const followerCount = totalFans;
      console.log("Facebook total fans:", followerCount);

      const formattedFollowers = formatCount(followerCount);

      // Update the user's profile with Facebook followers
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ facebook_followers: formattedFollowers })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
        throw new Error("Failed to update profile with Facebook data");
      }

      console.log("Profile updated successfully for user:", userId);

      return new Response(
        JSON.stringify({
          success: true,
          followers: formattedFollowers,
          rawCount: followerCount,
          pagesCount: pagesData.data.length,
          topPage: bestPage.name,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action parameter");
  } catch (error) {
    console.error("Facebook OAuth error:", error);
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

function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
}
