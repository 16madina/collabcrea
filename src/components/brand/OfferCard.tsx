import { motion } from "framer-motion";
import { MapPin, DollarSign, Calendar, Send, Users, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfferCardProps {
  offer: {
    id: string;
    brand_name?: string;
    title: string;
    description: string;
    category: string;
    content_type: string;
    budget_min: number;
    budget_max: number;
    deadline: string | null;
    location: string | null;
    logo_url: string | null;
    status: string;
    applications_count?: number;
  };
  index: number;
  isOwner?: boolean;
  onApply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

const OfferCard = ({ 
  offer, 
  index, 
  isOwner = false, 
  onApply, 
  onEdit, 
  onDelete,
  onClick 
}: OfferCardProps) => {
  const formatBudget = (min: number, max: number) => {
    const format = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${Math.round(n / 1000)}K`;
      return n.toString();
    };
    if (min === max) {
      return `${format(min)} FCFA`;
    }
    return `${format(min)} - ${format(max)} FCFA`;
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `Avant le ${date.toLocaleDateString("fr-FR", options)}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent/20 text-accent";
      case "closed":
        return "bg-destructive/20 text-destructive";
      case "draft":
        return "bg-gold/20 text-gold";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "closed":
        return "Fermée";
      case "draft":
        return "Brouillon";
      default:
        return status;
    }
  };

  const deadline = formatDeadline(offer.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)',
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold/60 to-gold/20" />
      
      <div className="p-4 pl-5">
        {/* Header with logo and brand */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg overflow-hidden shadow-lg flex-shrink-0 bg-gold/20 flex items-center justify-center">
              {offer.logo_url ? (
                <img src={offer.logo_url} alt={offer.brand_name || offer.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gold font-bold text-lg">
                  {(offer.brand_name || offer.title).charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gold">
                {offer.brand_name || "Marque"}
              </h4>
              {offer.location && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {offer.location}
                </div>
              )}
            </div>
          </div>
          {isOwner && (
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(offer.status)}`}>
              {getStatusLabel(offer.status)}
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gold/10 border border-gold/30 text-gold">
            <span>👤</span>
            {offer.category}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted/30 border border-border text-muted-foreground">
            {offer.content_type}
          </span>
        </div>

        {/* Budget & Deadline */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gold" />
            <span className="font-semibold text-gold text-sm">{formatBudget(offer.budget_min, offer.budget_max)}</span>
          </div>
          <div className="flex items-center justify-between">
            {deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{deadline}</span>
              </div>
            )}
            {isOwner && offer.applications_count !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                {offer.applications_count} candidatures
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {isOwner ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Edit className="w-4 h-4" />
              Modifier
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline"
            className="w-full py-3 border-2 border-gold/60 text-foreground font-medium flex items-center justify-center gap-2 hover:bg-gold/10 hover:border-gold transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onApply?.();
            }}
          >
            <Send className="w-4 h-4" />
            Postuler
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default OfferCard;
