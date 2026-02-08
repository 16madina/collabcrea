import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

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
}: PricingTabProps) => {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
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

  const formatPrice = (price: number) => {
    return price.toLocaleString("fr-FR") + "f";
  };

  // Get service name without platform prefix
  const getServiceName = (type: string) => {
    return type.replace(/instagram|tiktok|youtube|snapchat|snap/gi, "").trim() || type;
  };

  // Platform order for display
  const platformOrder = ["Snap", "TikTok", "Instagram", "YouTube", "Autres"];

  // Export rate card as image
  const exportAsImage = async () => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      
      const link = document.createElement("a");
      link.download = `rate-card-${fullName || "creator"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast({
        title: "Image téléchargée",
        description: "Votre rate card a été enregistrée",
      });
    } catch (error) {
      console.error("Error exporting image:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'image",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Share rate card
  const shareRateCard = async () => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Failed to create blob");
        }
        
        const file = new File([blob], `rate-card-${fullName || "creator"}.png`, { type: "image/png" });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Rate Card - ${fullName || "Créateur"}`,
            text: "Découvrez mes tarifs de création de contenu !",
            files: [file],
          });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `rate-card-${fullName || "creator"}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: "Image téléchargée",
            description: "Partagez-la sur vos réseaux sociaux !",
          });
        }
      }, "image/png");
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Erreur",
        description: "Impossible de partager",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      {/* Share/Download Buttons */}
      {hasPricing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsImage}
            disabled={isExporting}
            className="flex-1 gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Télécharger
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={shareRateCard}
            disabled={isExporting}
            className="flex-1 gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            Partager
          </Button>
        </motion.div>
      )}

      {/* Flyer Style Rate Card */}
      <motion.div
        ref={cardRef}
        onClick={onEditPricing}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden rounded-2xl cursor-pointer group shadow-2xl"
        style={{ minHeight: "500px" }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Background" 
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-deep via-background to-violet" />
          )}
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
        </div>

        {/* Edit overlay on hover */}
        <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gold/50 shadow-lg">
            <span className="text-gold font-medium text-sm">✏️ Modifier ma grille</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col min-h-[500px]">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-bold text-white drop-shadow-lg tracking-wide">
              {fullName || "MA GRILLE"}
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
                    <div className="space-y-1 px-4">
                      {items.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center py-1"
                        >
                          <span className="text-white font-medium text-base drop-shadow-md">
                            {getServiceName(item.type)}
                          </span>
                          <span className="text-white font-bold text-base drop-shadow-md">
                            {formatPrice(item.price)}
                          </span>
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
                Créez votre grille tarifaire
              </p>
              <p className="text-white/70 text-sm max-w-[200px]">
                Ajoutez vos services et tarifs pour les marques
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-4">
            <div className="text-center">
              <p className="text-white/60 text-xs italic">
                *Tarifs négociables selon le projet
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
        className="text-center text-xs text-muted-foreground mt-4"
      >
        💡 Touchez la carte pour modifier vos tarifs
      </motion.p>
    </motion.div>
  );
};

export default PricingTab;
