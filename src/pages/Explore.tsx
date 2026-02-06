import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import LandingNav from "@/components/LandingNav";
import CreatorCard from "@/components/CreatorCard";
import CreatorDetailSheet from "@/components/CreatorDetailSheet";
import type { Creator } from "@/components/CreatorDetailSheet";
import { allCreators } from "@/data/creators";

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
];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showCreatorDetail, setShowCreatorDetail] = useState(false);

  const filteredCreators = allCreators.filter((creator) => {
    const matchesSearch =
      creator.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "Tous" || creator.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreatorClick = (creator: Creator) => {
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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un créateur..."
              className="pl-12 h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
            />
          </div>
        </motion.div>
      </div>

      {/* Categories Filter */}
      <div className="px-6 mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === category
                  ? "bg-gold text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Results Count */}
      <div className="px-6 mt-4">
        <p className="text-sm text-muted-foreground">
          {filteredCreators.length} créateur{filteredCreators.length > 1 ? "s" : ""} trouvé{filteredCreators.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Creators Grid */}
      <div className="px-6 mt-4 grid grid-cols-2 gap-3">
        {filteredCreators.map((creator, index) => (
          <CreatorCard
            key={creator.firstName + creator.lastName}
            creator={creator}
            index={index}
            onClick={() => handleCreatorClick(creator)}
          />
        ))}
      </div>

      {filteredCreators.length === 0 && (
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
        open={showCreatorDetail}
        onOpenChange={setShowCreatorDetail}
      />

      <LandingNav />
    </div>
  );
};

export default Explore;
