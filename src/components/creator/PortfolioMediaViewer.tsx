import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { PortfolioItem } from "@/hooks/usePortfolio";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface PortfolioMediaViewerProps {
  items: PortfolioItem[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PortfolioMediaViewer = ({
  items,
  initialIndex,
  open,
  onOpenChange,
}: PortfolioMediaViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync currentIndex when initialIndex changes and dialog opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, open]);

  const currentItem = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const goToPrev = () => {
    if (hasPrev) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (hasNext) setCurrentIndex(currentIndex + 1);
  };

  if (!currentItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-xl border-none">
        <VisuallyHidden>
          <DialogTitle>Visualiseur de média</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-background/60 hover:bg-background/80"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Navigation arrows */}
        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-background/60 hover:bg-background/80"
            onClick={goToPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-background/60 hover:bg-background/80"
            onClick={goToNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}

        {/* Media content */}
        <div className="flex items-center justify-center min-h-[60vh] max-h-[80vh] p-4">
          {currentItem.media_type === "image" ? (
            <img
              src={currentItem.media_url}
              alt={currentItem.title}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
          ) : (
            <video
              src={currentItem.media_url}
              controls
              autoPlay
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
              poster={currentItem.thumbnail_url || undefined}
            >
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          )}
        </div>

        {/* Info bar */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{currentItem.title}</h3>
              {currentItem.platform && (
                <p className="text-sm text-muted-foreground">{currentItem.platform}</p>
              )}
              {currentItem.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentItem.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentIndex + 1} / {items.length}</span>
              {currentItem.media_type === "video" && (
                <Play className="w-4 h-4 text-gold" />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioMediaViewer;
