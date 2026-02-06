import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Users, Star, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LandingNav from "@/components/LandingNav";
import creatorTech from "@/assets/creator-tech.jpg";
import creatorFashion from "@/assets/creator-fashion.jpg";
import creatorFitness from "@/assets/creator-fitness.jpg";
import creatorCuisine from "@/assets/creator-cuisine.jpg";
import creatorBeauty from "@/assets/creator-beauty.jpg";
import creatorHumour from "@/assets/creator-humour.jpg";
import creatorLifestyle from "@/assets/creator-lifestyle.jpg";
import creatorMusic from "@/assets/creator-music.jpg";

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

const allCreators = [
  {
    firstName: "Kofi",
    lastName: "Mensah",
    category: "Tech",
    followers: "320K",
    country: "Ghana",
    flag: "🇬🇭",
    image: creatorTech,
    rating: 4.9,
  },
  {
    firstName: "Amara",
    lastName: "Diallo",
    category: "Mode",
    followers: "450K",
    country: "Sénégal",
    flag: "🇸🇳",
    image: creatorFashion,
    rating: 4.8,
  },
  {
    firstName: "Moussa",
    lastName: "Traoré",
    category: "Fitness",
    followers: "280K",
    country: "Mali",
    flag: "🇲🇱",
    image: creatorFitness,
    rating: 4.7,
  },
  {
    firstName: "Fatou",
    lastName: "Ndiaye",
    category: "Cuisine",
    followers: "190K",
    country: "Sénégal",
    flag: "🇸🇳",
    image: creatorCuisine,
    rating: 4.6,
  },
  {
    firstName: "Awa",
    lastName: "Diop",
    category: "Beauté",
    followers: "520K",
    country: "Côte d'Ivoire",
    flag: "🇨🇮",
    image: creatorBeauty,
    rating: 4.9,
  },
  {
    firstName: "Kwame",
    lastName: "Asante",
    category: "Humour",
    followers: "890K",
    country: "Nigeria",
    flag: "🇳🇬",
    image: creatorHumour,
    rating: 4.8,
  },
  {
    firstName: "Mariama",
    lastName: "Bah",
    category: "Lifestyle",
    followers: "210K",
    country: "Guinée",
    flag: "🇬🇳",
    image: creatorLifestyle,
    rating: 4.5,
  },
  {
    firstName: "Youssef",
    lastName: "Oumar",
    category: "Musique",
    followers: "670K",
    country: "Cameroun",
    flag: "🇨🇲",
    image: creatorMusic,
    rating: 4.7,
  },
];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");

  const filteredCreators = allCreators.filter((creator) => {
    const matchesSearch =
      creator.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "Tous" || creator.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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

      {/* Creators List */}
      <div className="px-6 mt-4 space-y-3">
        {filteredCreators.map((creator, index) => (
          <motion.div
            key={creator.firstName + creator.lastName}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card overflow-hidden flex"
          >
            {/* Photo - Left side */}
            <div className="relative w-32 h-36 flex-shrink-0 overflow-hidden">
              <img
                src={creator.image}
                alt={`${creator.firstName} ${creator.lastName}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/30" />
            </div>

            {/* Info - Right side */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display font-semibold text-base text-foreground leading-tight">
                    {creator.firstName} {creator.lastName}
                  </h4>
                  {/* Rating Badge */}
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium glass flex-shrink-0">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span className="text-foreground">{creator.rating}</span>
                  </span>
                </div>

                {/* Category Badge */}
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/20 text-gold border border-gold/30">
                  {creator.category}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3">
                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="text-base">{creator.flag}</span>
                  <span>{creator.country}</span>
                </div>

                {/* Followers */}
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-gold" />
                  <span className="text-sm font-bold text-gold">
                    {creator.followers}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
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

      <LandingNav />
    </div>
  );
};

export default Explore;
