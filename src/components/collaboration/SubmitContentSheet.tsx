import { useState } from "react";
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
} from "lucide-react";
import { useCollaborations, Collaboration } from "@/hooks/useCollaborations";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";

interface SubmitContentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration;
  onSuccess?: () => void;
}

const SubmitContentSheet = ({
  open,
  onOpenChange,
  collaboration,
  onSuccess,
}: SubmitContentSheetProps) => {
  const { submitContent } = useCollaborations();
  const [loading, setLoading] = useState(false);
  const [contentUrl, setContentUrl] = useState("");
  const [description, setDescription] = useState("");

  const deadline = parseISO(collaboration.deadline);
  const daysLeft = differenceInDays(deadline, new Date());
  const isExpired = isPast(deadline);

  const handleSubmit = async () => {
    if (!contentUrl.trim()) return;

    setLoading(true);
    try {
      await submitContent(collaboration.id, contentUrl, description);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <Upload className="w-6 h-6 text-gold" />
            Soumettre le contenu
          </SheetTitle>
          <SheetDescription>
            Partagez le lien vers votre contenu publié
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
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

          {/* Content URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Lien vers le contenu *
            </Label>
            <Input
              placeholder="https://www.tiktok.com/@username/video/..."
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              className="bg-muted/30 border-border focus:border-gold"
            />
            <p className="text-xs text-muted-foreground">
              Collez le lien de votre vidéo TikTok, YouTube, Instagram, etc.
            </p>
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
                  La marque aura 7 jours pour valider votre contenu. Sans réponse
                  de sa part, le paiement sera automatiquement libéré.
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
            disabled={loading || !contentUrl.trim() || isExpired}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            {isExpired ? "Deadline dépassée" : "Soumettre le contenu"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SubmitContentSheet;
