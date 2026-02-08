import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  DollarSign,
  Link as LinkIcon,
  Video,
  Play,
} from "lucide-react";
import { useCollaborations, Collaboration } from "@/hooks/useCollaborations";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface ReviewContentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration;
  onSuccess?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

// Helper to detect if URL is a video file
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext)) || 
         lowercaseUrl.includes('collaboration-content');
};

// Helper to parse content URLs (handles both single URL and JSON array)
const parseContentUrls = (contentUrl: string | null): string[] => {
  if (!contentUrl) return [];
  
  // Try to parse as JSON array
  try {
    const parsed = JSON.parse(contentUrl);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Not JSON, treat as single URL
  }
  
  return [contentUrl];
};

const ReviewContentSheet = ({
  open,
  onOpenChange,
  collaboration,
  onSuccess,
}: ReviewContentSheetProps) => {
  const { approveContent, refundCollaboration } = useCollaborations();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [feedback, setFeedback] = useState("");

  // Parse content URLs
  const contentUrls = useMemo(() => 
    parseContentUrls(collaboration.content_url), 
    [collaboration.content_url]
  );
  
  const videoUrls = contentUrls.filter(isVideoUrl);
  const linkUrls = contentUrls.filter(url => !isVideoUrl(url));

  const autoApproveDate = collaboration.auto_approve_at
    ? parseISO(collaboration.auto_approve_at)
    : null;
  const daysUntilAutoApprove = autoApproveDate
    ? differenceInDays(autoApproveDate, new Date())
    : null;

  const handleApprove = async () => {
    setLoading(true);
    setAction("approve");
    try {
      await approveContent(collaboration.id, feedback);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;

    setLoading(true);
    setAction("reject");
    try {
      await refundCollaboration(collaboration.id, feedback);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display">
            Valider le contenu
          </SheetTitle>
          <SheetDescription>
            Examinez le contenu soumis par le créateur
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {/* Auto-approve Warning */}
          {daysUntilAutoApprove !== null && daysUntilAutoApprove > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    Validation automatique dans {daysUntilAutoApprove} jour
                    {daysUntilAutoApprove > 1 ? "s" : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Sans action de votre part, le paiement sera automatiquement libéré
                    le {format(autoApproveDate!, "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Creator Info */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-lg font-bold text-gold">
                {collaboration.creator?.full_name?.[0]?.toUpperCase() || "C"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {collaboration.creator?.full_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {collaboration.offer?.title}
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
                En attente
              </Badge>
            </div>
          </div>

          {/* Submitted Content */}
          <div className="space-y-4">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              Contenu soumis le{" "}
              {collaboration.content_submitted_at &&
                format(parseISO(collaboration.content_submitted_at), "dd MMM yyyy à HH:mm", {
                  locale: fr,
                })}
              <Badge variant="outline" className="ml-2">
                {contentUrls.length} élément{contentUrls.length > 1 ? "s" : ""}
              </Badge>
            </Label>

            {/* Video Previews */}
            {videoUrls.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Video className="w-4 h-4" />
                  <span>Vidéos uploadées ({videoUrls.length})</span>
                </div>
                {videoUrls.map((url, index) => (
                  <div key={index} className="rounded-xl overflow-hidden bg-black relative">
                    <video
                      src={url}
                      className="w-full h-48 object-contain"
                      controls
                      preload="metadata"
                    />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-lg hover:bg-black/80 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Link URLs */}
            {linkUrls.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LinkIcon className="w-4 h-4" />
                  <span>Liens vers le contenu ({linkUrls.length})</span>
                </div>
                {linkUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 glass rounded-xl p-4 hover:bg-muted/50 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="flex-1 text-foreground truncate text-sm">
                      {url}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Lien {index + 1}
                    </Badge>
                  </a>
                ))}
              </div>
            )}

            {/* Creator's Note */}
            {collaboration.content_description && (
              <div className="glass rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Note du créateur:</p>
                <p className="text-foreground">{collaboration.content_description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Info */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-gold" />
              <span className="font-semibold">Détails du paiement</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant séquestré</span>
              <span>{formatCurrency(collaboration.agreed_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commission plateforme</span>
              <span>-{formatCurrency(collaboration.platform_fee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Le créateur recevra</span>
              <span className="text-gold">{formatCurrency(collaboration.creator_amount)}</span>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label>Feedback (requis pour refus)</Label>
            <Textarea
              placeholder="Laissez un commentaire..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] bg-muted/30 border-border focus:border-gold"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
              onClick={handleReject}
              disabled={loading || !feedback.trim()}
            >
              {loading && action === "reject" ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5 mr-2" />
              )}
              Refuser
            </Button>
            <Button
              variant="gold"
              size="lg"
              className="flex-1"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading && action === "approve" ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Approuver
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReviewContentSheet;
