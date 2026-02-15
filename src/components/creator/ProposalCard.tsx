import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Calendar, Check, X, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useCollaborations } from "@/hooks/useCollaborations";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Offer {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  budget_min: number;
  budget_max: number;
  location: string | null;
  deadline: string | null;
  logo_url: string | null;
  images: string[] | null;
  brand_id: string;
}

interface ProposalCardProps {
  offerId: string;
  conversationId: string;
  onAccept?: () => void;
  onRefuse?: () => void;
}

type ProposalStatus = "pending" | "accepted" | "refused";

const ProposalCard = ({ offerId, conversationId, onAccept, onRefuse }: ProposalCardProps) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [responding, setResponding] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>("pending");
  const { createCollaboration } = useCollaborations();

  useEffect(() => {
    const fetchOfferAndStatus = async () => {
      try {
        // Fetch offer
        const { data: offerData, error: offerError } = await supabase
          .from("offers")
          .select("*, brand_id")
          .eq("id", offerId)
          .single();

        if (offerError) throw offerError;
        setOffer(offerData);

        // Check if there's already a collaboration for THIS SPECIFIC conversation
        // This allows multiple proposals for the same offer if previous ones are completed/refused
        const { data: existingCollab } = await supabase
          .from("collaborations")
          .select("id, status")
          .eq("conversation_id", conversationId)
          .maybeSingle();

        if (existingCollab) {
          if (existingCollab.status === "refused") {
            setProposalStatus("refused");
          } else {
            setProposalStatus("accepted");
          }
        }
      } catch (err) {
        console.error("Error fetching offer:", err);
      } finally {
        setLoading(false);
      }
    };

    if (offerId) {
      fetchOfferAndStatus();
    }
  }, [offerId]);

  // Determine correct creator and brand IDs based on the offer owner and conversation participants
  const getCollaborationRoles = async (currentUserId: string) => {
    if (currentUserId === offer?.brand_id) {
      // Current user is the brand, find the creator (other participant)
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", currentUserId);
      
      const creatorId = participants?.[0]?.user_id;
      if (!creatorId) throw new Error("Impossible de trouver le créateur");
      return { creatorId, brandId: currentUserId };
    } else {
      // Current user is the creator
      return { creatorId: currentUserId, brandId: offer!.brand_id };
    }
  };

  const handleAccept = async () => {
    if (!offer) return;
    
    setResponding(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { creatorId, brandId } = await getCollaborationRoles(userData.user.id);

      // Create a real collaboration with status "pending_payment"
      const agreedAmount = Math.round((offer.budget_min + offer.budget_max) / 2);
      const deadline = offer.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await createCollaboration(
        offer.id,
        creatorId,
        brandId,
        agreedAmount,
        deadline,
        conversationId
      );

      // Send acceptance message
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userData.user.id,
        content: "✅ J'accepte cette proposition ! La collaboration a été créée.",
      });

      setProposalStatus("accepted");
      toast.success("Proposition acceptée ! La collaboration a été créée.");
      onAccept?.();
    } catch (err) {
      console.error("Error accepting proposal:", err);
      toast.error("Erreur lors de l'acceptation");
    } finally {
      setResponding(false);
    }
  };

  const handleRefuse = async () => {
    if (!offer) return;
    
    setResponding(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { creatorId, brandId } = await getCollaborationRoles(userData.user.id);

      // Create a collaboration with "refused" status
      const { error } = await supabase.from("collaborations").insert({
        offer_id: offer.id,
        creator_id: creatorId,
        brand_id: brandId,
        conversation_id: conversationId,
        agreed_amount: 0,
        platform_fee: 0,
        creator_amount: 0,
        deadline: offer.deadline || new Date().toISOString().split('T')[0],
        status: "refused",
      });

      if (error) throw error;

      // Send refusal message
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userData.user.id,
        content: "❌ Je décline cette proposition pour le moment.",
      });

      setProposalStatus("refused");
      toast.success("Proposition refusée");
      onRefuse?.();
    } catch (err) {
      console.error("Error refusing proposal:", err);
      toast.error("Erreur lors du refus");
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!offer) return null;

  const formatBudget = (min: number, max: number) => {
    if (min === max) {
      return `${min.toLocaleString()} FCFA`;
    }
    return `${min.toLocaleString()} - ${max.toLocaleString()} FCFA`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 border-l-4 border-l-gold mb-4"
      >
        <div className="flex items-start gap-3">
          {offer.logo_url ? (
            <img
              src={offer.logo_url}
              alt="Logo"
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-gold" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{offer.title}</h4>
            <p className="text-sm text-gold font-medium">
              {formatBudget(offer.budget_min, offer.budget_max)}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {offer.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {offer.location}
                </span>
              )}
              {offer.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(offer.deadline), "dd MMM", { locale: fr })}
                </span>
              )}
            </div>
          </div>
        </div>

        {proposalStatus === "pending" && (
          <>
            <button
              onClick={() => setShowDetails(true)}
              className="flex items-center gap-1 text-sm text-gold mt-3 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Voir les détails de l'offre
            </button>

            <div className="flex gap-2 mt-4">
              <Button
                variant="gold"
                size="sm"
                onClick={handleAccept}
                disabled={responding}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                Accepter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefuse}
                disabled={responding}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Refuser
              </Button>
            </div>
          </>
        )}

        {proposalStatus === "accepted" && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-500 font-medium">Proposition acceptée</span>
          </div>
        )}

        {proposalStatus === "refused" && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-500/10 rounded-lg">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500 font-medium">Proposition refusée</span>
          </div>
        )}
      </motion.div>

      {/* Offer Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-gold-gradient">{offer.title}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            {/* Budget */}
            <div className="glass-card p-4">
              <h5 className="text-sm font-medium text-muted-foreground mb-1">Budget</h5>
              <p className="text-xl font-bold text-gold">
                {formatBudget(offer.budget_min, offer.budget_max)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-1">Catégorie</h5>
                <p className="text-foreground">{offer.category}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-1">Type de contenu</h5>
                <p className="text-foreground">{offer.content_type}</p>
              </div>

              {offer.location && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">Localisation</h5>
                  <p className="text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {offer.location}
                  </p>
                </div>
              )}

              {offer.deadline && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">Date limite</h5>
                  <p className="text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {format(new Date(offer.deadline), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Description</h5>
              <p className="text-foreground whitespace-pre-wrap">{offer.description}</p>
            </div>

            {/* Images */}
            {offer.images && offer.images.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Photos</h5>
                <div className="grid grid-cols-3 gap-2">
                  {offer.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      className="w-full aspect-square rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons - only show if pending */}
            {proposalStatus === "pending" && (
              <div className="flex gap-3 pt-4 pb-safe">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => {
                    setShowDetails(false);
                    handleAccept();
                  }}
                  disabled={responding}
                  className="flex-1"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Accepter
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowDetails(false);
                    handleRefuse();
                  }}
                  disabled={responding}
                  className="flex-1"
                >
                  <X className="w-5 h-5 mr-2" />
                  Refuser
                </Button>
              </div>
            )}

            {proposalStatus === "accepted" && (
              <div className="flex items-center gap-2 pt-4 pb-safe p-4 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-green-500 font-semibold">Proposition acceptée - En attente de paiement</span>
              </div>
            )}

            {proposalStatus === "refused" && (
              <div className="flex items-center gap-2 pt-4 pb-safe p-4 bg-red-500/10 rounded-lg">
                <XCircle className="w-6 h-6 text-red-500" />
                <span className="text-red-500 font-semibold">Proposition refusée</span>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ProposalCard;
