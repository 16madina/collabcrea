import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BioEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentBio: string | null;
  onUpdate: () => void;
}

const BioEditSheet = ({
  isOpen,
  onClose,
  currentBio,
  onUpdate,
}: BioEditSheetProps) => {
  const { user } = useAuth();
  const [bio, setBio] = useState(currentBio || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Bio mise à jour !");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating bio:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setBio(currentBio || "");
      onClose();
    }
  };

  // Reset bio when sheet opens with new data
  const handleSheetOpen = () => {
    setBio(currentBio || "");
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[70vh] rounded-t-3xl"
        onOpenAutoFocus={handleSheetOpen}
      >
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="font-display text-xl">
            À propos de vous
          </SheetTitle>
          <SheetDescription>
            Présentez-vous aux marques et décrivez votre univers créatif
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Votre bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Parlez de vous, de votre style de contenu, de vos passions et de ce qui vous rend unique..."
              className="min-h-[200px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500 caractères
            </p>
          </div>

          <div className="bg-muted/30 rounded-xl p-4">
            <h4 className="font-medium text-sm mb-2">Conseils pour une bonne bio :</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Décrivez votre niche et votre style de contenu</li>
              <li>• Mentionnez vos valeurs et ce qui vous passionne</li>
              <li>• Indiquez le type de marques avec lesquelles vous aimez collaborer</li>
            </ul>
          </div>
        </div>

        {/* Save Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gold hover:bg-gold/90 text-background"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BioEditSheet;
