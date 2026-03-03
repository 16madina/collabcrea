import { useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Upload,
  Link as LinkIcon,
  Plus,
  X,
  Video,
  Camera,
  Clock,
} from "lucide-react";
import { Collaboration } from "@/hooks/useCollaborations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandSubmitContentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration;
  onSuccess?: () => void;
}

const BrandSubmitContentSheet = ({
  open,
  onOpenChange,
  collaboration,
  onSuccess,
}: BrandSubmitContentSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [contentUrls, setContentUrls] = useState<string[]>([""]);
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_LINKS = 4;

  const addLinkField = () => {
    if (contentUrls.length < MAX_LINKS) {
      setContentUrls([...contentUrls, ""]);
    }
  };

  const removeLinkField = (index: number) => {
    if (contentUrls.length > 1) {
      setContentUrls(contentUrls.filter((_, i) => i !== index));
    }
  };

  const updateLink = (index: number, value: string) => {
    const newUrls = [...contentUrls];
    newUrls[index] = value;
    setContentUrls(newUrls);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error("La vidéo ne doit pas dépasser 500 Mo");
        return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearVideoFile = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!videoFile) return null;
    setUploadingVideo(true);
    try {
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${collaboration.id}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("collaboration-content").upload(fileName, videoFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("collaboration-content").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Erreur lors de l'upload de la vidéo");
      return null;
    } finally {
      setUploadingVideo(false);
    }
  };

  const hasValidUrls = contentUrls.some((url) => url.trim() !== "");

  const handleSubmit = async () => {
    if (!hasValidUrls && !videoFile) return;
    setLoading(true);
    try {
      const videoUrl = await uploadVideo();
      const validUrls = contentUrls.filter((url) => url.trim() !== "");
      if (videoUrl) validUrls.push(videoUrl);
      const contentUrlString = validUrls.length === 1 ? validUrls[0] : JSON.stringify(validUrls);

      // Brand submits content: 48h auto-approval for creator protection
      const autoApproveDate = new Date();
      autoApproveDate.setHours(autoApproveDate.getHours() + 48);

      const { error } = await supabase
        .from("collaborations")
        .update({
          content_url: contentUrlString,
          content_description: description || null,
          content_submitted_at: new Date().toISOString(),
          auto_approve_at: autoApproveDate.toISOString(),
          status: "content_submitted",
        })
        .eq("id", collaboration.id);

      if (error) throw error;

      toast.success("Contenu soumis ! Le créateur a 48h pour valider.");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <Camera className="w-6 h-6 text-gold" />
            Soumettre le contenu filmé
          </SheetTitle>
          <SheetDescription>
            Uploadez le contenu filmé en magasin pour validation par le créateur
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {/* Info banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <Camera className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">📹 Mode "Marque filme"</p>
                <p className="text-muted-foreground">
                  Vous filmez et soumettez le contenu. Le créateur a 48h pour valider avant auto-approbation.
                </p>
              </div>
            </div>
          </div>

          {/* Collaboration Info */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{collaboration.offer?.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Créateur: {collaboration.creator?.full_name}
                </p>
              </div>
              <Badge variant="secondary">{collaboration.offer?.category}</Badge>
            </div>
          </div>

          {/* Content URLs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Liens vers le contenu *
              </Label>
              {contentUrls.length < MAX_LINKS && (
                <Button type="button" variant="ghost" size="sm" onClick={addLinkField} className="text-gold hover:text-gold/80 h-8 px-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un lien
                </Button>
              )}
            </div>
            {contentUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Lien vers le contenu filmé..."
                  value={url}
                  onChange={(e) => updateLink(index, e.target.value)}
                  className="bg-muted/30 border-border focus:border-gold flex-1"
                />
                {contentUrls.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLinkField(index)} className="text-muted-foreground hover:text-destructive h-10 w-10">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Partagez des liens vers le contenu (Google Drive, WeTransfer, etc.) ({contentUrls.length}/{MAX_LINKS} max)
            </p>
          </div>

          {/* Video Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Upload vidéo (recommandé)
            </Label>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
            {videoFile && videoPreviewUrl ? (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video src={videoPreviewUrl} className="w-full h-40 object-contain" controls muted />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Video className="w-4 h-4 text-gold" />
                      <span className="text-sm truncate max-w-[180px]">{videoFile.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); clearVideoFile(); }} className="text-white hover:text-destructive hover:bg-white/10">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                    {(videoFile.size / (1024 * 1024)).toFixed(1)} Mo
                  </Badge>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/50 transition-colors bg-muted/30"
              >
                <div className="text-muted-foreground">
                  <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Cliquez pour ajouter une vidéo</p>
                  <p className="text-xs mt-1">MP4, MOV, AVI • Max 500 Mo</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optionnelle)</Label>
            <Textarea
              placeholder="Ajoutez des notes pour le créateur..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] bg-muted/30 border-border focus:border-gold"
            />
          </div>

          {/* Auto-approval info */}
          <div className="glass rounded-xl p-4">
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-gold flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Protection du créateur</p>
                <p>
                  Le créateur a <span className="font-semibold text-gold">48 heures</span> pour valider ou demander des modifications. 
                  Sans réponse, le contenu sera automatiquement validé et le paiement libéré.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || uploadingVideo || (!hasValidUrls && !videoFile)}
          >
            {loading || uploadingVideo ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            Soumettre le contenu
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BrandSubmitContentSheet;
