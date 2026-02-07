import { motion } from "framer-motion";
import { 
  Megaphone, 
  Plus, 
  ChevronRight, 
  Clock, 
  Users,
  CheckCircle2,
  XCircle,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Offer {
  id: string;
  title: string;
  status: "active" | "closed" | "draft";
  category: string;
  budget_min: number;
  budget_max: number;
  applicationsCount: number;
  createdAt: string;
  deadline: string | null;
}

interface BrandOffersTabProps {
  offers: Offer[];
  isLoading?: boolean;
}

const BrandOffersTab = ({ offers, isLoading = false }: BrandOffersTabProps) => {
  const navigate = useNavigate();
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { 
          icon: CheckCircle2, 
          color: "text-accent", 
          bgColor: "bg-accent/10",
          label: "Active" 
        };
      case "closed":
        return { 
          icon: XCircle, 
          color: "text-muted-foreground", 
          bgColor: "bg-muted",
          label: "Terminée" 
        };
      case "draft":
      default:
        return { 
          icon: Edit3, 
          color: "text-gold", 
          bgColor: "bg-gold/10",
          label: "Brouillon" 
        };
    }
  };

  const formatBudget = (min: number, max: number) => {
    const format = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
      return n.toString();
    };
    return `${format(min)} - ${format(max)} FCFA`;
  };

  const hasOffers = offers.length > 0;
  const activeOffers = offers.filter(o => o.status === "active");
  const pastOffers = offers.filter(o => o.status !== "active");

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-gold" />
          <h3 className="font-display font-semibold text-foreground">Mes offres</h3>
        </div>
        <Button 
          variant="gold" 
          size="sm"
          onClick={() => navigate("/brand/create-offer")}
        >
          <Plus className="w-4 h-4 mr-1" />
          Créer
        </Button>
      </div>

      {hasOffers ? (
        <>
          {/* Active Offers */}
          {activeOffers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Offres actives ({activeOffers.length})
              </h4>
              {activeOffers.map((offer, index) => {
                const statusConfig = getStatusConfig(offer.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-muted/30 rounded-xl p-4 border-l-4 border-accent"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{offer.title}</h4>
                        <p className="text-sm text-muted-foreground">{offer.category}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {offer.applicationsCount} candidatures
                          </div>
                          <span className="text-xs font-medium text-gold">
                            {formatBudget(offer.budget_min, offer.budget_max)}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bgColor}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
                        <span className={`text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Past Offers */}
          {pastOffers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Historique ({pastOffers.length})
              </h4>
              {pastOffers.slice(0, 3).map((offer, index) => {
                const statusConfig = getStatusConfig(offer.status);
                
                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-muted/20 rounded-xl p-4 opacity-70"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{offer.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {offer.applicationsCount} candidatures • {formatBudget(offer.budget_min, offer.budget_max)}
                        </p>
                      </div>
                      <span className={`text-xs ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              
              {pastOffers.length > 3 && (
                <Button variant="ghost" className="w-full text-muted-foreground">
                  Voir les {pastOffers.length - 3} autres offres
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-10 h-10 text-gold" />
          </div>
          <h4 className="font-display font-semibold text-lg mb-2">Aucune offre publiée</h4>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Créez votre première offre pour commencer à collaborer avec des créateurs talentueux
          </p>
          <Button onClick={() => navigate("/brand/create-offer")} variant="gold" className="gap-2">
            <Plus className="w-4 h-4" />
            Créer une offre
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BrandOffersTab;
