import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useFacebookSync() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startOAuth = async (userId: string) => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/creator/profile`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-oauth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`,
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
        sessionStorage.setItem("facebook_redirect_uri", redirectUri);
        window.location.href = result.authUrl;
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (error) {
      console.error("Facebook OAuth error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de connecter Facebook. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    setIsLoading(true);
    try {
      const redirectUri = sessionStorage.getItem("facebook_redirect_uri") || `${window.location.origin}/creator/profile`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-oauth?action=callback&code=${encodeURIComponent(code)}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`,
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

      sessionStorage.removeItem("facebook_redirect_uri");

      toast({
        title: "Succès !",
        description: `Facebook connecté ! ${result.followers} abonnés synchronisés.`,
      });

      return result;
    } catch (error) {
      console.error("Facebook callback error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de synchroniser les abonnés Facebook.",
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
