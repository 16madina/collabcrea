import { useState, useEffect } from "react";
import { CountryFlag } from "@/lib/flags";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, MapPin, DollarSign, X, Loader2, Send, Flag, SlidersHorizontal, RotateCcw, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import OfferCard from "@/components/OfferCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplyToOffer } from "@/hooks/useApplyToOffer";
import { useNavigate } from "react-router-dom";
import ReportDialog from "@/components/ReportDialog";
import logoKariteDor from "@/assets/logo-karite-dor.jpg";
import logoTechAfrik from "@/assets/logo-techafrik.jpg";
import logoNestleAfrique from "@/assets/logo-nestle-afrique.jpg";
import logoNikeAfrique from "@/assets/logo-nike-afrique.jpg";
import logoLorealAfrique from "@/assets/logo-loreal-afrique.jpg";
import logoMtn from "@/assets/logo-mtn.jpg";

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
  isMock?: boolean;
}

interface Application {
  offer_id: string;
  status: string;
  has_active_collab?: boolean;
}

type FilterStatus = "all" | "new" | "applied";
type FilterCategory = "all" | "Beauté" | "Tech" | "Cuisine" | "Fitness" | "Mode" | "Lifestyle" | "Musique" | "Humour" | "Business" | "Éducation";

const statusFilters: { label: string; value: FilterStatus }[] = [
  { label: "Toutes", value: "all" },
  { label: "Nouvelles", value: "new" },
  { label: "Postulées", value: "applied" },
];

const categoryFilters: { label: string; value: FilterCategory }[] = [
  { label: "Toutes", value: "all" },
  { label: "Beauté", value: "Beauté" },
  { label: "Tech", value: "Tech" },
  { label: "Cuisine", value: "Cuisine" },
  { label: "Fitness", value: "Fitness" },
  { label: "Mode", value: "Mode" },
  { label: "Lifestyle", value: "Lifestyle" },
  { label: "Musique", value: "Musique" },
  { label: "Humour", value: "Humour" },
  { label: "Business", value: "Business" },
  { label: "Éducation", value: "Éducation" },
];

import { africanCountryFilters } from "@/data/africanCountries";

const contentTypeFilters = [
  { label: "Tous", value: "all" },
  { label: "Reel", value: "Reel" },
  { label: "TikTok", value: "TikTok" },
  { label: "Vidéo YouTube", value: "Vidéo YouTube" },
  { label: "Story", value: "Story" },
  { label: "Podcast", value: "Podcast" },
  { label: "Post", value: "Post" },
];

const mockOffers: Offer[] = [
  {
    id: "mock-1",
    brand_id: "",
    title: "Campagne beauté naturelle",
    description: "Recherche créateurs beauté pour promouvoir notre nouvelle gamme de soins au karité.",
    category: "Beauté",
    content_type: "Reel",
    budget_min: 150000,
    budget_max: 300000,
    deadline: "2026-02-28",
    location: "Côte d'Ivoire",
    logo_url: logoKariteDor,
    status: "active",
    created_at: new Date().toISOString(),
    brand_name: "Karité d'Or",
    isMock: true,
  },
  {
    id: "mock-2",
    brand_id: "",
    title: "Tech Review Smartphone",
    description: "Besoin de YouTubers tech pour unboxing et review de notre nouveau smartphone.",
    category: "Tech",
    content_type: "Vidéo YouTube",
    budget_min: 200000,
    budget_max: 500000,
    deadline: "2026-02-27",
    location: "Nigeria",
    logo_url: logoTechAfrik,
    status: "active",
    created_at: new Date().toISOString(),
    brand_name: "TechAfrik",
    isMock: true,
  },
  {
    id: "mock-3",
    brand_id: "",
    title: "Recettes créatives Nescafé",
    description: "Partagez des recettes originales avec nos produits café.",
    category: "Cuisine",
    content_type: "Reel",
    budget_min: 400000,
    budget_max: 800000,
    deadline: "2026-03-05",
    location: "Sénégal",
    logo_url: logoNestleAfrique,
    status: "active",
    created_at: new Date().toISOString(),
    brand_name: "Nestlé Afrique",
    isMock: true,
  },
  {
    id: "mock-4",
    brand_id: "",
    title: "Challenge fitness viral",
    description: "Lancez un challenge fitness avec nos nouveaux équipements.",
    category: "Fitness",
    content_type: "TikTok",
    budget_min: 800000,
    budget_max: 1500000,
    deadline: "2026-03-15",
    location: "Ghana",
    logo_url: logoNikeAfrique,
    status: "active",
    created_at: new Date().toISOString(),
    brand_name: "Nike Afrique",
    isMock: true,
  },
  {
    id: "mock-5",
    brand_id: "",
    title: "Tutoriel maquillage",
    description: "Créez des tutoriels avec notre nouvelle gamme de maquillage.",
    category: "Beauté",
    content_type: "Vidéo YouTube",
    budget_min: 350000,
    budget_max: 700000,
    deadline: "2026-03-10",
    location: "Cameroun",
    logo_url: logoLorealAfrique,
    status: "active",
    created_at: new Date().toISOString(),
    brand_name: "L'Oréal Afrique",
    isMock: true,
  },
  {
    id: "mock-6",
    brand_id: "",
    title: "Campagne Mobile Money",
    description: "Promouvoir notre service de paiement mobile auprès des jeunes.",
    category: "Tech",
    content_type: "Story",
    budget_min: 600000,
    budget_max: 1200000,
    deadline: "2026-03-20",
    location: "Côte d'Ivoire",
    logo_url: logoMtn,
    status: "active",
    created_at: new Date().toISOString(),
    brand_name: "MTN",
    isMock: true,
  },
];

