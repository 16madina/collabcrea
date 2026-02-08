import { Sparkles } from "lucide-react";

interface PricingItem {
  type: string;
  price: number | string;
  description: string;
}

interface RateCardDisplayProps {
  pricing: PricingItem[] | null;
  avatarUrl?: string | null;
  fullName?: string;
  showEditButton?: boolean;
  onClick?: () => void;
}

// Platform order for display
const platformOrder = ["Snap", "TikTok", "Instagram", "YouTube", "Autres"];

const RateCardDisplay = ({ 
  pricing, 
  avatarUrl, 
  fullName,
  showEditButton = false,
  onClick,
}: RateCardDisplayProps) => {
  const hasPricing = pricing && pricing.length > 0;

  // Separate packs from regular items
  const packs = hasPricing ? pricing.filter(item => item.type.toLowerCase().includes("pack")) : [];
  const regularItems = hasPricing ? pricing.filter(item => !item.type.toLowerCase().includes("pack")) : [];

  // Group regular pricing by platform
  const groupedPricing = regularItems.length > 0 ? regularItems.reduce((acc, item) => {
    let platform = "Autres";
    if (item.type.toLowerCase().includes("instagram")) platform = "Instagram";
    else if (item.type.toLowerCase().includes("tiktok")) platform = "TikTok";
    else if (item.type.toLowerCase().includes("youtube")) platform = "YouTube";
    else if (item.type.toLowerCase().includes("snapchat") || item.type.toLowerCase().includes("snap")) platform = "Snap";
    
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(item);
    return acc;
  }, {} as Record<string, PricingItem[]>) : {};

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseInt(price.replace(/\D/g, "")) : price;
    if (isNaN(numPrice)) return price;
    return numPrice.toLocaleString("fr-FR") + "f";
  };

  // Get service name without platform prefix
  const getServiceName = (type: string) => {
    return type.replace(/instagram|tiktok|youtube|snapchat|snap/gi, "").trim() || type;
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl shadow-2xl ${onClick ? "cursor-pointer group" : ""}`}
      style={{ minHeight: "400px" }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Background" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-deep via-background to-violet" />
        )}
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
      </div>

      {/* Edit button - top right (only for creators) */}
      {showEditButton && (
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gold/50 shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">
            <span className="text-gold font-medium text-xs">✏️ Modifier</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col min-h-[400px]">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-white drop-shadow-lg tracking-wide">
            {fullName || "GRILLE TARIFAIRE"}
          </h1>
          <p className="text-white/80 text-sm mt-1 font-medium tracking-widest uppercase">
            Rate Card
          </p>
        </div>

        {hasPricing ? (
          /* Pricing Content */
          <div className="flex-1 space-y-5">
            {/* Packs Section */}
            {packs.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="px-8 py-2 rounded-full bg-gradient-to-r from-gold to-gold-light shadow-lg">
                    <span className="text-background font-bold text-sm tracking-wider uppercase">
                      ⭐ PACKS
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 px-4">
                  {packs.map((pack, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-white font-bold text-base drop-shadow-md">
                            {pack.type}
                          </p>
                          {pack.description && (
                            <p className="text-white/70 text-xs mt-1">
                              {pack.description}
                            </p>
                          )}
                        </div>
                        <span className="text-gold font-bold text-lg drop-shadow-md ml-3">
                          {formatPrice(pack.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Platform Pricing */}
            {platformOrder.map((platform) => {
              const items = groupedPricing[platform];
              if (!items || items.length === 0) return null;
              
              return (
                <div key={platform} className="space-y-2">
                  {/* Platform Badge */}
                  <div className="flex justify-center">
                    <div className="px-8 py-2 rounded-full bg-[#8B7355]/90 backdrop-blur-sm shadow-lg">
                      <span className="text-white font-semibold text-sm tracking-wider uppercase">
                        {platform === "Autres" ? "AUTRES" : platform.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Pricing Items */}
                  <div className="space-y-3 px-4">
                    {items.map((item, index) => (
                      <div 
                        key={index} 
                        className="py-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium text-base drop-shadow-md">
                            {getServiceName(item.type)}
                          </span>
                          <span className="text-white font-bold text-base drop-shadow-md">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        {item.description && (
                          <div className="mt-1 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
                            <p className="text-gold-light text-xs font-medium">
                              {item.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">
              Grille tarifaire non disponible
            </p>
            <p className="text-white/70 text-sm max-w-[200px]">
              Ce créateur n'a pas encore configuré ses tarifs
            </p>
          </div>
        )}

        {/* Footer */}
        {hasPricing && (
          <div className="mt-auto pt-4">
            <div className="text-center">
              <p className="text-white/60 text-xs italic">
                *Tarifs négociables selon le projet
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateCardDisplay;
