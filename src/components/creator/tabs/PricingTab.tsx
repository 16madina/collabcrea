import { motion } from "framer-motion";
import { Edit3, Plus, CreditCard, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingItem {
  type: string;
  price: number;
  description: string;
}

interface PricingTabProps {
  pricing: PricingItem[] | null;
  onEditPricing: () => void;
}

const PricingTab = ({ pricing, onEditPricing }: PricingTabProps) => {
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

  const getPlatformGradient = (platform: string) => {
    switch (platform) {
      case "Instagram":
        return "from-pink-500/20 to-purple-500/20 border-pink-500/30";
      case "TikTok":
        return "from-foreground/10 to-foreground/5 border-foreground/20";
      case "YouTube":
        return "from-red-500/20 to-red-600/10 border-red-500/30";
      case "Snapchat":
        return "from-yellow-400/20 to-yellow-500/10 border-yellow-500/30";
      default:
        return "from-gold/20 to-gold/10 border-gold/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gold" />
          <h3 className="font-display font-semibold text-foreground">Ma grille tarifaire</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onEditPricing} className="text-gold">
          <Edit3 className="w-4 h-4 mr-1" />
          Modifier
        </Button>
      </div>

      {hasPricing ? (
        <div className="space-y-4">
          {Object.entries(groupedPricing).map(([platform, items], platformIndex) => (
            <motion.div
              key={platform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: platformIndex * 0.1 }}
              className={`rounded-2xl border bg-gradient-to-br ${getPlatformGradient(platform)} overflow-hidden`}
            >
              <div className="px-4 py-3 border-b border-border/50">
                <h4 className="font-semibold text-foreground">{platform}</h4>
              </div>
              <div className="divide-y divide-border/30">
                {items.map((item, index) => (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: platformIndex * 0.1 + index * 0.05 }}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {item.type.replace(/instagram|tiktok|youtube|snapchat/gi, "").trim()}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold">
                        {item.price.toLocaleString()}
                        <span className="text-xs ml-1">FCFA</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Stats hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 p-4 bg-accent/10 rounded-xl"
          >
            <TrendingUp className="w-5 h-5 text-accent" />
            <p className="text-xs text-muted-foreground">
              Les créateurs avec une grille tarifaire complète reçoivent <span className="text-accent font-medium">3x plus</span> de demandes
            </p>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-10 h-10 text-gold" />
          </div>
          <h4 className="font-display font-semibold text-lg mb-2">Définissez vos tarifs</h4>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Ajoutez vos tarifs pour chaque type de contenu et laissez les marques vous trouver facilement
          </p>
          <Button onClick={onEditPricing} variant="gold" className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter mes tarifs
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PricingTab;
