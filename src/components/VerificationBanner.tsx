import { AlertTriangle, CheckCircle, Clock, Shield, Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerificationStatus {
  email_verified: boolean;
  identity_verified: boolean;
  identity_submitted_at: string | null;
}

interface VerificationBannerProps {
  status: VerificationStatus;
  showActions?: boolean;
  userRole?: "creator" | "brand";
}

const VerificationBanner = ({ status, showActions = true, userRole = "creator" }: VerificationBannerProps) => {
  const navigate = useNavigate();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleResendVerificationEmail = async () => {
    setIsSendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error("Email non trouvé");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/creator/profile`,
        },
      });

      if (error) throw error;

      toast.success("Email de vérification envoyé !", {
        description: `Vérifiez votre boîte de réception à ${user.email}`,
      });
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      toast.error("Erreur lors de l'envoi", {
        description: error.message || "Veuillez réessayer plus tard",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  const isFullyVerified = status.email_verified && status.identity_verified;
  const isPendingReview = status.identity_submitted_at && !status.identity_verified;
  
  if (isFullyVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-accent/20 border border-accent/30 rounded-xl p-4 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-accent">Compte vérifié</p>
          <p className="text-xs text-muted-foreground">
            Vous avez accès à toutes les fonctionnalités
          </p>
        </div>
      </motion.div>
    );
  }

  if (isPendingReview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gold/10 border border-gold/30 rounded-xl p-4 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gold">Vérification en cours</p>
          <p className="text-xs text-muted-foreground">
            Votre pièce d'identité est en cours de vérification (24-48h)
          </p>
        </div>
      </motion.div>
    );
  }

  // Not verified
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/10 border border-destructive/30 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-destructive">Vérification requise</p>
          <p className="text-xs text-muted-foreground">
            Complétez votre vérification pour postuler et envoyer des messages
          </p>
        </div>
      </div>
      
      <div className="mt-3 space-y-2 pl-13">
        <div className="flex items-center gap-2 text-sm">
          {status.email_verified ? (
            <CheckCircle className="w-4 h-4 text-accent" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
          )}
          <span className={status.email_verified ? "text-accent" : "text-muted-foreground"}>
            Email vérifié
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {status.identity_verified ? (
            <CheckCircle className="w-4 h-4 text-accent" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
          )}
          <span className={status.identity_verified ? "text-accent" : "text-muted-foreground"}>
            Pièce d'identité vérifiée
          </span>
        </div>
      </div>

        {showActions && (
        <div className="mt-4 flex gap-2">
          {!status.email_verified && (
            <button 
              onClick={handleResendVerificationEmail}
              disabled={isSendingEmail}
              className="flex-1 bg-gold/20 text-gold py-2 px-4 rounded-lg text-sm font-medium hover:bg-gold/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {isSendingEmail ? "Envoi en cours..." : "Vérifier email"}
            </button>
          )}
          {!status.identity_submitted_at && (
            <button 
              onClick={() => navigate(userRole === "brand" ? "/brand/profile?tab=verification" : "/creator/profile?tab=verification")}
              className="flex-1 bg-gold text-background py-2 px-4 rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Soumettre pièce d'identité
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default VerificationBanner;
