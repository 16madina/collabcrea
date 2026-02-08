import { useState } from "react";
import { motion } from "framer-motion";
import { Image, Play, FolderOpen } from "lucide-react";
import { usePortfolio, PortfolioItem } from "@/hooks/usePortfolio";
import PortfolioMediaViewer from "@/components/creator/PortfolioMediaViewer";

interface PortfolioTabProps {
  userId: string;
}

const PortfolioTab = ({ userId }: PortfolioTabProps) => {
  const { items, loading } = usePortfolio(userId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleItemClick = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            Aucune réalisation
          </h3>
          <p className="text-sm text-muted-foreground">
            Ce créateur n'a pas encore ajouté de contenu à son portfolio.
          </p>
        </motion.div>
      </div>
    );
  }

  const images = items.filter((item) => item.media_type === "image");
  const videos = items.filter((item) => item.media_type === "video");

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
            <Image className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium">{images.length} photos</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
            <Play className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium">{videos.length} vidéos</span>
          </div>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {items.map((item, index) => (
            <PortfolioItemCard 
              key={item.id} 
              item={item} 
              index={index} 
              onClick={() => handleItemClick(index)}
            />
          ))}
        </motion.div>
      </div>

      {/* Media Viewer */}
      <PortfolioMediaViewer
        items={items}
        initialIndex={selectedIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </>
  );
};

interface PortfolioItemCardProps {
  item: PortfolioItem;
  index: number;
  onClick: () => void;
}

const PortfolioItemCard = ({ item, index, onClick }: PortfolioItemCardProps) => {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index }}
      onClick={onClick}
      className="relative aspect-square rounded-xl overflow-hidden bg-muted/30 group cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background"
    >
      {item.media_type === "image" ? (
        <img
          src={item.media_url}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <>
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <video
              src={item.media_url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          )}
          {/* Video indicator */}
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-foreground fill-current" />
          </div>
        </>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-sm font-semibold text-foreground truncate">
          {item.title}
        </p>
        {item.platform && (
          <p className="text-xs text-muted-foreground">{item.platform}</p>
        )}
      </div>
    </motion.button>
  );
};

export default PortfolioTab;