const CreatorOffers = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { applyToOffer, isApplying } = useApplyToOffer();
  const isCreatorVerified = profile?.identity_verified === true;
  
  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [activeCountry, setActiveCountry] = useState("all");
  const [activeContentType, setActiveContentType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        const { data: offersData, error: offersError } = await supabase
          .from("offers")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (offersError) throw offersError;

        const brandIds = [...new Set(offersData?.map(o => o.brand_id) || [])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, company_name")
          .in("user_id", brandIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.company_name || p.full_name]) || []);
        
        const offersWithBrands = offersData?.map(o => ({
          ...o,
          brand_name: profileMap.get(o.brand_id) || "Marque",
          isMock: false,
        })) || [];

        setDbOffers(offersWithBrands);

        const { data: appsData } = await supabase
          .from("applications")
          .select("offer_id, status")
          .eq("creator_id", user.id);

        // Check which offers have active or ended collaborations
        const { data: collabsData } = await supabase
          .from("collaborations")
          .select("offer_id, status")
          .eq("creator_id", user.id);

        const allCollabOffers = new Set((collabsData || []).map(c => c.offer_id));
        const activeCollabOffers = new Set(
          (collabsData || [])
            .filter(c => !["cancelled", "refused", "refunded", "expired", "completed"].includes(c.status))
            .map(c => c.offer_id)
        );

        const appsWithCollabInfo = (appsData || []).map(a => ({
          ...a,
          // has_active_collab: true = active collab exists, false = had collabs but all ended, undefined = never had collabs
          has_active_collab: activeCollabOffers.has(a.offer_id) 
            ? true 
            : allCollabOffers.has(a.offer_id) 
              ? false 
              : undefined,
        }));

        setApplications(appsWithCollabInfo);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Merge DB offers with mock offers (DB first, then mock to fill)
  const allOffers = [...dbOffers, ...mockOffers];

  // Track which offers have had collaborations (even cancelled ones)
  const offersWithPastCollabs = new Set(
    applications.filter(a => a.has_active_collab !== undefined).map(a => a.offer_id)
  );

  const getApplicationStatus = (offerId: string) => {
    const app = applications.find(a => a.offer_id === offerId);
    if (!app) return undefined;
    // If application was rejected → allow re-apply
    if (app.status === "rejected") return undefined;
    // If there's no active collab but there WERE past collabs (all cancelled/refused) → allow re-apply
    if (app.status === "pending" && app.has_active_collab === false) {
      return undefined;
    }
    return app;
  };

  const filteredOffers = allOffers.filter((offer) => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.content_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const application = getApplicationStatus(offer.id);
    const matchesFilter = 
      activeFilter === "all" ||
      (activeFilter === "new" && !application) ||
      (activeFilter === "applied" && application);

    const matchesCategory =
      activeCategory === "all" ||
      offer.category === activeCategory;

    const matchesCountry =
      activeCountry === "all" ||
      (offer.location && offer.location.toLowerCase().includes(activeCountry.toLowerCase()));

    const matchesContentType =
      activeContentType === "all" ||
      offer.content_type.toLowerCase().includes(activeContentType.toLowerCase());
    
    return matchesSearch && matchesFilter && matchesCategory && matchesCountry && matchesContentType;
  });

  const handleApply = async () => {
    if (!selectedOffer || selectedOffer.isMock) return;
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

          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une offre..."
                className="pl-12 h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                (activeFilter !== "all" || activeCountry !== "all" || activeContentType !== "all")
                  ? "bg-gold text-primary-foreground"
                  : "glass text-muted-foreground"
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Inline Category Pills */}
      <div className="px-6 mt-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categoryFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveCategory(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === filter.value
                  ? "bg-gold text-primary-foreground"
                  : "glass text-muted-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Side Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-background border-l border-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-display font-bold text-lg">Filtres</h3>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setActiveCountry("all");
                      setActiveContentType("all");
                    }}
                    className="text-xs text-muted-foreground flex items-center gap-1 px-3 py-1.5 rounded-full glass"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Réinitialiser
                  </button>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                {/* Status */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Statut</p>
                  <div className="flex flex-wrap gap-2">
                    {statusFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setActiveFilter(filter.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          activeFilter === filter.value
                            ? "bg-gold text-primary-foreground"
                            : "glass text-muted-foreground"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Type */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Type de contenu</p>
                  <div className="flex flex-wrap gap-2">
                    {contentTypeFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setActiveContentType(filter.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          activeContentType === filter.value
                            ? "bg-gold text-primary-foreground"
                            : "glass text-muted-foreground"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country Select */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Pays</p>
                  <Select value={activeCountry} onValueChange={setActiveCountry}>
                    <SelectTrigger className="w-full h-12 rounded-xl bg-muted/50 border-border">
                      <SelectValue placeholder="Tous les pays" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px] bg-background z-[60]">
                      {africanCountryFilters.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          <span className="flex items-center gap-2">
                            {filter.value !== "all" && <CountryFlag country={filter.value} size={16} />}
                            {filter.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Apply button */}
              <div className="px-5 py-4 border-t border-border">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 rounded-xl bg-gold text-primary-foreground font-semibold"
                >
                  Appliquer les filtres
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offers List */}
      <div className="px-6 mt-6 space-y-4">
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
              
              return (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  index={index}
                  status={application ? {
                    label: getStatusLabel(application),
                    style: getStatusStyle(application),
                  } : {
                    label: "Nouveau",
                    style: "bg-green-500/20 text-green-400",
                  }}
                  onClick={() => setSelectedOffer(offer)}
                  showApplyButton={!application}
                  onApply={() => setSelectedOffer(offer)}
                  applyDisabled={!isCreatorVerified}
                  applyDisabledTooltip="Vérifiez votre identité pour postuler aux offres"
                />
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
              className="absolute bottom-0 left-0 right-0 glass-card rounded-t-3xl safe-bottom max-h-[85vh] flex flex-col"
            >
              <div className="sticky top-0 z-10 pt-4 pb-2 px-6 bg-inherit rounded-t-3xl">
                <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              </div>
              <div className="overflow-y-auto flex-1 px-6 pb-6">
              
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

              <h3 className="font-display font-bold text-gold-gradient text-lg mb-2">{selectedOffer.title}</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gold" />
                  <span className="text-lg font-semibold text-gold">
                    {selectedOffer.budget_min === selectedOffer.budget_max
                      ? `${selectedOffer.budget_min.toLocaleString("fr-FR")} FCFA`
                      : `${selectedOffer.budget_min.toLocaleString("fr-FR")} - ${selectedOffer.budget_max.toLocaleString("fr-FR")} FCFA`}
                  </span>
                </div>
                {selectedOffer.deadline && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Deadline: {(() => {
                        const date = new Date(selectedOffer.deadline);
                        const now = new Date();
                        const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (diff <= 0) return "Expiré";
                        if (diff === 1) return "1 jour";
                        return `${diff} jours`;
                      })()}
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

              {selectedOffer.isMock ? (
                <Button 
                  variant="gold" 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate("/auth?role=creator")}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Postuler
                </Button>
              ) : !getApplicationStatus(selectedOffer.id) ? (
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

                  {!isCreatorVerified ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button 
                              variant="gold" 
                              size="lg" 
                              className="w-full opacity-50 cursor-not-allowed"
                              disabled
                            >
                              <ShieldAlert className="w-5 h-5 mr-2" />
                              Postuler
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] text-center">
                          <p>Vérifiez votre identité pour postuler aux offres</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
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
                  )}
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
                    onClick={() => navigate("/creator/collabs?tab=messages")}
                  >
                    Voir la conversation
                  </Button>
                </div>
              )}

              {/* Report button - only for real offers */}
              {!selectedOffer.isMock && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-4 text-muted-foreground hover:text-destructive"
                  onClick={() => setShowReportDialog(true)}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Signaler cette offre
                </Button>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Dialog */}
      {selectedOffer && !selectedOffer.isMock && (
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          reportType="offer"
          targetOfferId={selectedOffer.id}
          targetUserId={selectedOffer.brand_id}
          targetName={`${selectedOffer.brand_name} - ${selectedOffer.title}`}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default CreatorOffers;
