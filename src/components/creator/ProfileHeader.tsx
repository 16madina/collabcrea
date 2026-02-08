import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Camera, Shield, CheckCircle2, AlertCircle, Mail, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import { useAdmin } from "@/hooks/useAdmin";
interface ProfileHeaderProps {
  fullName: string;
  category: string | null;
  country: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  isVerified: boolean;
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  onSettingsClick: () => void;
  onVerifyClick: () => void;
  onEditAvatar?: () => void;
  onEditBanner?: () => void;
}

const ProfileHeader = ({
  fullName,
  category,
  country,
  avatarUrl,
  bannerUrl,
  isVerified,
  isEmailVerified,
  isIdentityVerified,
  onSettingsClick,
  onVerifyClick,
  onEditAvatar,
  onEditBanner,
}: ProfileHeaderProps) => {
  const [sendingEmail, setSendingEmail] = useState(false);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const getInitials = () => {
    if (!fullName) return "?";
    return fullName.charAt(0).toUpperCase();
  };

  const handleResendVerificationEmail = async () => {
    setSendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        toast.error("Email non trouvé");
        return;
      }

      const { error } = await supabase.functions.invoke("send-auth-email", {
        body: {
          type: "signup",
          email: user.email,
          redirectTo: `${window.location.origin}/creator/profile`,
          userName: fullName || undefined,
        },
      });

      if (error) throw error;

      toast.success("Email envoyé !", {
        description: `Vérifiez ${user.email}`,
      });
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      toast.error("Erreur lors de l'envoi", {
        description: error.message || "Veuillez réessayer",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const getVerificationStatus = () => {
    if (isVerified) return { text: "Vérifié", color: "text-accent", icon: CheckCircle2 };
    if (!isEmailVerified) return { text: "Email non vérifié", color: "text-gold", icon: AlertCircle };
    if (!isIdentityVerified) return { text: "Identité non vérifiée", color: "text-gold", icon: AlertCircle };
    return { text: "En attente", color: "text-muted-foreground", icon: AlertCircle };
  };

  const status = getVerificationStatus();
  const StatusIcon = status.icon;

  return (
    <div className="relative">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-44 pt-[env(safe-area-inset-top)] bg-gradient-to-br from-gold/30 via-accent/20 to-primary/30 overflow-hidden"
      >
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-accent/10 to-primary/20">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-gold/20 blur-2xl" />
              <div className="absolute bottom-8 right-8 w-32 h-32 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
            </div>
          </div>
        )}

        {/* Banner overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Admin button */}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="absolute top-4 right-40 p-2 rounded-full bg-accent/80 backdrop-blur-sm text-accent-foreground hover:bg-accent transition-colors"
            title="Panneau Admin"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
        )}

        {/* Notification bell */}
        <div className="absolute top-4 right-28">
          <NotificationBell />
        </div>

        {/* Edit banner button */}
        <button
          onClick={onEditBanner}
          className="absolute top-4 right-16 p-2 rounded-full bg-background/50 backdrop-blur-sm text-foreground/80 hover:bg-background/70 transition-colors"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/50 backdrop-blur-sm text-foreground/80 hover:bg-background/70 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Verification CTA on banner */}
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <Button
              onClick={onVerifyClick}
              variant="outline"
              className="w-full bg-background/80 backdrop-blur-md border-gold/50 hover:bg-gold/20 hover:border-gold text-foreground"
            >
              <Shield className="w-4 h-4 mr-2 text-gold" />
              <span>Vérifier votre profil</span>
              <span className="ml-2 text-xs text-muted-foreground">
                - Accédez à toutes les fonctionnalités
              </span>
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Profile Photo - Overlapping banner */}
      <div className="relative px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="absolute -top-16 left-4"
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-background p-1 shadow-xl">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gold via-gold/80 to-accent flex items-center justify-center">
                  <span className="text-background font-bold text-4xl">
                    {getInitials()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Verified badge */}
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center border-2 border-background shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-background" />
              </div>
            )}

            {/* Edit avatar button */}
            <button
              onClick={onEditAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gold flex items-center justify-center border-2 border-background shadow-lg hover:bg-gold/90 transition-colors"
            >
              <Camera className="w-4 h-4 text-background" />
            </button>
          </div>
        </motion.div>

        {/* Profile Info */}
        <div className="pt-16 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {fullName || "Votre nom"}
              </h1>
              {isVerified && (
                <CheckCircle2 className="w-5 h-5 text-accent fill-accent" />
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              {category && (
                <span className="text-gold font-medium text-sm">{category}</span>
              )}
              {category && country && <span className="text-muted-foreground">•</span>}
              {country && (
                <span className="text-muted-foreground text-sm">{country}</span>
              )}
            </div>

            {/* Verification status badge */}
            <div className="flex items-center gap-2 mt-3">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 ${status.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{status.text}</span>
              </div>
              
              {/* Email verification button */}
              {!isEmailVerified && (
                <button
                  onClick={handleResendVerificationEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold text-background text-xs font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  <span>{sendingEmail ? "Envoi..." : "Vérifier"}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
