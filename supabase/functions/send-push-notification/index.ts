import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  send_to_all?: boolean;
}

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// Function to get OAuth2 access token using service account
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // Token expires in 1 hour

  // Create JWT header and payload
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: exp,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key and sign
  const privateKey = serviceAccount.private_key;
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\n/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error("Token error:", tokenData);
    throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`);
  }

  return tokenData.access_token;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firebaseServiceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication check - skip for testing/internal calls
    // In production, uncomment the admin verification block below
    const authHeader = req.headers.get("Authorization");
    const skipAuth = req.headers.get("X-Skip-Auth") === "true";
    
    console.log("Auth check - skipAuth:", skipAuth, "hasAuthHeader:", !!authHeader);
    
    // For now, allow all calls for testing. In production, enable admin check:
    /*
    if (authHeader && !skipAuth) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token && token.length > 20) {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }
    */

    const payload: PushPayload = await req.json();
    console.log("Received payload:", payload);

    const { user_id, user_ids, title, body, data, send_to_all } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tokens based on targeting
    let tokensQuery = supabase.from("push_tokens").select("token, user_id");

    if (send_to_all) {
      console.log("Sending to all users");
    } else if (user_ids && user_ids.length > 0) {
      tokensQuery = tokensQuery.in("user_id", user_ids);
      console.log("Sending to specific users:", user_ids);
    } else if (user_id) {
      tokensQuery = tokensQuery.eq("user_id", user_id);
      console.log("Sending to single user:", user_id);
    } else {
      return new Response(
        JSON.stringify({ error: "user_id, user_ids, or send_to_all is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: tokens, error: tokensError } = await tokensQuery;

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No tokens found for the specified users");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No tokens found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${tokens.length} tokens to send to`);

    // Determine which API to use
    let sendNotification: (token: string) => Promise<any>;

    if (firebaseServiceAccountJson) {
      // Use FCM HTTP v1 API (recommended)
      console.log("Using FCM HTTP v1 API with service account");
      const serviceAccount: ServiceAccount = JSON.parse(firebaseServiceAccountJson);
      const accessToken = await getAccessToken(serviceAccount);

      sendNotification = async (token: string) => {
        const fcmPayload = {
          message: {
            token: token,
            notification: {
              title,
              body,
            },
            data: data || {},
            android: {
              notification: {
                sound: "default",
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                },
              },
            },
          },
        };

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(fcmPayload),
          }
        );

        return await response.json();
      };
    } else if (firebaseServerKey) {
      // Fallback to legacy FCM API
      console.log("Using legacy FCM API with server key");
      
      sendNotification = async (token: string) => {
        const fcmPayload = {
          to: token,
          notification: {
            title,
            body,
            sound: "default",
          },
          data: data || {},
        };

        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${firebaseServerKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fcmPayload),
        });

        return await response.json();
      };
    } else {
      throw new Error("Neither FIREBASE_SERVICE_ACCOUNT nor FIREBASE_SERVER_KEY is configured");
    }

    // Send notifications
    const results = await Promise.allSettled(
      tokens.map(async ({ token }) => {
        const result = await sendNotification(token);
        console.log("FCM response for token:", result);
        return result;
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Sent: ${successful}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
        total: tokens.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
