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
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield, CreditCard, Phone, ChevronLeft } from "lucide-react";
import { Collaboration } from "@/hooks/useCollaborations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StripePaymentForm from "./StripePaymentForm";
import MobileMoneyForm from "./MobileMoneyForm";

interface InAppPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration;
  onSuccess?: () => void;
}

type PaymentMethod = "card" | "orange_money" | "wave" | null;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const paymentMethods = [
  {
    id: "card" as const,
    name: "Carte bancaire",
    description: "Visa, Mastercard, etc.",
    icon: CreditCard,
    color: "text-gold",
    bgColor: "bg-gold/10",
  },
  {
    id: "orange_money" as const,
    name: "Orange Money",
    description: "Paiement mobile Orange",
    icon: Phone,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "wave" as const,
    name: "Wave",
    description: "Paiement mobile Wave",
    icon: Phone,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

const InAppPaymentSheet = ({
  open,
  onOpenChange,
  collaboration,
  onSuccess,
}: InAppPaymentSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset state when sheet closes
      setSelectedMethod(null);
      setClientSecret(null);
      setPaymentIntentId(null);
    }
  }, [open]);

  const initializeStripePayment = async () => {
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

  const handleMethodSelect = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === "card") {
      await initializeStripePayment();
    }
  };

  const handleSuccess = () => {
    setSelectedMethod(null);
    setClientSecret(null);
    setPaymentIntentId(null);
    onOpenChange(false);
    onSuccess?.();
  };

  const handleBack = () => {
    setSelectedMethod(null);
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  const handleCancel = () => {
    setSelectedMethod(null);
    setClientSecret(null);
    setPaymentIntentId(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-2">
            {selectedMethod && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBack}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <SheetTitle className="text-xl font-display flex items-center gap-2">
                <Lock className="w-6 h-6 text-gold" />
                {selectedMethod ? "Paiement sécurisé" : "Débloquer le contenu"}
              </SheetTitle>
              <SheetDescription>
                {selectedMethod 
                  ? "Payez pour accéder au contenu original du créateur"
                  : "Payez pour voir le contenu sans filigrane et le valider"
                }
              </SheetDescription>
            </div>
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

          {/* Payment Method Selection or Form */}
          {!selectedMethod ? (
            <>
              {/* Security Info */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Paiement sécurisé</p>
                    <p className="text-muted-foreground text-xs">
                      En payant, vous débloquez le contenu original du créateur. Vous pourrez ensuite l'approuver ou demander des modifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Méthodes de paiement</p>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className="w-full flex items-center gap-4 p-4 glass rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className={`w-12 h-12 rounded-full ${method.bgColor} flex items-center justify-center`}>
                      <method.icon className={`w-6 h-6 ${method.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                  </button>
                ))}
              </div>
            </>
          ) : selectedMethod === "card" ? (
            <>
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
            </>
          ) : (
            <>
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

              {/* Mobile Money Form */}
              <MobileMoneyForm
                collaborationId={collaboration.id}
                amount={collaboration.agreed_amount}
                provider={selectedMethod}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InAppPaymentSheet;
