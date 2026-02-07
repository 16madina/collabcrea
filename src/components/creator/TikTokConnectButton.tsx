import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTikTokSync } from "@/hooks/useTikTokSync";
import { useAuth } from "@/hooks/useAuth";

interface TikTokConnectButtonProps {
  currentFollowers: string | null;
  onSyncComplete: () => void;
}

const TikTokConnectButton = ({ currentFollowers, onSyncComplete }: TikTokConnectButtonProps) => {
  const { user } = useAuth();
  const { isLoading, startOAuth } = useTikTokSync();

  const handleConnect = async () => {
    if (!user) return;
    await startOAuth(user.id);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleConnect}
      disabled={isLoading}
      className="shrink-0"
    >
      <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
      {currentFollowers ? "Sync" : "Connecter"}
    </Button>
  );
};

export default TikTokConnectButton;
