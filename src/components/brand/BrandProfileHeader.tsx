import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Camera, Globe, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import { useAdmin } from "@/hooks/useAdmin";

interface BrandProfileHeaderProps {
  companyName: string;
  sector: string | null;
  website: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isVerified: boolean;
  onSettingsClick: () => void;
  onEditLogo?: () => void;
  onEditBanner?: () => void;
}

const BrandProfileHeader = ({
  companyName,
  sector,
  website,
  logoUrl,
  bannerUrl,
  isVerified,
  onSettingsClick,
  onEditLogo,
  onEditBanner,
}: BrandProfileHeaderProps) => {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const getInitials = () => {
    if (!companyName) return "?";
    const words = companyName.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-40 pt-[env(safe-area-inset-top)] bg-gradient-to-br from-primary/40 via-gold/20 to-accent/30 overflow-hidden"
      >
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-gold/10 to-accent/20">
            {/* Decorative pattern for brands */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-6 right-6 w-24 h-24 rounded-full bg-gold/30 blur-2xl" />
              <div className="absolute bottom-4 left-8 w-32 h-32 rounded-full bg-primary/30 blur-3xl" />
            </div>
          </div>
        )}

        {/* Banner overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Admin button */}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-40 p-2 rounded-full bg-accent/80 backdrop-blur-sm text-accent-foreground hover:bg-accent transition-colors"
            title="Panneau Admin"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
        )}

        {/* Notification bell */}
        <div className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-28">
          <NotificationBell />
        </div>

        {/* Edit banner button */}
        <button
          onClick={onEditBanner}
          className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-16 p-2 rounded-full bg-background/50 backdrop-blur-sm text-foreground/80 hover:bg-background/70 transition-colors"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 p-2 rounded-full bg-background/50 backdrop-blur-sm text-foreground/80 hover:bg-background/70 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Logo - Overlapping banner */}
      <div className="relative px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="absolute -top-14 left-4"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-background p-1 shadow-xl border border-border">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary via-primary/80 to-gold flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-2xl">
                    {getInitials()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Verified badge */}
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center border-2 border-background shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-background" />
              </div>
            )}

            {/* Edit logo button */}
            <button
              onClick={onEditLogo}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold flex items-center justify-center border-2 border-background shadow-lg hover:bg-gold/90 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-background" />
            </button>
          </div>
        </motion.div>

        {/* Company Info */}
        <div className="pt-14 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {companyName || "Nom de l'entreprise"}
              </h1>
              {isVerified && (
                <CheckCircle2 className="w-5 h-5 text-accent fill-accent" />
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {sector && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>{sector}</span>
                </div>
              )}
              {website && (
                <a 
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gold text-sm hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  <span>{website.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BrandProfileHeader;
