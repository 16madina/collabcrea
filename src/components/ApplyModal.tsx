import { useState } from "react";
import { motion } from "framer-motion";
import { Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { applyToOffer } from "@/lib/applications";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ApplyModalProps {
  offer: {
    id: string;
    brand: string;
    brandId: string;
    title: string;
    budget: string;
  };
  onClose: () => void;
}

const ApplyModal = ({ offer, onClose }: ApplyModalProps) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApply = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour postuler");
      navigate("/auth?role=creator");
      return;
    }

    if (role !== "creator") {
      toast.error("Seuls les créateurs peuvent postuler aux offres");
      return;
    }

    setIsSubmitting(true);

    const { conversationId, error } = await applyToOffer({
      offerId: offer.id,
      creatorId: user.id,
      brandId: offer.brandId,
      offerTitle: offer.title,
      message: message.trim() || undefined,
    });

    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("déjà postulé")) {
        toast.info("Vous avez déjà postulé à cette offre", {
          action: conversationId
            ? {
                label: "Voir conversation",
                onClick: () => navigate("/messages"),
              }
            : undefined,
        });
      } else {
        toast.error("Erreur lors de la candidature");
      }
      onClose();
      return;
    }

    toast.success("Candidature envoyée avec succès !", {
      description: "La marque a été notifiée de votre intérêt.",
      action: {
        label: "Voir conversation",
        onClick: () => navigate("/messages"),
      },
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md glass-card rounded-t-3xl sm:rounded-2xl p-6 safe-bottom"
      >
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6 sm:hidden" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-gold-gradient">
              Postuler à l'offre
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{offer.title}</p>
          </div>
          <button onClick={onClose} className="touch-target">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <div className="glass p-4 rounded-xl mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Marque</span>
            <span className="font-medium text-gold">{offer.brand}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="font-medium text-foreground">{offer.budget}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-2 block">
            Message de candidature (optionnel)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Présentez-vous et expliquez pourquoi vous êtes le bon créateur pour cette collaboration..."
            className="min-h-[100px] bg-muted/50 border-border focus:border-gold rounded-xl resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="glass" size="lg" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="gold"
            size="lg"
            className="flex-1"
            onClick={handleApply}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Postuler
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ApplyModal;
