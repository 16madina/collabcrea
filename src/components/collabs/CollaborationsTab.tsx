import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  CreditCard,
  Eye,
  Calendar,
  DollarSign,
  AlertTriangle,
  Wallet,
  Timer,
  MessageSquare,
  RefreshCw,
  Lock,
  Globe,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Camera,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollaborations, Collaboration } from "@/hooks/useCollaborations";
import { useAuth } from "@/hooks/useAuth";
import SubmitContentSheet from "@/components/collaboration/SubmitContentSheet";
import InAppPaymentSheet from "@/components/collaboration/InAppPaymentSheet";
import ReviewContentSheet from "@/components/collaboration/ReviewContentSheet";
import BrandSubmitContentSheet from "@/components/collaboration/BrandSubmitContentSheet";
import WatermarkOverlay from "@/components/collaboration/WatermarkOverlay";
import ContentPreviewSheet from "@/components/collaboration/ContentPreviewSheet";
import CreativeBriefDisplay from "@/components/collaboration/CreativeBriefDisplay";
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending_payment":
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">En attente de paiement</Badge>;
    case "in_progress":
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">En cours</Badge>;
    case "content_submitted":
      return <Badge variant="secondary" className="bg-purple-500/20 text-purple-500">Contenu prêt 🔒</Badge>;
    case "in_review":
      return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-500">En revue</Badge>;
    case "revision_requested":
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">Modification demandée</Badge>;
    case "pending_publication":
      return <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-500">📱 À publier</Badge>;
    case "publication_submitted":
      return <Badge variant="secondary" className="bg-teal-500/20 text-teal-500">🔗 Lien soumis</Badge>;
    case "completed":
      return <Badge variant="secondary" className="bg-green-500/20 text-green-500">Terminé</Badge>;
    case "refunded":
      return <Badge variant="secondary" className="bg-red-500/20 text-red-500">Remboursé</Badge>;
    case "expired":
      return <Badge variant="secondary" className="bg-gray-500/20 text-gray-500">Expiré</Badge>;
    case "refused":
      return <Badge variant="secondary" className="bg-red-500/20 text-red-500 border border-red-500/30">Refusé</Badge>;
    case "cancelled":
      return <Badge variant="secondary" className="bg-gray-500/20 text-gray-500">Annulé</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

