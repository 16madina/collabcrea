import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Shield, 
  CheckCircle, 
  Clock, 
  FileImage, 
  AlertCircle,
  X,
  Mail,
  Loader2,
  Camera,
  FileText,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import FacialVerificationCamera from "./FacialVerificationCamera";

interface IdentityVerificationTabProps {
  identityVerified: boolean;
  identitySubmittedAt: string | null;
  identityDocumentUrl: string | null;
  emailVerified?: boolean;
  onUpdate: () => void;
}

type VerificationMethod = null | "document" | "selfie";

const IdentityVerificationTab = ({
  identityVerified,
  identitySubmittedAt,
  identityDocumentUrl,
  emailVerified = false,
  onUpdate,
}: IdentityVerificationTabProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResendVerificationEmail = async () => {
    setSendingEmail(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) {
        toast.error("Email non trouvé");
        return;
      }
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: currentUser.email,
        options: {
          emailRedirectTo: `${window.location.origin}/creator/profile`,
        },
      });
      if (error) throw error;
      toast.success("Email de vérification envoyé !", {
        description: `Vérifiez votre boîte de réception à ${currentUser.email}`,
      });
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      toast.error("Erreur lors de l'envoi", {
        description: error.message || "Veuillez réessayer plus tard",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = selectedMethod === "selfie"
      ? ["image/jpeg", "image/png", "image/webp"]
      : ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      toast.error(selectedMethod === "selfie" 
        ? "Format non supporté. Utilisez JPG, PNG ou WEBP."
        : "Format non supporté. Utilisez JPG, PNG, WEBP ou PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10 Mo)");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !selectedMethod) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();

      if (selectedMethod === "document") {
        const fileName = `${user.id}/identity-document.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("identity-documents")
          .upload(fileName, selectedFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("identity-documents")
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            identity_document_url: urlData.publicUrl,
            identity_submitted_at: new Date().toISOString(),
            identity_method: "document",
          })
          .eq("user_id", user.id);
        if (updateError) throw updateError;
      } else {
        // Selfie method
        const fileName = `${user.id}/selfie.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("selfies")
          .upload(fileName, selectedFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            selfie_url: fileName,
            identity_submitted_at: new Date().toISOString(),
            identity_method: "selfie",
          })
          .eq("user_id", user.id);
        if (updateError) throw updateError;
      }

      toast.success("Document soumis avec succès ! Vérification en cours.");
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedMethod(null);
      onUpdate();
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle camera captures (multiple blobs from facial verification)
  const handleCameraComplete = async (captures: Blob[]) => {
    if (!user) return;
    setShowCamera(false);
    setUploading(true);

    try {
      // Upload each capture
      const uploadedPaths: string[] = [];
      for (let i = 0; i < captures.length; i++) {
        const fileName = `${user.id}/selfie-${i}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("selfies")
          .upload(fileName, captures[i], { upsert: true, contentType: "image/jpeg" });
        if (uploadError) throw uploadError;

        uploadedPaths.push(fileName);
      }

      // Store the first (front-facing) selfie path as main selfie_url
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          selfie_url: uploadedPaths[0],
          identity_submitted_at: new Date().toISOString(),
          identity_method: "selfie",
        })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      toast.success("Vérification faciale soumise ! Un administrateur examinera vos photos.");
      setSelectedMethod(null);
      onUpdate();
    } catch (error) {
      console.error("Error uploading selfies:", error);
      toast.error("Erreur lors de l'envoi des photos");
    } finally {
      setUploading(false);
    }
  };

  // Already verified
  if (identityVerified) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-display text-xl font-bold text-accent mb-2">Identité vérifiée</h3>
          <p className="text-muted-foreground">
            Votre identité a été vérifiée avec succès. Vous avez accès à toutes les fonctionnalités.
          </p>
        </div>
      </motion.div>
    );
  }

  // Pending verification
  if (identitySubmittedAt && !identityVerified) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gold" />
          </div>
          <h3 className="font-display text-xl font-bold text-gold mb-2">Vérification en cours</h3>
          <p className="text-muted-foreground mb-4">
            Votre vérification a été soumise le{" "}
            {new Date(identitySubmittedAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      {/* Email verification section */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              emailVerified ? "bg-accent/20" : "bg-gold/20"
            }`}>
              {emailVerified ? (
                <CheckCircle className="w-5 h-5 text-accent" />
              ) : (
                <Mail className="w-5 h-5 text-gold" />
              )}
            </div>
            <div>
              <p className="font-semibold">Vérification email</p>
              <p className="text-xs text-muted-foreground">
                {emailVerified ? "Email vérifié" : "Email non vérifié"}
              </p>
            </div>
          </div>
          {!emailVerified && (
            <button
              onClick={handleResendVerificationEmail}
              disabled={sendingEmail}
              className="bg-gold text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {sendingEmail ? "Envoi..." : "Envoyer"}
            </button>
          )}
        </div>
      </div>

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

      {/* Method Selection or Upload */}
      <AnimatePresence mode="wait">
        {!selectedMethod ? (
          <MethodSelector key="selector" onSelect={(method) => {
            if (method === "selfie") {
              setSelectedMethod("selfie");
              setShowCamera(true);
            } else {
              setSelectedMethod(method);
            }
          }} />
        ) : selectedMethod === "document" ? (
          <DocumentUpload
            key="document"
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            uploading={uploading}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onUpload={handleUpload}
            onClear={clearSelection}
            onBack={() => { setSelectedMethod(null); clearSelection(); }}
          />
        ) : uploading ? (
          <motion.div
            key="uploading-selfie"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 flex flex-col items-center gap-4"
          >
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
            <p className="font-semibold">Envoi des photos en cours...</p>
            <p className="text-xs text-muted-foreground">Veuillez patienter</p>
          </motion.div>
        ) : (
          <motion.div
            key="selfie-info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => { setSelectedMethod(null); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Changer de méthode
            </button>
            <div className="glass-card p-6 text-center space-y-4">
              <Camera className="w-12 h-12 text-gold mx-auto" />
              <p className="font-semibold">Vérification faciale</p>
              <p className="text-sm text-muted-foreground">
                La caméra va s'ouvrir pour capturer votre visage sous différents angles.
              </p>
              <button
                onClick={() => setShowCamera(true)}
                className="btn-gold px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mx-auto"
              >
                <Camera className="w-5 h-5" />
                Ouvrir la caméra
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera overlay */}
      {showCamera && (
        <FacialVerificationCamera
          onComplete={handleCameraComplete}
          onCancel={() => {
            setShowCamera(false);
            setSelectedMethod(null);
          }}
        />
      )}

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

// Method selector sub-component
const MethodSelector = ({ onSelect }: { onSelect: (method: VerificationMethod) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-4"
  >
    <h4 className="font-semibold">Choisissez votre méthode de vérification</h4>
    <div className="grid grid-cols-1 gap-3">
      <button
        onClick={() => onSelect("document")}
        className="glass-card p-5 flex items-center gap-4 text-left hover:border-gold/50 transition-colors border border-transparent"
      >
        <div className="w-14 h-14 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
          <FileText className="w-7 h-7 text-gold" />
        </div>
        <div>
          <p className="font-semibold">Pièce d'identité</p>
          <p className="text-xs text-muted-foreground mt-1">
            Carte d'identité, passeport, permis de conduire ou carte de séjour
          </p>
        </div>
      </button>

      <button
        onClick={() => onSelect("selfie")}
        className="glass-card p-5 flex items-center gap-4 text-left hover:border-gold/50 transition-colors border border-transparent"
      >
        <div className="w-14 h-14 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
          <Camera className="w-7 h-7 text-gold" />
        </div>
        <div>
          <p className="font-semibold">Vérification faciale</p>
          <p className="text-xs text-muted-foreground mt-1">
            Prenez un selfie qui sera comparé à votre photo de profil par un administrateur
          </p>
        </div>
      </button>
    </div>
  </motion.div>
);

// Document upload sub-component
const DocumentUpload = ({
  selectedFile, previewUrl, uploading, fileInputRef,
  onFileSelect, onUpload, onClear, onBack,
}: {
  selectedFile: File | null;
  previewUrl: string | null;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onClear: () => void;
  onBack: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeft className="w-4 h-4" />
      Changer de méthode
    </button>

    <h4 className="font-semibold">Documents acceptés</h4>
    <div className="grid grid-cols-2 gap-3">
      {["Carte d'identité", "Passeport", "Permis de conduire", "Carte de séjour"].map((doc) => (
        <div key={doc} className="glass-card p-3 flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-accent" />
          <span>{doc}</span>
        </div>
      ))}
    </div>

    <h4 className="font-semibold">Téléverser votre document</h4>
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,application/pdf"
      onChange={onFileSelect}
      className="hidden"
    />
    <FileUploadArea
      selectedFile={selectedFile}
      previewUrl={previewUrl}
      uploading={uploading}
      fileInputRef={fileInputRef}
      onUpload={onUpload}
      onClear={onClear}
      label="Soumettre pour vérification"
      hint="JPG, PNG, WEBP ou PDF (max 10 Mo)"
    />
  </motion.div>
);



// Shared file upload area
const FileUploadArea = ({
  selectedFile, previewUrl, uploading, fileInputRef,
  onUpload, onClear, label, hint, icon,
}: {
  selectedFile: File | null;
  previewUrl: string | null;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUpload: () => void;
  onClear: () => void;
  label: string;
  hint: string;
  icon?: React.ReactNode;
}) => (
  <>
    {!selectedFile ? (
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full glass-card p-8 border-2 border-dashed border-gold/30 hover:border-gold/50 transition-colors flex flex-col items-center gap-3"
      >
        <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
          {icon || <Upload className="w-7 h-7 text-gold" />}
        </div>
        <div className="text-center">
          <p className="font-semibold">Cliquez pour téléverser</p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
      </button>
    ) : (
      <div className="glass-card p-4 space-y-4">
        {previewUrl ? (
          <div className="relative">
            <img src={previewUrl} alt="Aperçu" className="w-full h-48 object-cover rounded-lg" />
            <button
              onClick={onClear}
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
            <button onClick={onClear} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={onUpload}
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
              <span>{label}</span>
            </>
          )}
        </button>
      </div>
    )}
  </>
);

export default IdentityVerificationTab;
