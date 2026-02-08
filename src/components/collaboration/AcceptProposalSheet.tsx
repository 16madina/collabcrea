import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  Calendar,
  DollarSign,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useCollaborations } from "@/hooks/useCollaborations";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface AcceptProposalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: {
    id: string;
    title: string;
    budget_min: number;
    budget_max: number;
    deadline: string | null;
    category: string;
  };
  brandId: string;
  creatorId: string;
  conversationId?: string;
  onSuccess?: () => void;
}

const PLATFORM_FEE = 0.10; // 10%

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const AcceptProposalSheet = ({
  open,
  onOpenChange,
  offer,
  brandId,
  creatorId,
  conversationId,
  onSuccess,
}: AcceptProposalSheetProps) => {
  const { createCollaboration } = useCollaborations();
  const [loading, setLoading] = useState(false);
  const [agreedAmount, setAgreedAmount] = useState(
    Math.round((offer.budget_min + offer.budget_max) / 2)
  );

  const platformFee = Math.round(agreedAmount * PLATFORM_FEE);
  const creatorAmount = agreedAmount - platformFee;

  const deadline = offer.deadline
    ? format(parseISO(offer.deadline), "dd MMMM yyyy", { locale: fr })
    : "Non définie";

  const handleAccept = async () => {
    if (!offer.deadline) {
      return;
    }

    setLoading(true);
    try {
      await createCollaboration(
        offer.id,
        creatorId,
        brandId,
        agreedAmount,
        offer.deadline,
        conversationId
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Accepter la proposition
          </SheetTitle>
          <SheetDescription>
            Confirmez les détails de la collaboration
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)] pb-4">
          {/* Offer Summary */}
          <div className="glass rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground">{offer.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{offer.category}</Badge>
            </div>
          </div>

          {/* Deadline */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm text-muted-foreground">Date limite de livraison</p>
                <p className="font-semibold text-foreground">{deadline}</p>
              </div>
            </div>
            {!offer.deadline && (
              <div className="mt-3 flex items-start gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <span>Cette offre n'a pas de date limite définie. Contactez la marque.</span>
              </div>
            )}
          </div>

          {/* Amount Negotiation */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Montant négocié</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={agreedAmount}
                onChange={(e) => setAgreedAmount(Number(e.target.value))}
                min={offer.budget_min}
                max={offer.budget_max}
                className="text-lg font-semibold"
              />
              <span className="text-muted-foreground whitespace-nowrap">FCFA</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Budget proposé : {formatCurrency(offer.budget_min)} - {formatCurrency(offer.budget_max)}
            </p>
          </div>

          <Separator />

          {/* Payment Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold" />
              Détails du paiement
            </h3>

            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Montant total</span>
                <span className="font-semibold">{formatCurrency(agreedAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Frais de plateforme (10%)
                </span>
                <span className="text-destructive">-{formatCurrency(platformFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Vous recevrez</span>
                <span className="text-lg font-bold text-gold">
                  {formatCurrency(creatorAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Comment ça fonctionne ?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>La marque effectue le paiement en séquestre</li>
                  <li>Vous créez et uploadez votre contenu avant la deadline</li>
                  <li>La marque valide le contenu (ou auto-validation après 7 jours)</li>
                  <li>Le paiement est libéré dans votre portefeuille</li>
                </ol>
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
            onClick={handleAccept}
            disabled={loading || !offer.deadline}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            Accepter et créer la collaboration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AcceptProposalSheet;
