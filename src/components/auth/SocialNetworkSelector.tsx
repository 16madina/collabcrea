import { cn } from "@/lib/utils";

// SVG icons for social networks
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03a1.67 1.67 0 0 1-.376-.045c-.238-.06-.539-.12-.899-.12-.226 0-.457.015-.691.046-.675.09-1.154.54-1.771 1.108-.3.27-.614.551-.975.801-.601.39-1.229.585-1.862.585-.03 0-.06 0-.089-.003-.63-.015-1.231-.21-1.832-.585-.346-.24-.646-.51-.931-.765-.642-.585-1.168-1.065-1.906-1.168a4.82 4.82 0 0 0-.705-.044c-.314 0-.63.046-.869.119-.121.03-.24.045-.361.045-.24 0-.42-.09-.525-.3-.063-.18-.102-.391-.153-.615-.046-.21-.1-.465-.149-.615-1.918-.255-2.982-.66-3.208-1.216a.524.524 0 0 1-.044-.218c-.016-.24.164-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809a4.89 4.89 0 0 1-.345-.119c-.823-.33-1.228-.72-1.213-1.17 0-.36.284-.69.735-.836.149-.061.33-.09.51-.09.119 0 .299.015.449.09.39.18.734.301 1.048.301.181 0 .33-.046.405-.091l-.033-.509c-.104-1.627-.225-3.653.299-4.847C7.859 1.069 11.216.793 12.206.793"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

interface SocialNetwork {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  bgColor: string;
  iconColor: string;
}

const socialNetworks: SocialNetwork[] = [
  { 
    id: "tiktok", 
    name: "TikTok", 
    icon: TikTokIcon, 
    bgColor: "bg-black",
    iconColor: "text-white"
  },
  { 
    id: "youtube", 
    name: "YouTube", 
    icon: YouTubeIcon, 
    bgColor: "bg-red-600",
    iconColor: "text-white"
  },
  { 
    id: "snapchat", 
    name: "Snapchat", 
    icon: SnapchatIcon, 
    bgColor: "bg-yellow-400",
    iconColor: "text-black"
  },
  { 
    id: "facebook", 
    name: "Facebook", 
    icon: FacebookIcon, 
    bgColor: "bg-blue-600",
    iconColor: "text-white"
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    icon: InstagramIcon, 
    bgColor: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    iconColor: "text-white"
  },
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
        {socialNetworks.map((network) => {
          const Icon = network.icon;
          const isSelected = value.includes(network.id);
          
          return (
            <button
              key={network.id}
              type="button"
              onClick={() => toggleNetwork(network.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200",
                isSelected
                  ? "border-gold bg-gold/10"
                  : "border-border hover:border-gold/50"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                network.bgColor
              )}>
                <Icon className={cn("w-4 h-4", network.iconColor)} />
              </div>
              <span className={cn(
                "font-medium",
                isSelected && "text-gold"
              )}>
                {network.name}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-destructive text-xs text-center">{error}</p>}
    </div>
  );
};

export default SocialNetworkSelector;
