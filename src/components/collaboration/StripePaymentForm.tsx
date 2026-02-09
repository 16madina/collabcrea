import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StripePaymentFormProps {
  paymentIntentId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const StripePaymentForm = ({
  paymentIntentId,
  amount,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          toast.error(error.message || "Erreur de paiement");
        } else {
          toast.error("Une erreur inattendue s'est produite");
        }
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment on backend
        const { data, error: confirmError } = await supabase.functions.invoke(
          "confirm-payment",
          {
            body: { paymentIntentId: paymentIntent.id },
          }
        );

        if (confirmError || !data?.success) {
          console.error("Confirm error:", confirmError || data?.error);
          toast.error("Erreur lors de la confirmation du paiement");
          setLoading(false);
          return;
        }

        setPaymentSuccess(true);
        toast.success("Paiement effectué avec succès !");
        
        // Wait a bit for UX, then call onSuccess
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Erreur lors du paiement");
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Paiement réussi !</h3>
        <p className="text-muted-foreground text-center">
          Le créateur a été notifié et peut maintenant commencer à travailler.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass rounded-xl p-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="gold"
          className="flex-1"
          disabled={!stripe || !elements || loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Lock className="w-5 h-5 mr-2" />
          )}
          Payer {formatCurrency(amount)}
        </Button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
