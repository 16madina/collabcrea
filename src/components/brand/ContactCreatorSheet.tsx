import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, DollarSign, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Offer {
  id: string;
  title: string;
  budget_min: number;
  budget_max: number;
  category: string;
  status: string;
}

interface ContactCreatorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
}

const ContactCreatorSheet = ({
  open,
  onOpenChange,
  creatorId,
  creatorName,
}: ContactCreatorSheetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingOffers, setFetchingOffers] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchOffers();
    }
  }, [open, user]);

  const fetchOffers = async () => {
    if (!user) return;
    
    setFetchingOffers(true);
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("id, title, budget_min, budget_max, category, status")
        .eq("brand_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
      
      // Pre-select first offer if available
      if (data && data.length > 0) {
        setSelectedOfferId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setFetchingOffers(false);
    }
  };

  const formatBudget = (min: number, max: number) => {
    const format = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${Math.round(n / 1000)}K`;
      return n.toString();
    };
    if (min === max) return `${format(min)} FCFA`;
    return `${format(min)} - ${format(max)} FCFA`;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté");
      navigate("/auth?role=brand");
      return;
    }

    if (!selectedOfferId) {
      toast.error("Veuillez sélectionner une offre");
      return;
    }

    setLoading(true);

    try {
      // Get offer details for conversation subject
      const selectedOffer = offers.find(o => o.id === selectedOfferId);

      // Check if conversation already exists for this offer + creator
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("offer_id", selectedOfferId)
        .eq("created_by", user.id);

      if (existingConv && existingConv.length > 0) {
        // Check if creator is participant
        const { data: creatorParticipant } = await supabase
          .from("conversation_participants")
          .select("id")
          .eq("conversation_id", existingConv[0].id)
          .eq("user_id", creatorId)
          .maybeSingle();

        if (creatorParticipant) {
          toast.info("Vous avez déjà proposé cette offre à ce créateur");
          onOpenChange(false);
          navigate("/brand/collabs?tab=messages");
          return;
        }
      }

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          created_by: user.id,
          offer_id: selectedOfferId,
          subject: `Proposition: ${selectedOffer?.title || "Nouvelle offre"}`,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: creatorId },
        ]);

      if (partError) throw partError;

      // Send initial message with offer proposal
      const proposalMessage = message.trim() 
        ? `📢 Proposition d'offre: ${selectedOffer?.title}\n💰 Budget: ${formatBudget(selectedOffer?.budget_min || 0, selectedOffer?.budget_max || 0)}\n\n${message}`
        : `📢 Proposition d'offre: ${selectedOffer?.title}\n💰 Budget: ${formatBudget(selectedOffer?.budget_min || 0, selectedOffer?.budget_max || 0)}\n\nBonjour ${creatorName}, je vous propose cette collaboration. N'hésitez pas à me contacter pour en discuter !`;

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: proposalMessage,
      });

      // Create notification for the creator
      await supabase.from("notifications").insert({
        user_id: creatorId,
        title: "Nouvelle proposition",
        message: `Vous avez reçu une proposition pour "${selectedOffer?.title}"`,
        type: "proposal",
        created_by: user.id,
      });

      toast.success("Proposition envoyée !");
      onOpenChange(false);
      setMessage("");
      setSelectedOfferId(null);
      navigate("/brand/collabs?tab=messages");
    } catch (error: any) {
      console.error("Error contacting creator:", error);
      toast.error("Erreur lors de l'envoi de la proposition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-display">
            Contacter {creatorName}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Offer Selection */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gold" />
              Sélectionnez une offre à proposer
            </h3>

            {fetchingOffers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
              </div>
            ) : offers.length === 0 ? (
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-muted-foreground text-sm mb-3">
                  Vous n'avez pas d'offres actives
                </p>
                <Button
                  variant="gold-outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/brand/offers");
                  }}
                >
                  Créer une offre
                </Button>
              </div>
            ) : (
              <RadioGroup
                value={selectedOfferId || ""}
                onValueChange={setSelectedOfferId}
                className="space-y-3"
              >
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className={`glass rounded-xl p-4 cursor-pointer transition-all ${
                      selectedOfferId === offer.id
                        ? "ring-2 ring-gold bg-gold/5"
                        : "hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedOfferId(offer.id)}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={offer.id} id={offer.id} className="mt-1" />
                      <Label htmlFor={offer.id} className="flex-1 cursor-pointer">
                        <p className="font-semibold text-foreground">{offer.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                            {offer.category}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-gold">
                            <DollarSign className="w-3 h-3" />
                            {formatBudget(offer.budget_min, offer.budget_max)}
                          </span>
                        </div>
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          {/* Message */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              Message personnalisé (optionnel)
            </h3>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Bonjour ${creatorName}, je vous propose cette collaboration...`}
              className="min-h-[100px] bg-muted/30 border-border focus:border-gold"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || !selectedOfferId || offers.length === 0}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            Envoyer la proposition
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContactCreatorSheet;
