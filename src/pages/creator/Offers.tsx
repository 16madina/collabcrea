import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Clock, MapPin, DollarSign, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

type OfferStatus = "all" | "new" | "pending" | "accepted";

const offers = [
  {
    id: 1,
    brand: "Afrik'Beauty",
    logo: "A",
    type: "Reel Instagram",
    budget: "150,000 FCFA",
    deadline: "5 jours",
    location: "Sénégal",
    description: "Création d'un Reel pour notre nouvelle gamme de soins capillaires naturels.",
    status: "new",
  },
  {
    id: 2,
    brand: "TechAfrica",
    logo: "T",
    type: "Vidéo YouTube",
    budget: "300,000 FCFA",
    deadline: "12 jours",
    location: "Côte d'Ivoire",
    description: "Review complète de notre nouveau smartphone africain.",
    status: "pending",
  },
  {
    id: 3,
    brand: "Mode Dakar",
    logo: "M",
    type: "Story Instagram",
    budget: "50,000 FCFA",
    deadline: "3 jours",
    location: "Sénégal",
    description: "3 stories pour présenter notre collection été.",
    status: "accepted",
  },
  {
    id: 4,
    brand: "Cuisine Mama",
    logo: "C",
    type: "TikTok",
    budget: "80,000 FCFA",
    deadline: "7 jours",
    location: "Cameroun",
    description: "Vidéo recette utilisant nos épices traditionnelles.",
    status: "new",
  },
  {
    id: 5,
    brand: "FitAfrica",
    logo: "F",
    type: "Live Instagram",
    budget: "200,000 FCFA",
    deadline: "10 jours",
    location: "Nigeria",
    description: "Session live fitness d'une heure avec notre équipement.",
    status: "pending",
  },
];

const statusFilters: { label: string; value: OfferStatus }[] = [
  { label: "Toutes", value: "all" },
  { label: "Nouvelles", value: "new" },
  { label: "En attente", value: "pending" },
  { label: "Acceptées", value: "accepted" },
];

const CreatorOffers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<OfferStatus>("all");
  const [selectedOffer, setSelectedOffer] = useState<typeof offers[0] | null>(null);

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch = offer.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || offer.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "new":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "accepted":
        return "bg-gold/20 text-gold";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Nouveau";
      case "pending":
        return "En attente";
      case "accepted":
        return "Accepté";
      default:
        return status;
    }
  };

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
          {filteredOffers.map((offer, index) => (
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
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold text-lg">{offer.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{offer.brand}</h3>
                      <p className="text-sm text-muted-foreground">{offer.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(offer.status)}`}>
                      {getStatusLabel(offer.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gold font-semibold">{offer.budget}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {offer.deadline}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOffers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Aucune offre trouvée</p>
          </motion.div>
        )}
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
              className="absolute bottom-0 left-0 right-0 glass-card rounded-t-3xl p-6 safe-bottom"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center">
                    <span className="text-gold font-bold text-2xl">{selectedOffer.logo}</span>
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">{selectedOffer.brand}</h2>
                    <p className="text-muted-foreground">{selectedOffer.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="touch-target"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gold" />
                  <span className="text-lg font-semibold text-gold">{selectedOffer.budget}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Deadline: {selectedOffer.deadline}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{selectedOffer.location}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{selectedOffer.description}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="glass" size="lg" className="flex-1">
                  Décliner
                </Button>
                <Button variant="gold" size="lg" className="flex-1">
                  Accepter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav userRole="creator" />
    </div>
  );
};

export default CreatorOffers;
