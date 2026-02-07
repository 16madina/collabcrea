import { motion } from "framer-motion";
import { Users, MessageSquare, CheckCircle2, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Collaboration {
  id: string;
  creatorName: string;
  creatorAvatar: string | null;
  offerTitle: string;
  status: "in_progress" | "completed" | "pending";
  startDate: string;
  budget: number;
}

interface BrandCollaborationsTabProps {
  collaborations: Collaboration[];
  isLoading?: boolean;
}

const BrandCollaborationsTab = ({ collaborations, isLoading = false }: BrandCollaborationsTabProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { 
          icon: CheckCircle2, 
          color: "text-accent", 
          bgColor: "bg-accent/10",
          label: "Terminée" 
        };
      case "in_progress":
        return { 
          icon: Clock, 
          color: "text-gold", 
          bgColor: "bg-gold/10",
          label: "En cours" 
        };
      case "pending":
      default:
        return { 
          icon: MessageSquare, 
          color: "text-muted-foreground", 
          bgColor: "bg-muted",
          label: "En attente" 
        };
    }
  };

  const hasCollaborations = collaborations.length > 0;
  const activeCollabs = collaborations.filter(c => c.status === "in_progress");
  const completedCollabs = collaborations.filter(c => c.status === "completed");

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
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
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-gold" />
        <h3 className="font-display font-semibold text-foreground">Collaborations</h3>
      </div>

      {hasCollaborations ? (
        <>
          {/* Active Collaborations */}
          {activeCollabs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                En cours ({activeCollabs.length})
              </h4>
              {activeCollabs.map((collab, index) => {
                const statusConfig = getStatusConfig(collab.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <motion.div
                    key={collab.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-muted/30 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                        {collab.creatorAvatar ? (
                          <img 
                            src={collab.creatorAvatar} 
                            alt={collab.creatorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gold font-bold text-lg">
                            {collab.creatorName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{collab.creatorName}</h4>
                        <p className="text-sm text-muted-foreground">{collab.offerTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gold font-medium">
                            {collab.budget.toLocaleString()} FCFA
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

          {/* Completed Collaborations */}
          {completedCollabs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Terminées ({completedCollabs.length})
              </h4>
              {completedCollabs.slice(0, 5).map((collab, index) => (
                <motion.div
                  key={collab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-muted/20 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                      {collab.creatorAvatar ? (
                        <img 
                          src={collab.creatorAvatar} 
                          alt={collab.creatorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-accent font-bold">
                          {collab.creatorName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground text-sm">{collab.creatorName}</h4>
                      <p className="text-xs text-muted-foreground">{collab.offerTitle}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                </motion.div>
              ))}
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
            <Users className="w-10 h-10 text-gold" />
          </div>
          <h4 className="font-display font-semibold text-lg mb-2">Aucune collaboration</h4>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Publiez des offres et acceptez des candidatures pour commencer à collaborer
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BrandCollaborationsTab;
