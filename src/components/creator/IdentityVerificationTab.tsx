import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Upload, 
  Shield, 
  CheckCircle, 
  Clock, 
  FileImage, 
  AlertCircle,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface IdentityVerificationTabProps {
  identityVerified: boolean;
  identitySubmittedAt: string | null;
  identityDocumentUrl: string | null;
  onUpdate: () => void;
}

const IdentityVerificationTab = ({
  identityVerified,
  identitySubmittedAt,
  identityDocumentUrl,
  onUpdate,
}: IdentityVerificationTabProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WEBP ou PDF.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10 Mo)");
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/identity-document.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("identity-documents")
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("identity-documents")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          identity_document_url: urlData.publicUrl,
          identity_submitted_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Document soumis avec succès ! Vérification en cours.");
      setSelectedFile(null);
      setPreviewUrl(null);
      onUpdate();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Erreur lors de l'envoi du document");
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Already verified
  if (identityVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-display text-xl font-bold text-accent mb-2">
            Identité vérifiée
          </h3>
          <p className="text-muted-foreground">
            Votre pièce d'identité a été vérifiée avec succès. Vous avez accès à toutes les fonctionnalités.
          </p>
        </div>
      </motion.div>
    );
  }

  // Pending verification
  if (identitySubmittedAt && !identityVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gold" />
          </div>
          <h3 className="font-display text-xl font-bold text-gold mb-2">
            Vérification en cours
          </h3>
          <p className="text-muted-foreground mb-4">
            Votre pièce d'identité a été soumise le{" "}
            {new Date(identitySubmittedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            La vérification prend généralement 24 à 48 heures. Nous vous notifierons une fois terminée.
          </p>
        </div>
      </motion.div>
    );
  }

  // Upload form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      {/* Info card */}
      <div className="glass-card p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-gold mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Pourquoi vérifier votre identité ?</p>
          <p className="text-xs text-muted-foreground mt-1">
            La vérification d'identité permet de sécuriser la plateforme et de garantir
            la confiance entre créateurs et marques. Elle est requise pour postuler aux
            offres et communiquer avec les marques.
          </p>
        </div>
      </div>

      {/* Accepted documents */}
      <div>
        <h4 className="font-semibold mb-3">Documents acceptés</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            "Carte d'identité",
            "Passeport",
            "Permis de conduire",
            "Carte de séjour",
          ].map((doc) => (
            <div
              key={doc}
              className="glass-card p-3 flex items-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>{doc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div>
        <h4 className="font-semibold mb-3">Téléverser votre document</h4>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full glass-card p-8 border-2 border-dashed border-gold/30 hover:border-gold/50 transition-colors flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
              <Upload className="w-7 h-7 text-gold" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Cliquez pour téléverser</p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WEBP ou PDF (max 10 Mo)
              </p>
            </div>
          </button>
        ) : (
          <div className="glass-card p-4 space-y-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Aperçu du document"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={clearSelection}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileImage className="w-8 h-8 text-gold" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
                <button
                  onClick={clearSelection}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full btn-gold py-3 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Soumettre pour vérification</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Vos documents sont stockés de manière sécurisée et ne seront utilisés que
          pour vérifier votre identité. Ils ne seront jamais partagés avec des tiers.
        </p>
      </div>
    </motion.div>
  );
};

export default IdentityVerificationTab;
