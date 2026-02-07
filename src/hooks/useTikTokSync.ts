import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useTikTokSync() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startOAuth = async (userId: string) => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/creator/profile`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-oauth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get authorization URL");
      }

      const result = await response.json();

      if (result.authUrl && result.codeVerifier) {
        // Store the redirect URI and code verifier for the callback
        sessionStorage.setItem("tiktok_redirect_uri", redirectUri);
        sessionStorage.setItem("tiktok_code_verifier", result.codeVerifier);
        // Redirect to TikTok OAuth
        window.location.href = result.authUrl;
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (error) {
      console.error("TikTok OAuth error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de connecter TikTok. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    setIsLoading(true);
    try {
      const redirectUri = sessionStorage.getItem("tiktok_redirect_uri") || `${window.location.origin}/creator/profile`;
      const codeVerifier = sessionStorage.getItem("tiktok_code_verifier");

      if (!codeVerifier) {
        throw new Error("Missing code verifier");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-oauth?action=callback&code=${encodeURIComponent(code)}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&code_verifier=${encodeURIComponent(codeVerifier)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete OAuth");
      }

      sessionStorage.removeItem("tiktok_redirect_uri");
      sessionStorage.removeItem("tiktok_code_verifier");

      toast({
        title: "Succès !",
        description: `TikTok connecté ! ${result.followers} abonnés synchronisés.`,
      });

      return result;
    } catch (error) {
      console.error("TikTok callback error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de synchroniser les abonnés TikTok.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    startOAuth,
    handleOAuthCallback,
  };
}
