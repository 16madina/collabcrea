import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Flag, AlertTriangle, User, FileWarning, Loader2 } from "lucide-react";

type ReportType = "user" | "offer" | "fraud";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: ReportType;
  targetUserId?: string | null;
  targetOfferId?: string | null;
  targetName?: string;
}

const reportReasons: Record<ReportType, { value: string; label: string }[]> = {
  user: [
    { value: "fake_profile", label: "Faux profil / Usurpation d'identité" },
    { value: "harassment", label: "Harcèlement / Comportement inapproprié" },
    { value: "spam", label: "Spam / Contenu indésirable" },
    { value: "scam", label: "Arnaque / Tentative de fraude" },
    { value: "other", label: "Autre raison" },
  ],
  offer: [
    { value: "misleading", label: "Offre trompeuse / Fausses informations" },
    { value: "scam", label: "Arnaque / Tentative de fraude" },
    { value: "inappropriate", label: "Contenu inapproprié" },
    { value: "illegal", label: "Activité illégale" },
    { value: "other", label: "Autre raison" },
  ],
  fraud: [
    { value: "payment_fraud", label: "Fraude au paiement" },
    { value: "identity_theft", label: "Vol d'identité" },
    { value: "false_collaboration", label: "Fausse collaboration" },
    { value: "non_payment", label: "Non-paiement après collaboration" },
    { value: "other", label: "Autre fraude" },
  ],
};

const ReportDialog = ({
  open,
  onOpenChange,
  reportType,
  targetUserId,
  targetOfferId,
  targetName,
}: ReportDialogProps) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedReason) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        report_type: reportType,
        target_user_id: targetUserId || null,
        target_offer_id: targetOfferId || null,
        reason: reportReasons[reportType].find((r) => r.value === selectedReason)?.label || selectedReason,
        description: description || null,
      });

      if (error) throw error;

      toast.success("Signalement envoyé", {
        description: "Notre équipe examinera votre signalement sous 24-48h",
      });

      onOpenChange(false);
      setSelectedReason("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Erreur lors de l'envoi du signalement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = () => {
    switch (reportType) {
      case "user":
        return <User className="w-5 h-5 text-destructive" />;
      case "offer":
        return <FileWarning className="w-5 h-5 text-destructive" />;
      case "fraud":
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return <Flag className="w-5 h-5 text-destructive" />;
    }
  };

  const getTitle = () => {
    switch (reportType) {
      case "user":
        return "Signaler cet utilisateur";
      case "offer":
        return "Signaler cette offre";
      case "fraud":
        return "Signaler une fraude";
      default:
        return "Signaler";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {targetName && (
              <span className="block font-medium text-foreground mb-2">
                Concernant: {targetName}
              </span>
            )}
            Sélectionnez la raison du signalement. Notre équipe examinera votre demande.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {reportReasons[reportType].map((reason) => (
              <div
                key={reason.value}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={reason.value} id={reason.value} />
                <Label htmlFor={reason.value} className="flex-1 cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="description">Détails supplémentaires (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Flag className="w-4 h-4 mr-2" />
            )}
            Signaler
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReportDialog;
