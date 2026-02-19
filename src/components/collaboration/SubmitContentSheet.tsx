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
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Video,
  Globe,
  Eye,
} from "lucide-react";
import { useCollaborations, Collaboration } from "@/hooks/useCollaborations";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubmitContentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration;
  onSuccess?: () => void;
  mode?: "content" | "publication_link"; // "content" = submit preview/file, "publication_link" = submit network link
}

const SubmitContentSheet = ({
  open,
  onOpenChange,
  collaboration,
  onSuccess,
  mode = "content",
}: SubmitContentSheetProps) => {
  const { submitContent, submitPublicationLink } = useCollaborations();
  const [loading, setLoading] = useState(false);
  const [contentUrls, setContentUrls] = useState<string[]>([""]);
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [publicationUrl, setPublicationUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNetworkMode = collaboration.offer?.delivery_mode === "network";
  const isPublicationLinkMode = mode === "publication_link";

  const MAX_LINKS = 4;
  const deadline = parseISO(collaboration.deadline);
  const daysLeft = differenceInDays(deadline, new Date());
  const isExpired = isPast(deadline);

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
      const previewUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(previewUrl);
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
    // Publication link mode
    if (isPublicationLinkMode) {
      if (!publicationUrl.trim()) return;
      setLoading(true);
      try {
        await submitPublicationLink(collaboration.id, publicationUrl.trim());
        onOpenChange(false);
        onSuccess?.();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Standard content submission
    if (!hasValidUrls && !videoFile) return;
    setLoading(true);
    try {
      const videoUrl = await uploadVideo();
      const validUrls = contentUrls.filter((url) => url.trim() !== "");
      if (videoUrl) validUrls.push(videoUrl);
      const contentUrlString = validUrls.length === 1 ? validUrls[0] : JSON.stringify(validUrls);
      await submitContent(collaboration.id, contentUrlString, description);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Render publication link form (step 2 of network mode)
  if (isPublicationLinkMode) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl font-display flex items-center gap-2">
              <Globe className="w-6 h-6 text-gold" />
              Soumettre le lien de publication
            </SheetTitle>
            <SheetDescription>
              Collez le lien de votre post publié sur les réseaux sociaux
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto max-h-[calc(70vh-200px)]">
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
              <div className="flex gap-3">
                <Eye className="w-5 h-5 text-accent flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Aperçu validé par la marque ✅</p>
                  <p className="text-muted-foreground">
                    Publiez maintenant le contenu sur vos réseaux et collez le lien ci-dessous.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Lien de la publication *
              </Label>
              <Input
                placeholder="https://www.tiktok.com/@username/video/..."
                value={publicationUrl}
                onChange={(e) => setPublicationUrl(e.target.value)}
                className="bg-muted/30 border-border focus:border-gold"
              />
              <p className="text-xs text-muted-foreground">
                Collez le lien direct vers votre publication (TikTok, Instagram, YouTube, etc.)
              </p>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-gold flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Après soumission</p>
                  <p>
                    La marque vérifiera que le contenu est bien publié. Le paiement sera déclenché après validation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || !publicationUrl.trim()}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Globe className="w-5 h-5 mr-2" />
              )}
              Soumettre le lien
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <Upload className="w-6 h-6 text-gold" />
            {isNetworkMode ? "Soumettre l'aperçu" : "Soumettre le contenu"}
          </SheetTitle>
          <SheetDescription>
            {isNetworkMode
              ? "Envoyez un aperçu pour validation avant de publier sur vos réseaux"
              : "Partagez le lien vers votre contenu publié"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {/* Network mode info banner */}
          {isNetworkMode && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex gap-3">
                <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">📱 Mode publication réseau</p>
                  <p className="text-muted-foreground">
                    Étape 1 : Envoyez un aperçu du contenu. La marque le validera avant que vous ne le publiiez sur vos réseaux.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Deadline Warning */}
          <div
            className={`rounded-xl p-4 ${
              isExpired
                ? "bg-destructive/10 border border-destructive/20"
                : daysLeft <= 3
                ? "bg-orange-500/10 border border-orange-500/20"
                : "bg-blue-500/10 border border-blue-500/20"
            }`}
          >
            <div className="flex gap-3">
              {isExpired ? (
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              ) : (
                <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  {isExpired
                    ? "Deadline dépassée !"
                    : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Date limite : {format(deadline, "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>

          {/* Collaboration Info */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  {collaboration.offer?.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Marque: {collaboration.brand?.company_name}
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
                {isNetworkMode ? "Liens vers l'aperçu *" : "Liens vers le contenu *"}
              </Label>
              {contentUrls.length < MAX_LINKS && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addLinkField}
                  className="text-gold hover:text-gold/80 h-8 px-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un lien
                </Button>
              )}
            </div>
            
            {contentUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={isNetworkMode ? "Lien vers l'aperçu du contenu..." : "https://www.tiktok.com/@username/video/..."}
                  value={url}
                  onChange={(e) => updateLink(index, e.target.value)}
                  className="bg-muted/30 border-border focus:border-gold flex-1"
                />
                {contentUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLinkField(index)}
                    className="text-muted-foreground hover:text-destructive h-10 w-10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <p className="text-xs text-muted-foreground">
              {isNetworkMode
                ? "Partagez des liens vers un aperçu (Google Drive, WeTransfer, etc.)"
                : `Collez les liens de vos vidéos TikTok, YouTube, Instagram, etc. (${contentUrls.length}/${MAX_LINKS} max)`}
            </p>
          </div>

          {/* Video Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              {isNetworkMode ? "Upload de l'aperçu vidéo (recommandé)" : "Upload vidéo (optionnel)"}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
            
            {videoFile && videoPreviewUrl ? (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video src={videoPreviewUrl} className="w-full h-40 object-contain" controls muted />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Video className="w-4 h-4 text-gold" />
                      <span className="text-sm truncate max-w-[180px]">{videoFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); clearVideoFile(); }}
                      className="text-white hover:text-destructive hover:bg-white/10"
                    >
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
              placeholder="Ajoutez des notes pour la marque..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] bg-muted/30 border-border focus:border-gold"
            />
          </div>

          {/* Info */}
          <div className="glass rounded-xl p-4">
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-gold flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Après soumission</p>
                <p>
                  {isNetworkMode
                    ? "Votre aperçu sera protégé par un filigrane. La marque le validera avant que vous ne publiiez sur vos réseaux."
                    : "Votre contenu sera protégé par un filigrane CollabCrea. La marque devra payer pour le débloquer et le voir en qualité originale avant de le valider."}
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
            disabled={loading || uploadingVideo || (!hasValidUrls && !videoFile) || isExpired}
          >
            {loading || uploadingVideo ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            {isExpired 
              ? "Deadline dépassée" 
              : uploadingVideo 
                ? "Upload en cours..."
                : isNetworkMode
                  ? "Soumettre l'aperçu"
                  : "Soumettre le contenu"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SubmitContentSheet;