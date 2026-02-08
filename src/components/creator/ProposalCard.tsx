import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Calendar, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
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
}

interface ProposalCardProps {
  offerId: string;
  conversationId: string;
  onAccept?: () => void;
  onRefuse?: () => void;
}

const ProposalCard = ({ offerId, conversationId, onAccept, onRefuse }: ProposalCardProps) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const { data, error } = await supabase
          .from("offers")
          .select("*")
          .eq("id", offerId)
          .single();

        if (error) throw error;
        setOffer(data);
      } catch (err) {
        console.error("Error fetching offer:", err);
      } finally {
        setLoading(false);
      }
    };

    if (offerId) {
      fetchOffer();
    }
  }, [offerId]);

  const handleAccept = async () => {
    setResponding(true);
    try {
      // Send acceptance message
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        content: "✅ J'accepte cette proposition ! Discutons des détails.",
      });

      if (error) throw error;

      toast.success("Proposition acceptée !");
      onAccept?.();
    } catch (err) {
      console.error("Error accepting proposal:", err);
      toast.error("Erreur lors de l'acceptation");
    } finally {
      setResponding(false);
    }
  };

  const handleRefuse = async () => {
    setResponding(true);
    try {
      // Send refusal message
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        content: "❌ Je décline cette proposition pour le moment.",
      });

      if (error) throw error;

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

            {/* Action buttons */}
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ProposalCard;
