import { motion } from "framer-motion";
import { Edit3, Plus, Sparkles } from "lucide-react";
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
}

const PricingTab = ({ pricing, onEditPricing, avatarUrl, fullName, category }: PricingTabProps) => {
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

  const getPlatformIcon = (platform: string, size: number = 16) => {
    switch (platform) {
      case "Instagram":
        return <InstagramIcon className="w-8 h-8 p-1.5" size={size} />;
      case "TikTok":
        return <TikTokIcon className="w-8 h-8 p-1.5" size={size} />;
      case "YouTube":
        return <YouTubeIcon className="w-8 h-8 p-1.5" size={size} />;
      case "Snapchat":
        return <SnapchatIcon className="w-8 h-8 p-1.5" size={size} />;
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
        );
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("fr-FR");
  };

  // Get service name without platform prefix
  const getServiceName = (type: string) => {
    return type.replace(/instagram|tiktok|youtube|snapchat/gi, "").trim() || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      {hasPricing ? (
        <div className="space-y-4">
          {/* Media Kit Style Header Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold/30 via-primary/20 to-accent/20" />
            <div className="absolute inset-0 backdrop-blur-xl" />
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
            
            <div className="relative p-6">
              {/* Header with Photo */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-gold/40 shadow-xl">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">
                          {fullName?.charAt(0) || "C"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center ring-2 ring-background">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-foreground">
                    {fullName || "Créateur"}
                  </h3>
                  {category && (
                    <p className="text-sm text-muted-foreground">{category}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 text-xs font-medium bg-gold/20 text-gold rounded-full">
                      Rate Card
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onEditPricing}
                  className="text-gold hover:bg-gold/10"
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
              </div>

              {/* Pricing Grid */}
              <div className="space-y-4">
                {Object.entries(groupedPricing).map(([platform, items], platformIndex) => (
                  <motion.div
                    key={platform}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: platformIndex * 0.1 }}
                  >
                    {/* Platform Header */}
                    <div className="flex items-center gap-2 mb-3">
                      {getPlatformIcon(platform)}
                      <span className="font-semibold text-foreground">{platform}</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                    </div>

                    {/* Services Grid */}
                    <div className="grid gap-2">
                      {items.map((item, index) => (
                        <motion.div
                          key={item.type}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: platformIndex * 0.1 + index * 0.05 }}
                          className="group relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 hover:border-gold/30 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm">
                                {getServiceName(item.type)}
                              </p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right pl-3">
                              <div className="inline-flex items-baseline gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30">
                                <span className="font-bold text-gold text-base">
                                  {formatPrice(item.price)}
                                </span>
                                <span className="text-[10px] text-gold/80 font-medium">
                                  FCFA
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 pt-4 border-t border-border/30"
              >
                <p className="text-center text-xs text-muted-foreground">
                  💼 Prix négociables selon le projet • Contactez-moi pour un devis personnalisé
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-muted/30 to-accent/10" />
          <div className="absolute inset-0 backdrop-blur-xl" />
          
          <div className="relative text-center py-16 px-6">
            <div className="w-24 h-24 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-gold/20">
              <Sparkles className="w-12 h-12 text-gold" />
            </div>
            <h4 className="font-display font-bold text-xl mb-2">Créez votre Rate Card</h4>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
              Définissez vos tarifs professionnels et attirez plus de marques avec un media kit complet
            </p>
            <Button onClick={onEditPricing} variant="gold" size="lg" className="gap-2 shadow-lg shadow-gold/20">
              <Plus className="w-5 h-5" />
              Ajouter mes tarifs
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PricingTab;
