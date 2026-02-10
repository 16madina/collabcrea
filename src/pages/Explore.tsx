import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, BadgeCheck, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";
import CreatorCard from "@/components/CreatorCard";
import CreatorDetailSheet from "@/components/CreatorDetailSheet";
import type { Creator } from "@/components/CreatorDetailSheet";
import { useCreators } from "@/hooks/useCreators";

const categories = [
  "Tous",
  "Tech",
  "Mode",
  "Beauté",
  "Fitness",
  "Cuisine",
  "Humour",
  "Lifestyle",
  "Musique",
  "Business",
  "Éducation",
];

const countryFilters = [
  { label: "Tous", value: "all" },
  { label: "🇨🇮 Côte d'Ivoire", value: "Côte d'Ivoire" },
  { label: "🇳🇬 Nigeria", value: "Nigeria" },
  { label: "🇸🇳 Sénégal", value: "Sénégal" },
  { label: "🇬🇭 Ghana", value: "Ghana" },
  { label: "🇨🇲 Cameroun", value: "Cameroun" },
  { label: "🇲🇱 Mali", value: "Mali" },
  { label: "🇬🇳 Guinée", value: "Guinée" },
  { label: "🇧🇯 Bénin", value: "Bénin" },
  { label: "🇹🇬 Togo", value: "Togo" },
  { label: "🇧🇫 Burkina Faso", value: "Burkina Faso" },
  { label: "🇬🇦 Gabon", value: "Gabon" },
  { label: "🇨🇩 RDC", value: "RDC" },
];

const genderFilters = [
  { label: "Tous", value: "all" },
  { label: "Homme", value: "Homme" },
  { label: "Femme", value: "Femme" },
];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [activeCountry, setActiveCountry] = useState("all");
  const [activeGender, setActiveGender] = useState("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<(Creator & { userId: string }) | null>(null);
  const [showCreatorDetail, setShowCreatorDetail] = useState(false);
  
  const { allCreators, loading } = useCreators();

  const filteredCreators = allCreators.filter((creator) => {
    const matchesSearch =
      creator.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "Tous" || creator.category === activeCategory;
    const matchesVerified = !onlyVerified || creator.isVerified === true;
    const matchesCountry =
      activeCountry === "all" || creator.country === activeCountry;
    return matchesSearch && matchesCategory && matchesVerified && matchesCountry;
  });

  const handleCreatorClick = (creator: Creator & { userId: string }) => {
    setSelectedCreator(creator);
    setShowCreatorDetail(true);
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
            Explorer
          </h1>

          {/* Search */}
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un créateur..."
                className="pl-12 h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                (activeCountry !== "all" || activeGender !== "all" || onlyVerified)
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
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === category
                  ? "bg-gold text-primary-foreground"
                  : "glass text-muted-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pt-3 pb-1 space-y-3">
              {/* Gender */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Genre</p>
                <div className="flex flex-wrap gap-2">
                  {genderFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setActiveGender(filter.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        activeGender === filter.value
                          ? "bg-gold text-primary-foreground"
                          : "glass text-muted-foreground"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Pays</p>
                <div className="flex flex-wrap gap-2">
                  {countryFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setActiveCountry(filter.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        activeCountry === filter.value
                          ? "bg-gold/20 text-gold border border-gold/40"
                          : "glass text-muted-foreground border border-transparent"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified */}
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="verified-filter"
                  checked={onlyVerified}
                  onCheckedChange={setOnlyVerified}
                  className="data-[state=checked]:bg-gold"
                />
                <Label htmlFor="verified-filter" className="text-xs flex items-center gap-1 cursor-pointer">
                  <BadgeCheck className="w-4 h-4 text-gold" />
                  Vérifiés uniquement
                </Label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="px-6 mt-4 flex items-center">
        <p className="text-sm text-muted-foreground">
          {filteredCreators.length} créateur{filteredCreators.length > 1 ? "s" : ""} trouvé{filteredCreators.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Creators Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : (
        <div className="px-6 mt-4 grid grid-cols-2 gap-3">
          {filteredCreators.map((creator, index) => (
            <CreatorCard
              key={creator.userId}
              creator={creator}
              index={index}
              onClick={() => handleCreatorClick(creator)}
            />
          ))}
        </div>
      )}

      {!loading && filteredCreators.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 px-6"
        >
          <p className="text-muted-foreground">Aucun créateur trouvé</p>
        </motion.div>
      )}

      {/* Creator Detail Sheet */}
      <CreatorDetailSheet
        creator={selectedCreator}
        creatorUserId={selectedCreator?.userId.startsWith("static-") ? null : selectedCreator?.userId}
        open={showCreatorDetail}
        onOpenChange={setShowCreatorDetail}
      />

      <BottomNav />
    </div>
  );
};

export default Explore;
