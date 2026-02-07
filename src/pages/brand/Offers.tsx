import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, Users, Plus, ChevronRight, X, Loader2, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Offer {
  id: string;
  brand_id: string;
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
  created_at: string;
  applications_count?: number;
}

type FilterStatus = "all" | "active" | "closed" | "draft";

const statusFilters: { label: string; value: FilterStatus }[] = [
  { label: "Toutes", value: "all" },
  { label: "Actives", value: "active" },
  { label: "Fermées", value: "closed" },
  { label: "Brouillons", value: "draft" },
];

const BrandOffers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    
    const fetchOffers = async () => {
      try {
        // Fetch all offers (brand's own + active from others)
        const { data: offersData, error } = await supabase
          .from("offers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Get application counts for each offer
        const offersWithCounts = await Promise.all(
          (offersData || []).map(async (offer) => {
            const { count } = await supabase
              .from("applications")
              .select("*", { count: "exact", head: true })
              .eq("offer_id", offer.id);

            return {
              ...offer,
              applications_count: count || 0,
            };
          })
        );

        setOffers(offersWithCounts);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user]);

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.content_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      activeFilter === "all" || offer.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const formatBudget = (min: number, max: number) => {
    if (min === max) {
      return `${min.toLocaleString("fr-FR")} FCFA`;
    }
    return `${min.toLocaleString("fr-FR")} - ${max.toLocaleString("fr-FR")} FCFA`;
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Expiré";
    if (diff === 1) return "1 jour";
    return `${diff} jours`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "closed":
        return "bg-red-500/20 text-red-400";
      case "draft":
        return "bg-yellow-500/20 text-yellow-400";
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold text-gold-gradient">
              Offres
            </h1>
            <Button 
              variant="gold" 
              size="sm"
              onClick={() => navigate("/brand/create-offer")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une offre..."
              className="pl-12 h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
            />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="px-6 mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2"
        >
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.value
                  ? "bg-gold text-primary-foreground"
                  : "glass text-muted-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Offers List */}
      <div className="px-6 mt-6 space-y-3">
        <AnimatePresence>
          {filteredOffers.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground mb-4">Aucune offre trouvée</p>
              <Button 
                variant="gold"
                onClick={() => navigate("/brand/create-offer")}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Créer votre première offre
              </Button>
            </motion.div>
          ) : (
            filteredOffers.map((offer, index) => {
              const deadline = formatDeadline(offer.deadline);
              const isOwner = offer.brand_id === user?.id;
              
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedOffer(offer)}
                  className="glass-card p-4 cursor-pointer hover:border-gold/30 transition-all border-l-4 border-l-gold"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {offer.logo_url ? (
                        <img src={offer.logo_url} alt={offer.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gold font-bold text-lg">
                          {offer.title.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{offer.title}</h3>
                          <p className="text-sm text-muted-foreground">{offer.content_type}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(offer.status)}`}>
                          {getStatusLabel(offer.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gold font-semibold">
                          {formatBudget(offer.budget_min, offer.budget_max)}
                        </span>
                        {deadline && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {deadline}
                          </span>
                        )}
                        {isOwner && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {offer.applications_count} candidatures
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Offer Detail Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedOffer(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 glass-card rounded-t-3xl p-6 safe-bottom max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center overflow-hidden">
                    {selectedOffer.logo_url ? (
                      <img src={selectedOffer.logo_url} alt={selectedOffer.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gold font-bold text-2xl">
                        {selectedOffer.title.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">{selectedOffer.title}</h2>
                    <p className="text-muted-foreground">{selectedOffer.content_type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="touch-target"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs px-3 py-1 rounded-full ${getStatusStyle(selectedOffer.status)}`}>
                  {getStatusLabel(selectedOffer.status)}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  {selectedOffer.category}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gold">
                    {formatBudget(selectedOffer.budget_min, selectedOffer.budget_max)}
                  </span>
                </div>
                {selectedOffer.deadline && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Deadline: {formatDeadline(selectedOffer.deadline)}
                    </span>
                  </div>
                )}
                {selectedOffer.brand_id === user?.id && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {selectedOffer.applications_count} candidatures
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedOffer.description}</p>
              </div>

              {selectedOffer.brand_id === user?.id && (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav userRole="brand" />
    </div>
  );
};

export default BrandOffers;
