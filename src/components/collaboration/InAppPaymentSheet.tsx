import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Lock, Shield, CreditCard, AlertCircle, Check, ChevronRight } from "lucide-react";
import { Collaboration } from "@/hooks/useCollaborations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadStripe, Stripe as StripeJS } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import waveLogo from "@/assets/payment-wave.png";
import orangeLogo from "@/assets/payment-orange.png";
import djamoLogo from "@/assets/payment-djamo.png";

interface InAppPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: Collaboration;
  onSuccess?: () => void;
}

const formatFCFA = (amount: number) =>
  new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";

let stripePromiseCache: Promise<StripeJS | null> | null = null;
const getStripe = (): Promise<StripeJS | null> => {
  if (stripePromiseCache) return stripePromiseCache;
  stripePromiseCache = (async () => {
    const { data, error } = await supabase.functions.invoke("stripe-publishable-key");
    if (error || !data?.publishableKey) throw new Error("Stripe key unavailable");
    return loadStripe(data.publishableKey);
  })();
  return stripePromiseCache;
};

const PaymentForm = ({
  collaborationId,
  formattedApprox,
  onSuccess,
}: {
  collaborationId: string;
  formattedApprox: string;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast.error(submitError.message || "Erreur de validation");
      setSubmitting(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "Paiement échoué");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        const { data, error: verifyErr } = await supabase.functions.invoke(
          "stripe-collab-verify",
          { body: { paymentIntentId: paymentIntent.id, collaborationId } }
        );
        if (verifyErr) throw verifyErr;
        if (data?.verified) {
          if (data?.nextStatus === "in_progress") {
            toast.success("Paiement confirmé ! La collaboration est lancée.");
          } else {
            toast.success("Paiement confirmé ! Le contenu est en revue.");
          }
        } else {
          toast.success("Paiement reçu, vérification en cours...");
        }
        onSuccess();
      } catch (err) {
        console.error("Verify error:", err);
        toast.info("Paiement reçu, vérification en cours...");
        onSuccess();
      }
    } else {
      toast.info(`Statut: ${paymentIntent?.status || "inconnu"}`);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="glass rounded-xl p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      <Button
        type="submit"
        variant="gold"
        size="lg"
        className="w-full"
        disabled={!stripe || submitting}
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Lock className="w-5 h-5 mr-2" />
        )}
        Payer {formattedApprox}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Paiement sécurisé via Stripe • Vos données ne sont jamais stockées sur nos serveurs
      </p>
    </form>
  );
};

