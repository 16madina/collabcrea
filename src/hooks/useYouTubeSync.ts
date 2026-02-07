import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useYouTubeSync() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startOAuth = async (userId: string) => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/creator/profile`;

      const { data, error } = await supabase.functions.invoke("youtube-oauth", {
        body: {},
        headers: {},
      });

      // We need to call with query params, so we use fetch directly
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-oauth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`,
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

      if (result.authUrl) {
        // Store the redirect URI for the callback
        sessionStorage.setItem("youtube_redirect_uri", redirectUri);
        // Redirect to Google OAuth
        window.location.href = result.authUrl;
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (error) {
      console.error("YouTube OAuth error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de connecter YouTube. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    setIsLoading(true);
    try {
      const redirectUri = sessionStorage.getItem("youtube_redirect_uri") || `${window.location.origin}/creator/profile`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-oauth?action=callback&code=${encodeURIComponent(code)}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`,
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

      sessionStorage.removeItem("youtube_redirect_uri");

      toast({
        title: "Succès !",
        description: `YouTube connecté ! ${result.subscribers} abonnés synchronisés.`,
      });

      return result;
    } catch (error) {
      console.error("YouTube callback error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de synchroniser les abonnés YouTube.",
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
