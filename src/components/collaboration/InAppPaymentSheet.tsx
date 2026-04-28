import { useState } from "react";
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
import { Loader2, Lock, Shield, ExternalLink, CreditCard } from "lucide-react";
import { Collaboration } from "@/hooks/useCollaborations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InAppPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration;
  onSuccess?: () => void;
}

const formatFCFA = (amount: number) =>
  new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";

const InAppPaymentSheet = ({
  open,
  onOpenChange,
  collaboration,
}: InAppPaymentSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<"eur" | "usd">("eur");

  const amountFCFA = collaboration.agreed_amount;

  // Approximate display conversion (real conversion happens server-side)
  const approxAmount =
    currency === "eur"
      ? (amountFCFA / 655.957) * 1.05
      : (amountFCFA / 600) * 1.05;
  const formattedApprox = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(approxAmount);

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-collab-checkout", {
        body: { collaborationId: collaboration.id, currency },
      });

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Erreur lors de la création du paiement");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.url) {
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
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <Lock className="w-6 h-6 text-gold" />
            Paiement de la collaboration
          </SheetTitle>
          <SheetDescription>
            Payez de manière sécurisée par carte bancaire via Stripe
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
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

          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Montant convenu</span>
              <span className="font-semibold">{formatFCFA(amountFCFA)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">À payer (approx.)</span>
              <div className="text-right">
                <span className="text-xl font-bold text-gold">
                  {formattedApprox}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Conversion + frais inclus
                </p>
              </div>
            </div>
          </div>

          {/* Currency selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Devise de paiement</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCurrency("eur")}
                className={`glass rounded-xl p-3 border-2 transition-all ${
                  currency === "eur"
                    ? "border-gold bg-gold/10"
                    : "border-transparent"
                }`}
              >
                <p className="font-semibold">🇪🇺 EUR</p>
                <p className="text-[10px] text-muted-foreground">Euro</p>
              </button>
              <button
                onClick={() => setCurrency("usd")}
                className={`glass rounded-xl p-3 border-2 transition-all ${
                  currency === "usd"
                    ? "border-gold bg-gold/10"
                    : "border-transparent"
                }`}
              >
                <p className="font-semibold">🇺🇸 USD</p>
                <p className="text-[10px] text-muted-foreground">US Dollar</p>
              </button>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">
                  Paiement sécurisé via Stripe
                </p>
                <p className="text-muted-foreground text-xs">
                  Les fonds sont mis en séquestre. Le créateur sera payé après que
                  vous validiez son travail.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Méthodes de paiement acceptées
            </p>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">
                    Carte bancaire
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visa • Mastercard • Apple Pay • Google Pay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleStripeCheckout}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="w-5 h-5 mr-2" />
            )}
            Payer {formattedApprox}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Paiement sécurisé via Stripe
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InAppPaymentSheet;
