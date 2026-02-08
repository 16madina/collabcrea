import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Image, Video, Play, X, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

type MediaType = "all" | "image" | "video";

interface PortfolioItem {
  id: number;
  type: "image" | "video";
  thumbnail: string;
  title: string;
  views: string;
  platform: string;
}

const portfolioItems: PortfolioItem[] = [
  { id: 1, type: "video", thumbnail: "🎬", title: "Review Skincare", views: "45K", platform: "YouTube" },
  { id: 2, type: "image", thumbnail: "📸", title: "Shooting Mode", views: "12K", platform: "Instagram" },
  { id: 3, type: "video", thumbnail: "🎬", title: "Routine Beauté", views: "89K", platform: "TikTok" },
  { id: 4, type: "image", thumbnail: "📸", title: "Lookbook Été", views: "23K", platform: "Instagram" },
  { id: 5, type: "video", thumbnail: "🎬", title: "Recette Africaine", views: "156K", platform: "YouTube" },
  { id: 6, type: "image", thumbnail: "📸", title: "Portrait Studio", views: "8K", platform: "Instagram" },
];

const filters: { label: string; value: MediaType; icon: typeof Image }[] = [
  { label: "Tout", value: "all", icon: Image },
  { label: "Photos", value: "image", icon: Image },
  { label: "Vidéos", value: "video", icon: Video },
];

const CreatorPortfolio = () => {
  const [activeFilter, setActiveFilter] = useState<MediaType>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const filteredItems = portfolioItems.filter(
    (item) => activeFilter === "all" || item.type === activeFilter
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-gold-gradient">
              Portfolio
            </h1>
            <p className="text-muted-foreground text-sm">
              {portfolioItems.length} médias
            </p>
          </div>
          <Button
            variant="gold"
            size="icon"
            onClick={() => setShowUploadModal(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="px-6 mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter.value
                    ? "bg-gold text-primary-foreground"
                    : "glass text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Grid */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="relative aspect-square rounded-2xl bg-violet-light/30 overflow-hidden cursor-pointer group"
            >
              {/* Placeholder for actual media */}
              <div className="absolute inset-0 flex items-center justify-center text-5xl">
                {item.thumbnail}
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Video indicator */}
              {item.type === "video" && (
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/50 backdrop-blur flex items-center justify-center">
                  <Play className="w-4 h-4 text-foreground fill-current" />
                </div>
              )}
              
              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.platform}</span>
                  <span>{item.views} vues</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="font-display text-lg font-semibold mb-4">Statistiques Portfolio</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gold-gradient">333K</p>
              <p className="text-xs text-muted-foreground">Vues totales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-gradient">4</p>
              <p className="text-xs text-muted-foreground">Vidéos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-gradient">2</p>
              <p className="text-xs text-muted-foreground">Photos</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">Ajouter un média</h2>
                <button onClick={() => setShowUploadModal(false)} className="touch-target">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <button className="w-full glass-card p-6 flex flex-col items-center gap-3 hover:border-gold/30 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gold" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Photo</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG, WebP</p>
                  </div>
                </button>

                <button className="w-full glass-card p-6 flex flex-col items-center gap-3 hover:border-gold/30 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-violet-light/30 flex items-center justify-center">
                    <Video className="w-8 h-8 text-gold" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Vidéo</p>
                    <p className="text-sm text-muted-foreground">MP4, MOV, WebM</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
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
              
              <div className="aspect-video rounded-2xl bg-violet-light/30 flex items-center justify-center text-7xl mb-6">
                {selectedItem.thumbnail}
              </div>

              <h2 className="font-display text-xl font-bold mb-2">{selectedItem.title}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span>{selectedItem.platform}</span>
                <span>•</span>
                <span>{selectedItem.views} vues</span>
                <span>•</span>
                <span className="capitalize">{selectedItem.type === "video" ? "Vidéo" : "Photo"}</span>
              </div>

              <div className="flex gap-3">
                <Button variant="glass" size="lg" className="flex-1">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Supprimer
                </Button>
                <Button variant="gold" size="lg" className="flex-1">
                  Modifier
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default CreatorPortfolio;
