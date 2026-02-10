import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFacebookSync } from "@/hooks/useFacebookSync";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Check } from "lucide-react";
import { FacebookIcon } from "@/components/ui/social-icons";

interface FacebookConnectButtonProps {
  currentFollowers?: string | null;
  onSyncComplete?: () => void;
}

const FacebookConnectButton = ({ currentFollowers, onSyncComplete }: FacebookConnectButtonProps) => {
  const { user } = useAuth();
  const { isLoading, startOAuth, handleOAuthCallback } = useFacebookSync();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle OAuth callback when returning from Facebook
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const hasFacebookRedirect = sessionStorage.getItem("facebook_redirect_uri");

    if (code && state && hasFacebookRedirect) {
      setIsProcessing(true);
      handleOAuthCallback(code, state)
        .then(() => {
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
    if (isNaN(num)) return count;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return count;
  };

  const hasFollowers = currentFollowers && currentFollowers !== "0";

  return (
    <Button
      type="button"
      variant={hasFollowers ? "outline" : "default"}
      size="sm"
      onClick={handleConnect}
      disabled={isLoading || isProcessing}
      className="shrink-0 gap-2"
    >
      {isLoading || isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FacebookIcon className="w-4 h-4 p-0" size={16} />
      )}
      {hasFollowers ? (
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3 text-green-500" />
          {formatFollowers(currentFollowers)} abonnés
        </span>
      ) : (
        "Connecter"
      )}
    </Button>
  );
};

export default FacebookConnectButton;
