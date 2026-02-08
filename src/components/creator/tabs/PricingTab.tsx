import { motion } from "framer-motion";
import { Plus, Mail, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { YouTubeIcon, InstagramIcon, TikTokIcon, SnapchatIcon } from "@/components/ui/social-icons";

interface PricingItem {
  type: string;
  price: number;
  description: string;
}

interface PricingTabProps {
  pricing: PricingItem[] | null;
  onEditPricing: () => void;
  avatarUrl?: string | null;
  fullName?: string;
  category?: string | null;
  socialAccounts?: { platform: string; followers: string }[];
  email?: string | null;
  country?: string | null;
}

const PricingTab = ({ 
  pricing, 
  onEditPricing, 
  avatarUrl, 
  fullName, 
  category,
  socialAccounts = [],
  email,
  country
}: PricingTabProps) => {
  const hasPricing = pricing && pricing.length > 0;

  // Group pricing by platform
  const groupedPricing = hasPricing ? pricing.reduce((acc, item) => {
    let platform = "Autres";
    if (item.type.toLowerCase().includes("instagram")) platform = "Instagram";
    else if (item.type.toLowerCase().includes("tiktok")) platform = "TikTok";
    else if (item.type.toLowerCase().includes("youtube")) platform = "YouTube";
    else if (item.type.toLowerCase().includes("snapchat")) platform = "Snapchat";
    
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(item);
    return acc;
  }, {} as Record<string, PricingItem[]>) : {};

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <InstagramIcon className="w-6 h-6 p-1" size={14} />;
      case "tiktok":
        return <TikTokIcon className="w-6 h-6 p-1" size={14} />;
      case "youtube":
        return <YouTubeIcon className="w-6 h-6 p-1" size={14} />;
      case "snapchat":
        return <SnapchatIcon className="w-6 h-6 p-1" size={14} />;
      default:
        return null;
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("fr-FR");
  };

  // Get service name without platform prefix
  const getServiceName = (type: string) => {
    return type.replace(/instagram|tiktok|youtube|snapchat/gi, "").trim() || type;
  };

  // List of common services for empty state
  const defaultServices = [
    "Vidéo sponsorisée",
    "Story Instagram",
    "Post carrousel",
    "Unboxing vidéo",
    "Témoignage produit",
    "ASMR & Voiceover",
    "Photos lifestyle",
    "Contenu UGC"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      {/* CV Style Rate Card - Clickable to edit */}
      <motion.div
        onClick={onEditPricing}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden rounded-2xl cursor-pointer group shadow-xl"
      >
        {/* Edit overlay on hover */}
        <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gold/50 shadow-lg">
            <span className="text-gold font-medium text-sm">✏️ Modifier ma grille</span>
          </div>
        </div>

        <div className="flex">
          {/* Left Column - Dark */}
          <div className="w-[42%] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] p-4 flex flex-col">
            {/* Profile Photo */}
            <div className="mb-4">
              <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-gold/30 shadow-lg">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={fullName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold/40 to-gold/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white/80">
                      {fullName?.charAt(0) || "C"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Section */}
            <div className="mb-5">
              <h4 className="text-gold font-display font-bold text-sm uppercase tracking-wider mb-3">
                Contact
              </h4>
              {email && (
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-3.5 h-3.5 text-gold/70" />
                  <span className="text-white/80 text-[10px] truncate">{email}</span>
                </div>
              )}
              {country && (
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-gold/70" />
                  <span className="text-white/80 text-[10px]">{country}</span>
                </div>
              )}
              
              {/* Social Handles */}
              <div className="space-y-1.5 mt-3">
                {socialAccounts.map((account) => (
                  <div key={account.platform} className="flex items-center gap-2">
                    {getSocialIcon(account.platform)}
                    <span className="text-white/80 text-[10px]">
                      {account.followers} abonnés
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Section */}
            <div>
              <h4 className="text-gold font-display font-bold text-sm uppercase tracking-wider mb-3">
                Services
              </h4>
              <ul className="space-y-1.5">
                {hasPricing ? (
                  // Show actual services from pricing
                  [...new Set(pricing.map(p => getServiceName(p.type)))].slice(0, 8).map((service, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gold mt-0.5">•</span>
                      <span className="text-white/80 text-[10px] leading-tight">{service}</span>
                    </li>
                  ))
                ) : (
                  // Show default services
                  defaultServices.map((service, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gold/50 mt-0.5">•</span>
                      <span className="text-white/40 text-[10px] leading-tight">{service}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Right Column - Light */}
          <div className="w-[58%] bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] p-4 flex flex-col">
            {/* Header */}
            <div className="text-center mb-4 pb-3 border-b-2 border-foreground/20">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Créateur UGC
              </p>
              <h2 className="font-display font-bold text-lg text-foreground leading-tight">
                {fullName || "Votre Nom"}
              </h2>
              {category && (
                <p className="text-xs text-gold mt-0.5">{category}</p>
              )}
            </div>

            {/* Rate Card Title */}
            <div className="text-center mb-4">
              <div className="inline-block px-4 py-1 border-t-2 border-b-2 border-foreground/30">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-foreground">
                  Rate Card
                </h3>
              </div>
            </div>

            {hasPricing ? (
              /* Pricing Content */
              <div className="flex-1 space-y-4 text-center">
                {Object.entries(groupedPricing).map(([platform, items]) => (
                  <div key={platform}>
                    <h4 className="font-bold text-xs text-foreground mb-2">
                      {platform === "Autres" ? "Contenus" : platform}
                    </h4>
                    <div className="space-y-1">
                      {items.map((item, index) => (
                        <div key={index} className="text-[10px] text-foreground/80">
                          <span>{getServiceName(item.type)}</span>
                          <span className="mx-1">–</span>
                          <span className="font-semibold text-gold">
                            {formatPrice(item.price)} FCFA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-gold/50" />
                </div>
                <p className="text-[10px] text-foreground/50 mb-1">
                  Ajoutez vos tarifs
                </p>
                <p className="text-[9px] text-foreground/40 max-w-[120px]">
                  Cliquez pour définir votre grille tarifaire
                </p>
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-auto pt-3 border-t border-foreground/10">
              <p className="text-[8px] text-center text-foreground/40 italic">
                *Prix négociables selon le projet
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA Button below card */}
      {!hasPricing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <Button 
            onClick={onEditPricing} 
            variant="gold" 
            className="w-full gap-2 shadow-lg shadow-gold/20"
          >
            <Plus className="w-4 h-4" />
            Créer ma grille tarifaire
          </Button>
        </motion.div>
      )}

      {/* Tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-[10px] text-muted-foreground mt-4"
      >
        💡 Touchez la carte pour modifier vos tarifs
      </motion.p>
    </motion.div>
  );
};

export default PricingTab;
