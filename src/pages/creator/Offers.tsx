import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, MapPin, DollarSign, ChevronRight, X, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplyToOffer } from "@/hooks/useApplyToOffer";
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
  brand_name?: string;
}

interface Application {
  offer_id: string;
  status: string;
}

type FilterStatus = "all" | "new" | "applied";

const statusFilters: { label: string; value: FilterStatus }[] = [
  { label: "Toutes", value: "all" },
  { label: "Nouvelles", value: "new" },
  { label: "Postulées", value: "applied" },
];

const CreatorOffers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { applyToOffer, isApplying } = useApplyToOffer();
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        // Fetch active offers with brand profiles
        const { data: offersData, error: offersError } = await supabase
          .from("offers")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (offersError) throw offersError;

        // Get brand names from profiles
        const brandIds = [...new Set(offersData?.map(o => o.brand_id) || [])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", brandIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const offersWithBrands = offersData?.map(o => ({
          ...o,
          brand_name: profileMap.get(o.brand_id) || "Marque",
        })) || [];

        setOffers(offersWithBrands);

        // Fetch user's applications
        const { data: appsData } = await supabase
          .from("applications")
          .select("offer_id, status")
          .eq("creator_id", user.id);

        setApplications(appsData || []);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getApplicationStatus = (offerId: string) => {
    return applications.find(a => a.offer_id === offerId);
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.content_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const application = getApplicationStatus(offer.id);
    const matchesFilter = 
      activeFilter === "all" ||
      (activeFilter === "new" && !application) ||
      (activeFilter === "applied" && application);
    
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

  const handleApply = async () => {
    if (!selectedOffer) return;
    await applyToOffer(selectedOffer.id, selectedOffer.brand_id, applicationMessage);
    setSelectedOffer(null);
    setApplicationMessage("");
  };

  const getStatusStyle = (application: Application | undefined) => {
    if (!application) return "bg-green-500/20 text-green-400";
    switch (application.status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "accepted":
        return "bg-gold/20 text-gold";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (application: Application | undefined) => {
    if (!application) return "Nouveau";
    switch (application.status) {
      case "pending":
        return "En attente";
      case "accepted":
        return "Accepté";
      case "rejected":
        return "Refusé";
      default:
        return application.status;
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
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-4">
            Offres
          </h1>

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
              <p className="text-muted-foreground">Aucune offre trouvée</p>
            </motion.div>
          ) : (
            filteredOffers.map((offer, index) => {
              const application = getApplicationStatus(offer.id);
              const deadline = formatDeadline(offer.deadline);
              
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedOffer(offer)}
                  className="glass-card p-4 cursor-pointer hover:border-gold/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {offer.logo_url ? (
                        <img src={offer.logo_url} alt={offer.brand_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gold font-bold text-lg">
                          {offer.brand_name?.charAt(0) || "M"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{offer.brand_name}</h3>
                          <p className="text-sm text-muted-foreground">{offer.content_type}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(application)}`}>
                          {getStatusLabel(application)}
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
                      <img src={selectedOffer.logo_url} alt={selectedOffer.brand_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gold font-bold text-2xl">
                        {selectedOffer.brand_name?.charAt(0) || "M"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">{selectedOffer.brand_name}</h2>
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

              <h3 className="font-semibold text-lg mb-2">{selectedOffer.title}</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gold" />
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
                {selectedOffer.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedOffer.location}</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedOffer.description}</p>
              </div>

              {!getApplicationStatus(selectedOffer.id) ? (
                <>
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Votre message (optionnel)</h4>
                    <Textarea
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      placeholder="Présentez-vous et expliquez pourquoi vous êtes le créateur idéal pour cette offre..."
                      className="bg-muted/50 border-border focus:border-gold min-h-[100px]"
                    />
                  </div>

                  <Button 
                    variant="gold" 
                    size="lg" 
                    className="w-full"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    Postuler
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <span className={`inline-flex px-4 py-2 rounded-full ${getStatusStyle(getApplicationStatus(selectedOffer.id))}`}>
                    Candidature: {getStatusLabel(getApplicationStatus(selectedOffer.id))}
                  </span>
                  <Button 
                    variant="glass" 
                    size="lg" 
                    className="w-full mt-4"
                    onClick={() => navigate("/messages")}
                  >
                    Voir la conversation
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav userRole="creator" />
    </div>
  );
};

export default CreatorOffers;
