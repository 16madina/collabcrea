import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Calendar, CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import InAppPaymentSheet from "@/components/collaboration/InAppPaymentSheet";
import { Collaboration } from "@/hooks/useCollaborations";

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
}

interface CollaborationData {
  id: string;
  status: string;
  agreed_amount: number;
  creator_amount: number;
  platform_fee: number;
  creator_id: string;
  brand_id: string;
  deadline: string;
  offer_id: string;
  conversation_id: string | null;
}

interface ProposalStatusCardProps {
  offerId: string;
  conversationId: string;
  onPaymentSuccess?: () => void;
}

type ProposalStatus = "pending" | "accepted" | "refused";

const ProposalStatusCard = ({ offerId, conversationId, onPaymentSuccess }: ProposalStatusCardProps) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [collaboration, setCollaboration] = useState<CollaborationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>("pending");
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch offer
        const { data: offerData, error: offerError } = await supabase
          .from("offers")
          .select("*")
          .eq("id", offerId)
          .single();

        if (offerError) throw offerError;
        setOffer(offerData);

        // Check if there's a collaboration for this offer via conversation_id
        const { data: collabData } = await supabase
          .from("collaborations")
          .select("id, status, agreed_amount, creator_amount, platform_fee, creator_id, brand_id, deadline, offer_id, conversation_id")
          .eq("conversation_id", conversationId)
          .maybeSingle();

        if (collabData) {
          setCollaboration(collabData);
          if (collabData.status === "refused") {
            setProposalStatus("refused");
          } else {
            setProposalStatus("accepted");
          }
        }
      } catch (err) {
        console.error("Error fetching proposal status:", err);
      } finally {
        setLoading(false);
      }
    };

    if (offerId) {
      fetchData();
    }
  }, [offerId, conversationId]);

  // Set up real-time subscription for collaboration changes
  useEffect(() => {
    const channel = supabase
      .channel(`collab-status-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaborations',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new) {
            const newCollab = payload.new as CollaborationData;
            setCollaboration(newCollab);
            if (newCollab.status === "refused") {
              setProposalStatus("refused");
            } else {
              setProposalStatus("accepted");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

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

  const getStatusDisplay = () => {
    switch (proposalStatus) {
      case "accepted":
        if (collaboration?.status === "pending_payment") {
          return {
            icon: CreditCard,
            text: "Acceptée - En attente de paiement",
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            showPayButton: true,
          };
        }
        return {
          icon: CheckCircle,
          text: "Proposition acceptée",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          showPayButton: false,
        };
      case "refused":
        return {
          icon: XCircle,
          text: "Proposition refusée",
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          showPayButton: false,
        };
      default:
        return {
          icon: Clock,
          text: "En attente de réponse",
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
          showPayButton: false,
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  // Build collaboration object for PaymentSheet
  const collaborationForPayment: Collaboration | null = collaboration ? {
    id: collaboration.id,
    status: collaboration.status,
    agreed_amount: collaboration.agreed_amount,
    creator_amount: collaboration.creator_amount,
    platform_fee: collaboration.platform_fee,
    creator_id: collaboration.creator_id,
    brand_id: collaboration.brand_id,
    deadline: collaboration.deadline,
    offer_id: collaboration.offer_id,
    conversation_id: collaboration.conversation_id,
    content_submitted_at: null,
    approved_at: null,
    auto_approve_at: null,
    content_url: null,
    content_description: null,
    brand_feedback: null,
    offer: offer ? {
      id: offer.id,
      title: offer.title,
      category: offer.category,
      content_type: offer.content_type,
      logo_url: offer.logo_url,
    } : undefined,
    creator: undefined,
    brand: undefined,
    created_at: '',
    updated_at: '',
  } : null;

  const handlePaymentSuccess = () => {
    setShowPaymentSheet(false);
    onPaymentSuccess?.();
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
              {collaboration?.agreed_amount 
                ? `${collaboration.agreed_amount.toLocaleString()} FCFA` 
                : formatBudget(offer.budget_min, offer.budget_max)}
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

        {/* Status Display */}
        <div className={`flex items-center gap-2 mt-4 p-3 rounded-lg ${statusDisplay.bgColor}`}>
          <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
          <span className={`font-medium ${statusDisplay.color}`}>{statusDisplay.text}</span>
        </div>

        {/* Payment Button for accepted proposals pending payment */}
        {statusDisplay.showPayButton && collaboration && (
          <Button
            variant="gold"
            size="sm"
            className="w-full mt-3"
            onClick={() => setShowPaymentSheet(true)}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Effectuer le paiement
          </Button>
        )}
      </motion.div>

      {/* Payment Sheet */}
      {collaborationForPayment && (
        <InAppPaymentSheet
          open={showPaymentSheet}
          onOpenChange={setShowPaymentSheet}
          collaboration={collaborationForPayment}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default ProposalStatusCard;