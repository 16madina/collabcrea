import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import CreatorCard from "@/components/CreatorCard";
import CreatorDetailSheet, { Creator } from "@/components/CreatorDetailSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { allCreators } from "@/data/creators";

const categories = [
  "Tous",
  "Beauté",
  "Mode",
  "Lifestyle",
  "Tech",
  "Cuisine",
  "Fitness",
  "Musique",
  "Humour",
];

interface DBCreator {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  category: string | null;
  country: string | null;
  bio: string | null;
  followers: string | null;
  instagram_followers: string | null;
  tiktok_followers: string | null;
  youtube_followers: string | null;
  snapchat_followers: string | null;
  pricing: any;
  identity_verified: boolean;
}

const getCountryFlag = (country: string | null): string => {
  const flags: Record<string, string> = {
    "Sénégal": "🇸🇳",
    "Senegal": "🇸🇳",
    "Côte d'Ivoire": "🇨🇮",
    "Ivory Coast": "🇨🇮",
    "Ghana": "🇬🇭",
    "Nigeria": "🇳🇬",
    "Cameroun": "🇨🇲",
    "Cameroon": "🇨🇲",
    "Mali": "🇲🇱",
    "Guinée": "🇬🇳",
    "Guinea": "🇬🇳",
    "Burkina Faso": "🇧🇫",
    "Togo": "🇹🇬",
    "Bénin": "🇧🇯",
    "Benin": "🇧🇯",
    "Niger": "🇳🇪",
    "France": "🇫🇷",
    "Maroc": "🇲🇦",
    "Morocco": "🇲🇦",
    "Tunisie": "🇹🇳",
    "Tunisia": "🇹🇳",
    "Algérie": "🇩🇿",
    "Algeria": "🇩🇿",
  };
  return flags[country || ""] || "🌍";
};

const BrandMarketplace = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [dbCreators, setDbCreators] = useState<DBCreator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [selectedCreatorUserId, setSelectedCreatorUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        // Fetch creators (users with creator role)
        const { data: creatorRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "creator");

        if (rolesError) throw rolesError;

        const creatorIds = creatorRoles?.map(r => r.user_id) || [];

        if (creatorIds.length === 0) {
          setDbCreators([]);
          setLoading(false);
          return;
        }

        // Fetch profiles for creators
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, avatar_url, category, country, bio, followers, instagram_followers, tiktok_followers, youtube_followers, snapchat_followers, pricing, identity_verified")
          .in("user_id", creatorIds)
          .eq("is_banned", false);

        if (profilesError) throw profilesError;

        setDbCreators(profiles || []);
      } catch (error) {
        console.error("Error fetching creators:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();

    // Realtime: re-fetch when profiles or user_roles change
    const channel = supabase
      .channel("brand-marketplace")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchCreators()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => fetchCreators()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Convert DB creators to Creator format
  const convertedCreators: (Creator & { dbUserId: string })[] = dbCreators.map(c => {
    const nameParts = c.full_name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    return {
      dbUserId: c.user_id,
      firstName,
      lastName,
      category: c.category || "Créateur",
      country: c.country || "Afrique",
      flag: getCountryFlag(c.country),
      image: c.avatar_url || "",
      bio: c.bio || undefined,
      isVerified: c.identity_verified,
      socials: {
        youtube: c.youtube_followers || undefined,
        instagram: c.instagram_followers || undefined,
        tiktok: c.tiktok_followers || undefined,
        snapchat: c.snapchat_followers || undefined,
      },
      pricing: Array.isArray(c.pricing) ? c.pricing : [],
    };
  });

  // Combine real creators with mock data (real ones first, then mock to fill)
  const mockCreators = allCreators.map((c, i) => ({ ...c, dbUserId: `mock-${i}` }));
  const displayCreators = [...convertedCreators, ...mockCreators];

  const filteredCreators = displayCreators.filter((creator) => {
    const fullName = `${creator.firstName} ${creator.lastName}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      creator.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      activeCategory === "Tous" || creator.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreatorClick = (creator: Creator & { dbUserId?: string }) => {
    if (creator.dbUserId && !creator.dbUserId.startsWith("mock-")) {
      navigate(`/user-details/${creator.dbUserId}`);
      return;
    }

    setSelectedCreator(creator);
    setSelectedCreatorUserId(creator.dbUserId || null);
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
            Créateurs
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

      {/* Category Filters */}
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
                  : "glass text-muted-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-6 mt-4">
        <p className="text-sm text-muted-foreground">
          {filteredCreators.length} créateur{filteredCreators.length > 1 ? "s" : ""} trouvé{filteredCreators.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Creators Grid */}
      <div className="px-6 mt-4">
        <AnimatePresence>
          {filteredCreators.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">Aucun créateur trouvé</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredCreators.map((creator, index) => (
                <motion.div
                  key={`${creator.firstName}-${creator.lastName}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CreatorCard
                    creator={creator}
                    index={index}
                    onClick={() => handleCreatorClick(creator)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Creator Detail Sheet */}
      <CreatorDetailSheet
        creator={selectedCreator}
        creatorUserId={selectedCreatorUserId}
        open={!!selectedCreator}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCreator(null);
            setSelectedCreatorUserId(null);
          }
        }}
      />

      <BottomNav />
    </div>
  );
};

export default BrandMarketplace;
