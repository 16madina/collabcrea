import { motion } from "framer-motion";
import { Heart, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FavoriteCreator {
  id: string;
  name: string;
  category: string;
  avatarUrl: string | null;
  followers: string | null;
}

interface BrandFavoritesTabProps {
  favorites: FavoriteCreator[];
}

const BrandFavoritesTab = ({ favorites }: BrandFavoritesTabProps) => {
  const navigate = useNavigate();

  if (favorites.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <div className="text-center py-12 px-4">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Parcourez les créateurs et ajoutez-les à vos favoris pour les retrouver facilement
          </p>
          <Button 
            onClick={() => navigate("/brand/marketplace")}
            className="bg-gold hover:bg-gold/90 text-background gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Découvrir les créateurs
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        {favorites.map((creator) => (
          <motion.div
            key={creator.id}
            whileTap={{ scale: 0.98 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted overflow-hidden mb-3">
                {creator.avatarUrl ? (
                  <img 
                    src={creator.avatarUrl} 
                    alt={creator.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-bold">
                    {creator.name.charAt(0)}
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-sm truncate w-full">{creator.name}</h4>
              <p className="text-xs text-muted-foreground">{creator.category}</p>
              {creator.followers && (
                <p className="text-xs text-gold mt-1">{creator.followers} abonnés</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default BrandFavoritesTab;
