import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useYouTubeSync } from "@/hooks/useYouTubeSync";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Youtube, Check } from "lucide-react";

interface YouTubeConnectButtonProps {
  currentFollowers?: string | null;
  onSyncComplete?: () => void;
}

const YouTubeConnectButton = ({ currentFollowers, onSyncComplete }: YouTubeConnectButtonProps) => {
  const { user } = useAuth();
  const { isLoading, startOAuth, handleOAuthCallback } = useYouTubeSync();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle OAuth callback when returning from Google
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      setIsProcessing(true);
      handleOAuthCallback(code, state)
        .then(() => {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          onSyncComplete?.();
        })
        .catch(console.error)
        .finally(() => setIsProcessing(false));
    }
  }, []);

  const handleConnect = () => {
    if (user?.id) {
      startOAuth(user.id);
    }
  };

  const formatFollowers = (count: string) => {
    const num = parseInt(count, 10);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return count;
  };

  const hasFollowers = currentFollowers && parseInt(currentFollowers, 10) > 0;

  return (
    <Button
      variant={hasFollowers ? "outline" : "default"}
      size="sm"
      onClick={handleConnect}
      disabled={isLoading || isProcessing}
      className="gap-2"
    >
      {isLoading || isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Youtube className="h-4 w-4 text-red-500" />
      )}
      {hasFollowers ? (
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3 text-green-500" />
          {formatFollowers(currentFollowers)} abonnés
        </span>
      ) : (
        "Connecter YouTube"
      )}
    </Button>
  );
};

export default YouTubeConnectButton;
