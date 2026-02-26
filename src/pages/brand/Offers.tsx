import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import OfferCard from "@/components/brand/OfferCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { mockOffers } from "@/data/offers";
import { toast } from "sonner";

interface Offer {
  id: string;
  brand_id: string;
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
  created_at: string;
  applications_count?: number;
}

type FilterStatus = "all" | "active" | "closed" | "draft" | "expired";

const statusFilters: { label: string; value: FilterStatus }[] = [
  { label: "Toutes", value: "all" },
  { label: "Actives", value: "active" },
  { label: "Expirées", value: "expired" },
  { label: "Fermées", value: "closed" },
  { label: "Brouillons", value: "draft" },
];

const BrandOffers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
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
        const { data: offersData, error } = await supabase
          .from("offers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const brandIds = [...new Set(offersData?.map(o => o.brand_id) || [])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, company_name, full_name")
          .in("user_id", brandIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.company_name || p.full_name]) || []);

        const offersWithCounts = await Promise.all(
          (offersData || []).map(async (offer) => {
            const { count } = await supabase
              .from("applications")
              .select("*", { count: "exact", head: true })
              .eq("offer_id", offer.id);

            return {
              ...offer,
              brand_name: profileMap.get(offer.brand_id) || "Marque",
              applications_count: count || 0,
            };
          })
        );

        setDbOffers(offersWithCounts);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();

    // Realtime: re-fetch when applications or offers change
    const channel = supabase
      .channel(`brand-offers:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => fetchOffers()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers" },
        () => fetchOffers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const convertedMockOffers: Offer[] = mockOffers.map(m => ({
    id: m.id,
    brand_id: m.brand_id,
    brand_name: m.brand,
    title: m.title,
    description: m.description,
    category: m.category,
    content_type: m.content_type,
    budget_min: m.budget_min,
    budget_max: m.budget_max,
    deadline: m.deadline,
    location: m.location,
    logo_url: m.logo_url,
    status: m.status,
    created_at: m.created_at,
    applications_count: 0,
  }));

  const offers = dbOffers.length > 0 ? dbOffers : convertedMockOffers;

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.content_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      activeFilter === "all" || offer.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleApply = (offerId: string) => {
    navigate(`/auth?role=creator&offer=${offerId}`);
  };

  const handleRenew = async (offerId: string) => {
    if (!user) return;
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 30);
    
    const { error } = await supabase
      .from("offers")
      .update({ 
        status: "active", 
        deadline: newDeadline.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq("id", offerId)
      .eq("brand_id", user.id);

    if (error) {
      toast.error("Erreur lors du renouvellement");
    } else {
      toast.success("Offre renouvelée pour 30 jours");
      setDbOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: "active", deadline: newDeadline.toISOString().split('T')[0] } : o));
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", offerId)
      .eq("brand_id", user.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Offre supprimée");
      setDbOffers(prev => prev.filter(o => o.id !== offerId));
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

      {/* Offers Grid */}
      <div className="px-6 mt-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredOffers.map((offer, index) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  index={index}
                  isOwner={offer.brand_id === user?.id}
                  onApply={() => handleApply(offer.id)}
                  onEdit={() => navigate(`/brand/edit-offer/${offer.id}`)}
                  onDelete={() => handleDelete(offer.id)}
                  onRenew={() => handleRenew(offer.id)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
};

export default BrandOffers;
