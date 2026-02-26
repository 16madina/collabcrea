import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye, Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoCollabcrea from "@/assets/logo-collabcrea.png";

interface ContentPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: {
    id: string;
    content_url: string | null;
    content_description: string | null;
    preview_viewed_at?: string | null;
  };
  onViewed: () => void;
}

// Track viewed IDs across remounts within the same session
const alreadyViewedIds = new Set<string>();

/**
 * One-time secure preview for brands.
 * Shows watermarked content, disables download, marks as viewed on open.
 */
const ContentPreviewSheet = ({ open, onOpenChange, collaboration, onViewed }: ContentPreviewSheetProps) => {
  const [hasMarkedViewed, setHasMarkedViewed] = useState(false);
  const alreadyViewed = !!collaboration.preview_viewed_at || alreadyViewedIds.has(collaboration.id);

  // Parse content URLs
  const getPreviewUrls = (): string[] => {
    if (!collaboration.content_url) return [];
    try {
      const parsed = JSON.parse(collaboration.content_url);
      return Array.isArray(parsed) ? parsed : [collaboration.content_url];
    } catch {
      return [collaboration.content_url];
    }
  };

  const previewUrls = getPreviewUrls();

  const isVideo = (url: string) =>
    /\.(mp4|mov|webm|avi)$/i.test(url) || url.includes("/collaboration-content/");

  // Mark as viewed when the sheet opens for the first time
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && !hasMarkedViewed && !alreadyViewed) {
      setHasMarkedViewed(true);
      alreadyViewedIds.add(collaboration.id);
      await supabase
        .from("collaborations")
        .update({ preview_viewed_at: new Date().toISOString() } as any)
        .eq("id", collaboration.id);
      onViewed();
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gold" />
            Aperçu unique du contenu
          </SheetTitle>
        </SheetHeader>

        {/* Warning banner */}
        <div className="rounded-xl p-3 bg-orange-500/10 border border-orange-500/20 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-500">Visionnage unique</p>
              <p className="text-xs text-muted-foreground">
                Vous ne pouvez voir ce contenu qu'une seule fois. Après fermeture, le paiement sera nécessaire pour y accéder à nouveau.
              </p>
            </div>
          </div>
        </div>

        {/* Content with watermark overlay */}
        <div className="space-y-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative overflow-hidden rounded-xl">
              {/* Content */}
              {isVideo(url) ? (
                <video
                  src={url}
                  controls
                  controlsList="nodownload nofullscreen"
                  disablePictureInPicture
                  playsInline
                  className="w-full rounded-xl"
                  style={{ pointerEvents: "auto" }}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <img
                  src={url}
                  alt={`Contenu ${index + 1}`}
                  className="w-full rounded-xl"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              )}

              {/* Watermark overlay - covers entire content */}
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {/* Repeating diagonal watermarks - more rows & cols for full coverage */}
                <div className="absolute -inset-[50%] flex flex-col items-center justify-center gap-8 -rotate-30">
                  {Array.from({ length: 12 }).map((_, row) => (
                    <div key={row} className="flex items-center gap-10 whitespace-nowrap">
                      {Array.from({ length: 6 }).map((_, col) => (
                        <div key={col} className="flex flex-col items-center gap-1">
                          <img
                            src={logoCollabcrea}
                            alt=""
                            className="w-10 h-10 opacity-30 select-none"
                            draggable={false}
                          />
                          <span
                            className="text-white/25 text-lg font-bold tracking-widest select-none"
                            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                          >
                            COLLABCREA
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {/* Central large logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 -rotate-30">
                    <img
                      src={logoCollabcrea}
                      alt=""
                      className="w-20 h-20 opacity-40 select-none"
                      draggable={false}
                    />
                    <span
                      className="text-white/40 text-3xl font-black tracking-[0.3em] select-none"
                      style={{ textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
                    >
                      COLLABCREA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        {collaboration.content_description && (
          <div className="mt-4 p-3 rounded-xl bg-muted/50">
            <p className="text-sm font-medium text-foreground mb-1">Description du créateur :</p>
            <p className="text-sm text-muted-foreground">{collaboration.content_description}</p>
          </div>
        )}

        {/* Lock reminder */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Le contenu sera verrouillé après fermeture</span>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContentPreviewSheet;
