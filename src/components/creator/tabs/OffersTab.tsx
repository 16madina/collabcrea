import { motion } from "framer-motion";
import { Briefcase, ChevronRight, Clock, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Application {
  id: string;
  status: string;
  offerTitle: string;
  brandName: string;
  appliedAt: string;
  budget: string;
}

interface OffersTabProps {
  applications: Application[];
  isLoading?: boolean;
}

const OffersTab = ({ applications, isLoading = false }: OffersTabProps) => {
  const navigate = useNavigate();
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "accepted":
        return { 
          icon: CheckCircle2, 
          color: "text-accent", 
          bgColor: "bg-accent/10",
          label: "Acceptée" 
        };
      case "rejected":
        return { 
          icon: XCircle, 
          color: "text-destructive", 
          bgColor: "bg-destructive/10",
          label: "Refusée" 
        };
      case "pending":
      default:
        return { 
          icon: Hourglass, 
          color: "text-gold", 
          bgColor: "bg-gold/10",
          label: "En attente" 
        };
    }
  };

  const hasApplications = applications.length > 0;

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
      className="p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-gold" />
          <h3 className="font-display font-semibold text-foreground">Mes candidatures</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/creator/offers")}
          className="text-gold"
        >
          Voir tout
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {hasApplications ? (
        <div className="space-y-3">
          {applications.slice(0, 5).map((app, index) => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-muted/30 rounded-xl p-4 border-l-4 border-gold"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{app.offerTitle}</h4>
                    <p className="text-sm text-muted-foreground">{app.brandName}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {app.appliedAt}
                      </div>
                      <span className="text-xs font-medium text-gold">{app.budget}</span>
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

          {applications.length > 5 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/creator/offers")}
            >
              Voir les {applications.length - 5} autres candidatures
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-gold" />
          </div>
          <h4 className="font-display font-semibold text-lg mb-2">Aucune candidature</h4>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Explorez les offres disponibles et postulez pour commencer à collaborer avec des marques
          </p>
          <Button onClick={() => navigate("/creator/offers")} variant="gold">
            Découvrir les offres
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OffersTab;