// Countdown component for real-time updates
const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "warning" | "danger">("normal");

  useEffect(() => {
    const updateCountdown = () => {
      const deadlineDate = parseISO(deadline);
      const now = new Date();
      
      if (isPast(deadlineDate)) {
        setTimeLeft("Expiré");
        setUrgency("danger");
        return;
      }

      const days = differenceInDays(deadlineDate, now);
      const hours = differenceInHours(deadlineDate, now) % 24;
      const minutes = differenceInMinutes(deadlineDate, now) % 60;

      if (days > 3) {
        setTimeLeft(`${days}j ${hours}h`);
        setUrgency("normal");
      } else if (days > 0) {
        setTimeLeft(`${days}j ${hours}h ${minutes}m`);
        setUrgency("warning");
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
        setUrgency("danger");
      } else {
        setTimeLeft(`${minutes}m`);
        setUrgency("danger");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [deadline]);

  const colorClasses = {
    normal: "text-blue-500 bg-blue-500/10",
    warning: "text-orange-500 bg-orange-500/10",
    danger: "text-red-500 bg-red-500/10",
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${colorClasses[urgency]}`}>
      <Timer className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
};

interface CollaborationsTabProps {
  userRole: "creator" | "brand";
}

const CollaborationsTab = ({ userRole }: CollaborationsTabProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { collaborations, loading, refreshCollaborations, approvePublication, verifyPublicationLink, creatorApproveContent, requestRevision } = useCollaborations();
  const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(null);
  const [sheetType, setSheetType] = useState<"submit" | "payment" | "review" | "publication_link" | "brand_submit" | null>(null);
  const [activeSubTab, setActiveSubTab] = useState("active");
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [previewCollab, setPreviewCollab] = useState<Collaboration | null>(null);
  const [creatorApprovingIds, setCreatorApprovingIds] = useState<Set<string>>(new Set());

  // Helper: is this a "brand films" collaboration?
  const isBrandFilms = (collab: Collaboration) => collab.offer?.filming_by === "brand" && collab.offer?.presence_mode === "on_site";

  // Active = in_progress, content_submitted, pending_payment (unlock), in_review, revision_requested, pending_publication, publication_submitted
  const activeCollabs = collaborations.filter((c) =>
    ["in_progress", "content_submitted", "pending_payment", "in_review", "revision_requested", "pending_publication", "publication_submitted"].includes(c.status)
  );
  const completedCollabs = collaborations.filter((c) =>
    ["completed", "refunded", "expired", "refused", "cancelled"].includes(c.status)
  );

  const handleAction = (collab: Collaboration, actionOverride?: string) => {
    setSelectedCollab(collab);

    if (!user) return;

    if (actionOverride === "publication_link") {
      setSheetType("publication_link");
      return;
    }

    if (actionOverride === "brand_submit") {
      setSheetType("brand_submit");
      return;
    }

    if (collab.brand_id === user.id) {
      if (collab.status === "content_submitted" && !isBrandFilms(collab)) {
        setSheetType("payment");
      } else if (collab.status === "in_review") {
        setSheetType("review");
      } else if (collab.status === "publication_submitted") {
        setSheetType("review");
      }
    } else if (collab.creator_id === user.id) {
      if (collab.status === "in_progress" || collab.status === "revision_requested") {
        setSheetType("submit");
      } else if (collab.status === "pending_publication") {
        setSheetType("publication_link");
      }
    }
  };

  const handleCreatorApprove = async (collabId: string) => {
    setCreatorApprovingIds(prev => new Set(prev).add(collabId));
    try {
      await creatorApproveContent(collabId);
    } catch (e) {
      console.error(e);
    } finally {
      setCreatorApprovingIds(prev => { const s = new Set(prev); s.delete(collabId); return s; });
    }
  };

  const handleCreatorRequestRevision = async (collabId: string, feedbackText: string) => {
    try {
      await requestRevision(collabId, feedbackText);
    } catch (e) {
      console.error(e);
    }
  };

  const renderCollabCard = (collab: Collaboration) => {
    const deadline = parseISO(collab.deadline);
    const daysLeft = differenceInDays(deadline, new Date());
    const isExpired = isPast(deadline);
    const isCreator = user?.id === collab.creator_id;
    const isBrand = user?.id === collab.brand_id;
    const brandFilms = isBrandFilms(collab);

    return (
      <Card key={collab.id} className="glass overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {collab.offer?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isCreator
                  ? `Marque: ${collab.brand?.company_name || "N/A"}`
                  : `Créateur: ${collab.creator?.full_name || "N/A"}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getStatusBadge(collab.status)}
              {brandFilms && (
                <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500">
                  <Camera className="w-3 h-3 mr-1" />
                  Marque filme
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gold">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">
                {formatCurrency(isCreator ? collab.creator_amount : collab.agreed_amount)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(deadline, "dd MMM yyyy", { locale: fr })}</span>
            </div>
          </div>

          {/* Selected slot for on-site collaborations */}
          {collab.selected_slot && collab.offer?.presence_mode === "on_site" && (
            <div className="flex items-center gap-2 rounded-lg p-2 bg-blue-500/10 text-sm">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-blue-500 font-medium">
                {format(parseISO(collab.selected_slot.date), "EEE dd MMM", { locale: fr })} — {collab.selected_slot.start_time} - {collab.selected_slot.end_time}
              </span>
            </div>
          )}

          {/* Creative Brief - show for active collabs */}
          {collab.offer?.creative_brief && isCreator && 
           ["in_progress", "revision_requested", "pending_publication"].includes(collab.status) && (
            <CreativeBriefDisplay brief={collab.offer.creative_brief} compact />
          )}

          {collab.status === "in_progress" && !isExpired && !brandFilms && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Temps restant :</span>
              <CountdownTimer deadline={collab.deadline} />
            </div>
          )}

          {collab.status === "in_progress" && isCreator && isExpired && !brandFilms && (
            <div className="rounded-lg p-2 text-xs bg-destructive/10 text-destructive">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Deadline dépassée !
              </span>
            </div>
          )}

          {/* ── BRAND FILMS MODE: Brand side ── */}
          {brandFilms && collab.status === "in_progress" && isBrand && (
            <div className="space-y-3">
              <div className="rounded-xl p-3 bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <Camera className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-500 mb-1">Vous filmez le contenu</p>
                    <p className="text-xs text-muted-foreground">
                      Après le tournage en magasin, soumettez le contenu pour validation par le créateur.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={() => handleAction(collab, "brand_submit")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Soumettre le contenu filmé
              </Button>
            </div>
          )}

          {/* BRAND FILMS MODE: Creator waiting for brand to film */}
          {brandFilms && collab.status === "in_progress" && isCreator && (
            <div className="flex items-center gap-2 text-blue-500 text-sm">
              <Camera className="w-4 h-4" />
              En attente du contenu filmé par la marque
            </div>
          )}

          {/* BRAND FILMS MODE: Content submitted — creator reviews */}
          {brandFilms && collab.status === "content_submitted" && isCreator && (
            <div className="space-y-3">
              {/* Auto-approve countdown */}
              {collab.auto_approve_at && (
                <div className="rounded-xl p-3 bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-500 mb-1">Validation automatique</p>
                      <p className="text-xs text-muted-foreground">
                        Sans action de votre part, le contenu sera validé automatiquement le{" "}
                        {format(parseISO(collab.auto_approve_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show content preview */}
              {collab.content_url && (
                <div className="space-y-2">
                  {(() => {
                    let urls: string[] = [];
                    try {
                      const parsed = JSON.parse(collab.content_url);
                      urls = Array.isArray(parsed) ? parsed : [collab.content_url];
                    } catch {
                      urls = [collab.content_url];
                    }
                    return urls.map((url, i) => {
                      const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url) || url.includes("/collaboration-content/");
                      if (isVideo) {
                        return (
                          <div key={i} className="rounded-xl overflow-hidden bg-black">
                            <video src={url} className="w-full h-40 object-contain" controls preload="metadata" />
                          </div>
                        );
                      }
                      return (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-muted/50 transition-colors">
                          <ExternalLink className="w-5 h-5 text-gold flex-shrink-0" />
                          <span className="flex-1 text-foreground truncate text-sm">{url}</span>
                        </a>
                      );
                    });
                  })()}
                </div>
              )}

              {collab.content_description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{collab.content_description}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-500/10"
                  onClick={() => {
                    const fb = prompt("Décrivez les modifications souhaitées :");
                    if (fb && fb.trim()) {
                      handleCreatorRequestRevision(collab.id, fb.trim());
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCreatorApprove(collab.id)}
                  disabled={creatorApprovingIds.has(collab.id)}
                >
                  {creatorApprovingIds.has(collab.id) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Valider
                </Button>
              </div>
            </div>
          )}

          {/* BRAND FILMS MODE: Brand waiting for creator validation */}
          {brandFilms && collab.status === "content_submitted" && isBrand && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-500 text-sm">
                <Clock className="w-4 h-4" />
                En attente de validation par le créateur (48h)
              </div>
              {collab.auto_approve_at && (
                <p className="text-xs text-muted-foreground">
                  Auto-validation le {format(parseISO(collab.auto_approve_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
              )}
            </div>
          )}

          {/* BRAND FILMS: Revision requested — brand must resubmit */}
          {brandFilms && collab.status === "revision_requested" && isBrand && (
            <div className="space-y-3">
              <div className="rounded-xl p-3 bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-500 mb-1">Modification demandée par le créateur</p>
                    <p className="text-sm text-foreground">{collab.brand_feedback}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={() => handleAction(collab, "brand_submit")}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resoumettre le contenu
              </Button>
            </div>
          )}

          {/* BRAND FILMS: Revision requested — creator sees status */}
          {brandFilms && collab.status === "revision_requested" && isCreator && (
            <div className="flex items-center gap-2 text-orange-500 text-sm">
              <RefreshCw className="w-4 h-4" />
              Modification demandée — en attente du nouveau contenu
            </div>
          )}

          {/* ── STANDARD MODE (creator films): existing flow ── */}
          {/* Refused status message */}
          {collab.status === "refused" && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <XCircle className="w-4 h-4" />
              Proposition déclinée
            </div>
          )}

          {/* Standard: Revision requested - show feedback from brand */}
          {!brandFilms && collab.status === "revision_requested" && isCreator && (
            <div className="space-y-3">
              <div className="rounded-xl p-3 bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-500 mb-1">Modification demandée</p>
                    <p className="text-sm text-foreground">{collab.brand_feedback}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={() => handleAction(collab)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resoumettre le contenu
              </Button>
            </div>
          )}

          {!brandFilms && collab.status === "in_progress" && isCreator && !isExpired && (
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              onClick={() => handleAction(collab)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Soumettre le contenu
            </Button>
          )}

          {!brandFilms && collab.status === "content_submitted" && isBrand && (
            <div className="space-y-3">
              {collab.content_url && (
                <>
                  {!collab.preview_viewed_at ? (
                    <div className="space-y-2">
                      <WatermarkOverlay locked={true}>
                        <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                          {(() => {
                            let previewUrl = "";
                            try {
                              const urls = JSON.parse(collab.content_url!);
                              previewUrl = Array.isArray(urls) ? urls[0] : collab.content_url!;
                            } catch {
                              previewUrl = collab.content_url!;
                            }
                            const isVideo = /\.(mp4|mov|webm|avi)$/i.test(previewUrl) || previewUrl.includes("/collaboration-content/");
                            if (isVideo) {
                              return <video src={previewUrl} className="w-full h-full object-cover" muted playsInline />;
                            }
                            return <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />;
                          })()}
                        </div>
                      </WatermarkOverlay>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                        onClick={() => setPreviewCollab(collab)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visionner une fois (aperçu unique)
                      </Button>
                    </div>
                  ) : (
                    <WatermarkOverlay locked={true}>
                      <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {(() => {
                          let previewUrl = "";
                          try {
                            const urls = JSON.parse(collab.content_url!);
                            previewUrl = Array.isArray(urls) ? urls[0] : collab.content_url!;
                          } catch {
                            previewUrl = collab.content_url!;
                          }
                          const isVideo = /\.(mp4|mov|webm|avi)$/i.test(previewUrl) || previewUrl.includes("/collaboration-content/");
                          if (isVideo) {
                            return <video src={previewUrl} className="w-full h-full object-cover pointer-events-none" muted playsInline />;
                          }
                          return <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover pointer-events-none" />;
                        })()}
                      </div>
                    </WatermarkOverlay>
                  )}
                </>
              )}
              {collab.content_description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{collab.content_description}</p>
              )}
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={() => handleAction(collab)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payer pour débloquer le contenu
              </Button>
            </div>
          )}

          {!brandFilms && collab.status === "content_submitted" && isCreator && (
            <div className="flex items-center gap-2 text-purple-500 text-sm">
              <Lock className="w-4 h-4" />
              Contenu soumis — en attente du paiement de la marque
            </div>
          )}

          {collab.status === "in_review" && isBrand && (
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              onClick={() => handleAction(collab)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Valider le contenu
            </Button>
          )}

          {collab.status === "in_review" && isCreator && (
            <div className="flex items-center gap-2 text-cyan-500 text-sm">
              <Eye className="w-4 h-4" />
              La marque examine votre contenu
            </div>
          )}

          {/* Network mode: pending_publication - creator needs to publish */}
          {collab.status === "pending_publication" && isCreator && (
            <div className="space-y-3">
              <div className="rounded-xl p-3 bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-indigo-500 mb-1">Aperçu validé ✅</p>
                    <p className="text-sm text-muted-foreground">Publiez maintenant le contenu sur vos réseaux et soumettez le lien.</p>
                  </div>
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={() => handleAction(collab, "publication_link")}
              >
                <Globe className="w-4 h-4 mr-2" />
                Soumettre le lien de publication
              </Button>
            </div>
          )}

          {collab.status === "pending_publication" && isBrand && (
            <div className="flex items-center gap-2 text-indigo-500 text-sm">
              <Globe className="w-4 h-4" />
              En attente de publication par le créateur
            </div>
          )}

          {/* Network mode: publication_submitted - brand needs to verify link */}
          {collab.status === "publication_submitted" && isBrand && (
            <div className="space-y-3">
              {(collab as any).publication_url && (
                <a
                  href={(collab as any).publication_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="flex-1 text-foreground truncate text-sm">{(collab as any).publication_url}</span>
                  <Badge variant="secondary" className="text-xs">Voir le post</Badge>
                </a>
              )}

              {/* AI Verification */}
              {!verificationResults[collab.id] && !verifyingIds.has(collab.id) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10"
                  onClick={async () => {
                    setVerifyingIds(prev => new Set(prev).add(collab.id));
                    try {
                      const result = await verifyPublicationLink(collab.id);
                      setVerificationResults(prev => ({ ...prev, [collab.id]: result }));
                    } catch (e) {
                      setVerificationResults(prev => ({ ...prev, [collab.id]: { valid: false, reason: "Erreur lors de la vérification IA.", confidence: 0 } }));
                    } finally {
                      setVerifyingIds(prev => { const s = new Set(prev); s.delete(collab.id); return s; });
                    }
                  }}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Vérifier le lien par IA
                </Button>
              )}

              {verifyingIds.has(collab.id) && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-500/10 text-indigo-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse IA en cours...
                </div>
              )}

              {verificationResults[collab.id] && (
                <div className={`rounded-xl p-3 border text-sm space-y-1 ${
                  verificationResults[collab.id].valid
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-orange-500/10 border-orange-500/20"
                }`}>
                  <div className="flex items-center gap-2 font-medium">
                    {verificationResults[collab.id].valid ? (
                      <><ShieldCheck className="w-4 h-4 text-green-500" /> <span className="text-green-500">Lien validé par IA</span></>
                    ) : (
                      <><AlertTriangle className="w-4 h-4 text-orange-500" /> <span className="text-orange-500">Lien non validé</span></>
                    )}
                    {verificationResults[collab.id].confidence > 0 && (
                      <Badge variant="secondary" className="text-[10px] ml-auto">
                        {verificationResults[collab.id].confidence}% confiance
                      </Badge>
                    )}
                  </div>
                  {verificationResults[collab.id].platform && (
                    <p className="text-muted-foreground text-xs">Plateforme : {verificationResults[collab.id].platform}</p>
                  )}
                  <p className="text-muted-foreground text-xs">{verificationResults[collab.id].reason}</p>
                  {verificationResults[collab.id].warnings?.length > 0 && (
                    <ul className="text-xs text-orange-500 list-disc list-inside">
                      {verificationResults[collab.id].warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    await approvePublication(collab.id);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer la publication et payer
              </Button>
            </div>
          )}

          {collab.status === "publication_submitted" && isCreator && (
            <div className="flex items-center gap-2 text-teal-500 text-sm">
              <Globe className="w-4 h-4" />
              Lien soumis — en attente de vérification
            </div>
          )}

          {collab.status === "completed" && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              Collaboration terminée
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {/* Wallet shortcut for creators */}
      {userRole === "creator" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Button
            variant="outline"
            className="w-full glass border-gold/30 hover:bg-gold/10"
            onClick={() => navigate("/creator/wallet")}
          >
            <Wallet className="w-4 h-4 mr-2 text-gold" />
            Accéder à mon portefeuille
          </Button>
        </motion.div>
      )}

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            En cours ({activeCollabs.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Terminées ({completedCollabs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {loading ? (
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : activeCollabs.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Aucune collaboration en cours
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Les collaborations acceptées apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeCollabs.map(renderCollabCard)
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="completed">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {completedCollabs.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Aucune collaboration terminée
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedCollabs.map(renderCollabCard)
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Sheets */}
      {selectedCollab && sheetType === "submit" && (
        <SubmitContentSheet
          open={true}
          onOpenChange={() => { setSelectedCollab(null); setSheetType(null); }}
          collaboration={selectedCollab}
          onSuccess={refreshCollaborations}
        />
      )}

      {selectedCollab && sheetType === "payment" && (
        <InAppPaymentSheet
          open={true}
          onOpenChange={() => { setSelectedCollab(null); setSheetType(null); }}
          collaboration={selectedCollab}
          onSuccess={refreshCollaborations}
        />
      )}

      {selectedCollab && sheetType === "review" && (
        <ReviewContentSheet
          open={true}
          onOpenChange={() => { setSelectedCollab(null); setSheetType(null); }}
          collaboration={selectedCollab}
          onSuccess={refreshCollaborations}
        />
      )}

      {selectedCollab && sheetType === "brand_submit" && (
        <BrandSubmitContentSheet
          open={true}
          onOpenChange={() => { setSelectedCollab(null); setSheetType(null); }}
          collaboration={selectedCollab}
          onSuccess={refreshCollaborations}
        />
      )}

      {selectedCollab && sheetType === "publication_link" && (
        <SubmitContentSheet
          open={true}
          onOpenChange={() => { setSelectedCollab(null); setSheetType(null); }}
          collaboration={selectedCollab}
          onSuccess={refreshCollaborations}
          mode="publication_link"
        />
      )}

      {previewCollab && (
        <ContentPreviewSheet
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setPreviewCollab(null);
          }}
          collaboration={previewCollab}
          onViewed={() => {
            setPreviewCollab(prev => prev ? { ...prev, preview_viewed_at: new Date().toISOString() } as any : null);
            refreshCollaborations();
          }}
        />
      )}
    </div>
  );
};

export default CollaborationsTab;
