import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CountryFlag } from "@/lib/flags";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, BadgeCheck, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

import { africanCountryFilters } from "@/data/africanCountries";

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
  const navigate = useNavigate();

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
    if (!creator.userId.startsWith("static-")) {
      navigate(`/user-details/${creator.userId}`);
      return;
    }

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
                      setActiveCountry("all");
                      setActiveGender("all");
                      setOnlyVerified(false);
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
                {/* Gender */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Genre</p>
                  <div className="flex flex-wrap gap-2">
                    {genderFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setActiveGender(filter.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
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

                {/* Verified */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="verified-filter"
                    checked={onlyVerified}
                    onCheckedChange={setOnlyVerified}
                    className="data-[state=checked]:bg-gold"
                  />
                  <Label htmlFor="verified-filter" className="text-sm flex items-center gap-1.5 cursor-pointer">
                    <BadgeCheck className="w-4 h-4 text-gold" />
                    Vérifiés uniquement
                  </Label>
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
