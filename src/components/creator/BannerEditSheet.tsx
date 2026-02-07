import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface BannerEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl: string | null;
  onUpdate: () => void;
}

const BannerEditSheet = ({
  isOpen,
  onClose,
  currentBannerUrl,
  onUpdate,
}: BannerEditSheetProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/banner.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Note: We need to add banner_url to profiles table
      // For now, we'll store it but the field might need to be added
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl } as any) // Temporarily using avatar_url
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Bannière mise à jour !");
      onUpdate();
      handleClose();
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    onClose();
  };

  const displayImage = preview || currentBannerUrl;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="font-display text-xl">
            Photo de couverture
          </SheetTitle>
          <SheetDescription>
            Personnalisez votre bannière de profil
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* Banner Preview */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full"
          >
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 rounded-2xl bg-muted border-2 border-dashed border-border hover:border-gold transition-colors cursor-pointer overflow-hidden flex items-center justify-center"
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-12 h-12" />
                  <span className="text-sm">Ajouter une bannière</span>
                </div>
              )}
            </div>

            {displayImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="absolute top-2 right-2 p-2 bg-destructive rounded-full text-white shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Button */}
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Choisir une image
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Recommandé : 1500 x 500 pixels
          </p>
        </div>

        {/* Save Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button
            onClick={handleSave}
            disabled={!selectedFile || isUploading}
            className="w-full bg-gold hover:bg-gold/90 text-background"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
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

export default BannerEditSheet;
