import { motion } from "framer-motion";
import { MapPin, DollarSign, Calendar, Send, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OfferCardProps {
  offer: {
    id: string | number;
    brand_name?: string;
    brand?: string;
    logo_url?: string | null;
    logo?: string;
    location?: string | null;
    title: string;
    description: string;
    category?: string;
    content_type?: string;
    contentType?: string;
    budget_min?: number;
    budget_max?: number;
    budget?: string;
    deadline?: string | null;
  };
  index?: number;
  status?: {
    label: string;
    style: string;
  };
  onClick?: () => void;
  showApplyButton?: boolean;
  onApply?: () => void;
  applyDisabled?: boolean;
  applyDisabledTooltip?: string;
}

const OfferCard = ({
  offer,
  index = 0,
  status,
  onClick,
  showApplyButton = false,
  onApply,
  applyDisabled = false,
  applyDisabledTooltip,
}: OfferCardProps) => {
  const brandName = offer.brand_name || offer.brand || "Marque";
  const logoUrl = offer.logo_url || offer.logo;
  const contentType = offer.content_type || offer.contentType || "";
  
  const formatBudget = () => {
    if (offer.budget) return offer.budget;
    if (offer.budget_min !== undefined && offer.budget_max !== undefined) {
      if (offer.budget_min === offer.budget_max) {
        return `${offer.budget_min.toLocaleString("fr-FR")} FCFA`;
      }
      return `${offer.budget_min.toLocaleString("fr-FR")} - ${offer.budget_max.toLocaleString("fr-FR")} FCFA`;
    }
    return "Budget à définir";
  };

  const formatDeadline = () => {
    if (!offer.deadline) return null;
    
    // Check if it's already formatted
    if (offer.deadline.includes("Avant")) return offer.deadline;
    
    const date = new Date(offer.deadline);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff <= 0) return "Expiré";
    if (diff === 1) return "1 jour restant";
    return `${diff} jours restants`;
  };

  const deadline = formatDeadline();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)',
      }}
    >
      {/* Gold left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold/60 to-gold/20" />
      
      <div className="p-4 pl-5">
        {/* Header with logo and brand */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg overflow-hidden shadow-lg flex-shrink-0 bg-gold/20 flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gold font-bold text-lg">
                  {brandName.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gold">
                {brandName}
              </h4>
              {offer.location && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {offer.location}
                </div>
              )}
            </div>
          </div>
          
          {/* Status badge */}
          {status && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.style}`}>
              {status.label}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-gold-gradient text-base mb-2">
          {offer.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">
          {offer.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {offer.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gold/10 border border-gold/30 text-gold">
              <span>👤</span>
              {offer.category}
            </span>
          )}
          {contentType && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted/30 border border-border text-muted-foreground">
              {contentType}
            </span>
          )}
        </div>

        {/* Budget and deadline */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gold" />
            <span className="font-semibold text-gold text-sm">{formatBudget()}</span>
          </div>
          {deadline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{deadline}</span>
            </div>
          )}
        </div>

        {/* Apply button */}
        {showApplyButton && (
          applyDisabled && applyDisabledTooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-border text-muted-foreground opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Postuler
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] text-center">
                  <p>{applyDisabledTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              variant="outline"
              className="w-full border-2 border-gold/60 text-foreground hover:bg-gold/10 hover:border-gold"
              onClick={(e) => {
                e.stopPropagation();
                onApply?.();
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Postuler
            </Button>
          )
        )}
      </div>
    </motion.div>
  );
};

export default OfferCard;
