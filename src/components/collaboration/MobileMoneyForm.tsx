import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MobileMoneyFormProps {
  collaborationId: string;
  amount: number;
  provider: "orange_money" | "wave";
  onSuccess: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const providerNames = {
  orange_money: "Orange Money",
  wave: "Wave",
};

const providerColors = {
  orange_money: "bg-orange-500",
  wave: "bg-blue-500",
};

const MobileMoneyForm = ({
  collaborationId,
  amount,
  provider,
  onSuccess,
  onCancel,
}: MobileMoneyFormProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentRequested, setPaymentRequested] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-mobile-payment", {
        body: {
          collaborationId,
          provider,
          phoneNumber,
        },
      });

      if (error) {
        console.error("Mobile payment error:", error);
        toast.error("Erreur lors de la demande de paiement");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setPaymentRequested(true);
      toast.success("Demande de paiement envoyée !");
      
      // Wait a bit for UX, then call onSuccess
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  if (paymentRequested) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className={`w-16 h-16 rounded-full ${providerColors[provider]}/20 flex items-center justify-center`}>
          <CheckCircle className={`w-10 h-10 ${provider === "orange_money" ? "text-orange-500" : "text-blue-500"}`} />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Demande envoyée !</h3>
        <p className="text-muted-foreground text-center text-sm">
          Vous allez recevoir une demande de paiement sur votre téléphone {phoneNumber}.
          <br />
          Confirmez le paiement pour démarrer la collaboration.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${providerColors[provider]} flex items-center justify-center`}>
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{providerNames[provider]}</p>
            <p className="text-sm text-muted-foreground">Paiement mobile sécurisé</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Ex: 77 123 45 67"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="bg-background/50"
          />
          <p className="text-xs text-muted-foreground">
            Entrez le numéro associé à votre compte {providerNames[provider]}
          </p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Instructions :</span>
          <br />
          1. Entrez votre numéro de téléphone
          <br />
          2. Validez la demande
          <br />
          3. Confirmez le paiement sur votre téléphone
        </p>
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
          className={`flex-1 ${provider === "orange_money" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Phone className="w-5 h-5 mr-2" />
          )}
          Payer {formatCurrency(amount)}
        </Button>
      </div>
    </form>
  );
};

export default MobileMoneyForm;