const InAppPaymentSheet = ({
  open,
  onOpenChange,
  collaboration,
  onSuccess,
}: InAppPaymentSheetProps) => {
  const [currency, setCurrency] = useState<"eur" | "usd">("eur");
  const [cardBrand, setCardBrand] = useState<"wave" | "orange" | "djamo" | "other" | null>(null);
  const [cardConfirmed, setCardConfirmed] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Promise<StripeJS | null> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardOptions = [
    { id: "wave" as const, label: "Wave Visa", logo: waveLogo },
    { id: "orange" as const, label: "Orange Visa", logo: orangeLogo },
    { id: "djamo" as const, label: "Djamo Visa", logo: djamoLogo },
    { id: "other" as const, label: "Autre carte", logo: null },
  ];
  const selectedCard = cardBrand ? cardOptions.find((c) => c.id === cardBrand) : null;

  const amountFCFA = collaboration.agreed_amount;
  const brandFeeFCFA = Math.round(amountFCFA * 0.10); // commission marque 10%
  const totalFCFA = amountFCFA + brandFeeFCFA;
  const approxAmount =
    currency === "eur"
      ? (totalFCFA / 655.957) * 1.05
      : (totalFCFA / 600) * 1.05;
  const formattedApprox = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(approxAmount);

  // Init Stripe + create PaymentIntent only after card brand confirmed
  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setCardConfirmed(false);
      setCardBrand(null);
      setCardError(null);
      return;
    }
    if (!cardConfirmed) {
      setClientSecret(null);
      return;
    }

    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setError(null);
      setClientSecret(null);
      try {
        const stripe = getStripe();
        if (cancelled) return;
        setStripeInstance(stripe);

        const { data, error: fnErr } = await supabase.functions.invoke(
          "stripe-collab-payment-intent",
          { body: { collaborationId: collaboration.id, currency } }
        );
        if (fnErr) throw fnErr;
        if (data?.error) throw new Error(data.error);
        if (!data?.clientSecret) throw new Error("Aucun clientSecret reçu");
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error("Init payment error:", err);
        if (!cancelled) setError(err?.message || "Erreur d'initialisation du paiement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [open, currency, collaboration.id, cardConfirmed]);

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "night" as const,
              variables: {
                colorPrimary: "hsl(38, 65%, 48%)",
                colorBackground: "hsl(270, 40%, 12%)",
                colorText: "hsl(0, 0%, 95%)",
                colorDanger: "hsl(0, 70%, 50%)",
                fontFamily: "system-ui, sans-serif",
                borderRadius: "12px",
              },
            },
          }
        : undefined,
    [clientSecret]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <Lock className="w-6 h-6 text-gold" />
            Paiement de la collaboration
          </SheetTitle>
          <SheetDescription>
            Saisissez votre carte bancaire pour payer en toute sécurité
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pb-12">
          {/* Recap */}
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
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Méthode</span>
              {selectedCard ? (
                <div className="flex items-center gap-2">
                  {selectedCard.logo ? (
                    <div className="h-6 w-10 rounded bg-white flex items-center justify-center p-0.5">
                      <img
                        src={selectedCard.logo}
                        alt={selectedCard.label}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <CreditCard className="h-4 w-4 text-gold" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {selectedCard.label}
                  </span>
                </div>
              ) : (
                <span className="text-xs italic text-muted-foreground">Non sélectionnée</span>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Montant convenu</span>
              <span className="font-semibold">{formatFCFA(amountFCFA)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">À payer</span>
              <div className="text-right">
                <span className="text-xl font-bold text-gold">{formattedApprox}</span>
                <p className="text-[10px] text-muted-foreground">
                  Conversion + frais inclus
                </p>
              </div>
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Devise de paiement</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setCurrency("eur"); setCardConfirmed(false); }}
                className={`glass rounded-xl p-3 border-2 transition-all ${
                  currency === "eur" ? "border-gold bg-gold/10" : "border-transparent"
                }`}
              >
                <p className="font-semibold">🇪🇺 EUR</p>
                <p className="text-[10px] text-muted-foreground">Euro</p>
              </button>
              <button
                type="button"
                onClick={() => { setCurrency("usd"); setCardConfirmed(false); }}
                className={`glass rounded-xl p-3 border-2 transition-all ${
                  currency === "usd" ? "border-gold bg-gold/10" : "border-transparent"
                }`}
              >
                <p className="font-semibold">🇺🇸 USD</p>
                <p className="text-[10px] text-muted-foreground">US Dollar</p>
              </button>
            </div>
          </div>

          {/* Card brand selector */}
          <div className={`glass rounded-xl p-4 space-y-3 border-2 transition-colors ${
            cardError ? "border-destructive/60" : "border-transparent"
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Choisissez votre carte <span className="text-destructive">*</span>
              </p>
              {cardConfirmed && cardBrand && (
                <span className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
                  <Check className="h-3 w-3" /> Confirmée
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cardOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCardBrand(opt.id);
                    setCardError(null);
                    setCardConfirmed(false);
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl p-3 border-2 transition-all ${
                    cardBrand === opt.id
                      ? "border-gold bg-gold/10 shadow-lg"
                      : "border-border/40 bg-background/40 hover:bg-background/60"
                  }`}
                >
                  {opt.logo ? (
                    <div className="h-14 w-full rounded-lg bg-white flex items-center justify-center p-2 overflow-hidden">
                      <img
                        src={opt.logo}
                        alt={opt.label}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-full rounded-lg bg-gold/10 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-gold" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-foreground text-center leading-tight">
                    {opt.label}
                  </p>
                </button>
              ))}
            </div>

            {cardError && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-2.5">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive font-medium">{cardError}</p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              Visa • Mastercard • Amex • Apple Pay • Google Pay
            </p>

            {!cardConfirmed && (
              <Button
                type="button"
                variant="gold"
                className="w-full"
                onClick={() => {
                  if (!cardBrand) {
                    setCardError("Veuillez sélectionner un type de carte avant de continuer.");
                    return;
                  }
                  setCardError(null);
                  setCardConfirmed(true);
                }}
              >
                Continuer vers le paiement
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Security badge */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Séquestre sécurisé</p>
                <p className="text-muted-foreground text-xs">
                  Les fonds sont conservés jusqu'à validation du travail.
                </p>
              </div>
            </div>
          </div>

          {/* Conversion breakdown */}
          {(() => {
            const baseConverted =
              currency === "eur" ? amountFCFA / 655.957 : amountFCFA / 600;
            const fees = approxAmount - baseConverted;
            const fmt = (v: number) =>
              new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: currency.toUpperCase(),
                maximumFractionDigits: 2,
              }).format(v);
            return (
              <div className="glass rounded-xl p-4 space-y-2 border border-gold/20">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Détail du montant
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Prix créateur</span>
                  <span className="font-semibold text-foreground">
                    {formatFCFA(amountFCFA)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Conversion → {currency.toUpperCase()}
                  </span>
                  <span className="text-foreground">{fmt(baseConverted)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Frais bancaires (5%)</span>
                  <span className="text-foreground">+ {fmt(fees)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total à payer</span>
                  <span className="text-lg font-bold text-gold">{formattedApprox}</span>
                </div>
              </div>
            );
          })()}

          {/* Card Element — gated by card brand confirmation */}
          {!cardConfirmed ? (
            <div className="glass rounded-xl p-6 border border-dashed border-border/40 text-center space-y-2">
              <Lock className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">
                Sélectionnez et confirmez votre carte
              </p>
              <p className="text-xs text-muted-foreground">
                L'écran de paiement sécurisé apparaîtra ici une fois votre choix confirmé.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" />
                <p className="text-sm font-medium text-foreground">Vos informations de paiement</p>
              </div>

              {loading && (
                <div className="glass rounded-xl p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gold" />
                </div>
              )}

              {error && !loading && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!loading && !error && clientSecret && stripeInstance && elementsOptions && (
                <Elements stripe={stripeInstance} options={elementsOptions}>
                  <PaymentForm
                    collaborationId={collaboration.id}
                    formattedApprox={formattedApprox}
                    onSuccess={() => {
                      onSuccess?.();
                      onOpenChange(false);
                    }}
                  />
                </Elements>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InAppPaymentSheet;
