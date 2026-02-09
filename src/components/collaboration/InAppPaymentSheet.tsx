import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Shield } from "lucide-react";
import { Collaboration } from "@/hooks/useCollaborations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StripePaymentForm from "./StripePaymentForm";

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
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    if (open && !clientSecret) {
      initializePayment();
    }
  }, [open]);

  const initializePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { collaborationId: collaboration.id },
      });

      if (error) {
        console.error("Payment intent error:", error);
        toast.error("Erreur lors de l'initialisation du paiement");
        return;
      }

      if (data?.error) {
        console.error("Payment intent error:", data.error);
        toast.error(data.error);
        return;
      }

      if (data?.clientSecret && data?.publishableKey) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setStripePromise(loadStripe(data.publishableKey));
      } else {
        toast.error("Configuration de paiement incomplète");
      }
    } catch (err) {
      console.error("Init payment error:", err);
      toast.error("Erreur lors de l'initialisation");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setClientSecret(null);
    setPaymentIntentId(null);
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    setClientSecret(null);
    setPaymentIntentId(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <Lock className="w-6 h-6 text-gold" />
            Paiement sécurisé
          </SheetTitle>
          <SheetDescription>
            Payez en toute sécurité - L'argent sera en séquestre
          </SheetDescription>
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
                <p className="font-medium text-foreground mb-1">Paiement sécurisé</p>
                <p className="text-muted-foreground text-xs">
                  Votre argent est conservé en séquestre jusqu'à ce que le créateur livre le contenu et que vous l'approuviez.
                </p>
              </div>
            </div>
          </div>

          {/* Stripe Payment Form */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <span className="ml-3 text-muted-foreground">Chargement du paiement...</span>
            </div>
          ) : clientSecret && stripePromise && paymentIntentId ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#D4AF37",
                    colorBackground: "#1a1a2e",
                    colorText: "#ffffff",
                    colorDanger: "#ef4444",
                    fontFamily: "system-ui, sans-serif",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <StripePaymentForm
                paymentIntentId={paymentIntentId}
                amount={collaboration.agreed_amount}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Impossible de charger le formulaire de paiement</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InAppPaymentSheet;
