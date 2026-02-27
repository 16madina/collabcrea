import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield, Phone, ChevronLeft, ExternalLink } from "lucide-react";
import { Collaboration } from "@/hooks/useCollaborations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InAppPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration;
  onSuccess?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const InAppPaymentSheet = ({
  open,
  onOpenChange,
  collaboration,
  onSuccess,
}: InAppPaymentSheetProps) => {
  const [loading, setLoading] = useState(false);

  const handleFincraCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fincra-checkout", {
        body: { collaborationId: collaboration.id },
      });

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Erreur lors de la création du paiement");
        return;
      }

      if (data?.error) {
        console.error("Checkout error:", data.error);
        toast.error(data.error);
        return;
      }

      if (data?.url) {
        // Redirect to Fincra checkout
        window.location.href = data.url;
      } else {
        toast.error("URL de paiement non reçue");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <div>
            <SheetTitle className="text-xl font-display flex items-center gap-2">
              <Lock className="w-6 h-6 text-gold" />
              Débloquer le contenu
            </SheetTitle>
            <SheetDescription>
              Payez via Mobile Money pour accéder au contenu original du créateur
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {/* Collaboration Summary */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  {collaboration.offer?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Créateur: {collaboration.creator?.full_name}
                </p>
              </div>
              <Badge variant="outline" className="border-gold text-gold">
                En attente
              </Badge>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Montant de la collaboration</span>
              <span className="font-semibold">{formatCurrency(collaboration.agreed_amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Total à payer</span>
              <span className="text-xl font-bold text-gold">
                {formatCurrency(collaboration.agreed_amount)}
              </span>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Paiement sécurisé via Fincra</p>
                <p className="text-muted-foreground text-xs">
                  En payant, vous débloquez le contenu original du créateur. Vous pourrez ensuite l'approuver ou demander des modifications.
                </p>
              </div>
            </div>
          </div>

          {/* Payment methods info */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Méthodes de paiement acceptées</p>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Mobile Money</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-orange-500/20 text-orange-400 border-orange-500/30">
                      Orange Money
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-500/20 text-blue-400 border-blue-500/30">
                      Wave
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      MTN Money
                    </span>
                  </div>
                </div>
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
            onClick={handleFincraCheckout}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="w-5 h-5 mr-2" />
            )}
            Payer {formatCurrency(collaboration.agreed_amount)}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Vous serez redirigé vers la page de paiement sécurisée Fincra
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InAppPaymentSheet;
