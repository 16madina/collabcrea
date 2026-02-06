import { cn } from "@/lib/utils";

interface SocialNetwork {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const socialNetworks: SocialNetwork[] = [
  { id: "tiktok", name: "TikTok", icon: "📱", color: "bg-black" },
  { id: "youtube", name: "YouTube", icon: "🎬", color: "bg-red-600" },
  { id: "snapchat", name: "Snapchat", icon: "👻", color: "bg-yellow-400" },
  { id: "facebook", name: "Facebook", icon: "📘", color: "bg-blue-600" },
  { id: "instagram", name: "Instagram", icon: "📸", color: "bg-gradient-to-br from-purple-600 to-pink-500" },
];

interface SocialNetworkSelectorProps {
  value: string[];
  onChange: (networks: string[]) => void;
  error?: string;
}

const SocialNetworkSelector = ({ value, onChange, error }: SocialNetworkSelectorProps) => {
  const toggleNetwork = (networkId: string) => {
    if (value.includes(networkId)) {
      onChange(value.filter((id) => id !== networkId));
    } else {
      onChange([...value, networkId]);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Sur quels réseaux êtes-vous actif ?
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {socialNetworks.map((network) => (
          <button
            key={network.id}
            type="button"
            onClick={() => toggleNetwork(network.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200",
              value.includes(network.id)
                ? "border-gold bg-gold/10 text-gold"
                : "border-border hover:border-gold/50"
            )}
          >
            <span className="text-lg">{network.icon}</span>
            <span className="font-medium">{network.name}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-destructive text-xs text-center">{error}</p>}
    </div>
  );
};

export default SocialNetworkSelector;
