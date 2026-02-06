import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  Edit3, 
  Instagram, 
  Youtube, 
  MapPin, 
  Star, 
  Users,
  ChevronRight,
  LogOut,
  Bell,
  Shield,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

const socialAccounts = [
  { platform: "Instagram", icon: Instagram, handle: "@aicha_beaute", followers: "125K", connected: true },
  { platform: "YouTube", icon: Youtube, handle: "Aïcha Beauté", followers: "45K", connected: true },
  { platform: "TikTok", icon: Instagram, handle: "@aicha.beaute", followers: "89K", connected: true },
];

const pricingGrid = [
  { type: "Story Instagram", price: "50,000 FCFA" },
  { type: "Reel Instagram", price: "100,000 FCFA" },
  { type: "Vidéo TikTok", price: "80,000 FCFA" },
  { type: "Vidéo YouTube", price: "250,000 FCFA" },
  { type: "Live Instagram", price: "150,000 FCFA" },
];

const menuItems = [
  { icon: Bell, label: "Notifications", action: "notifications" },
  { icon: Shield, label: "Confidentialité", action: "privacy" },
  { icon: HelpCircle, label: "Aide & Support", action: "help" },
  { icon: LogOut, label: "Déconnexion", action: "logout", destructive: true },
];

const CreatorProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const handleMenuAction = (action: string) => {
    if (action === "logout") {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="font-display text-2xl font-bold text-gold-gradient">
            Profil
          </h1>
          <button className="touch-target">
            <Settings className="w-6 h-6 text-foreground" />
          </button>
        </motion.div>
      </div>

      {/* Profile Card - ID Card Style */}
      <div className="px-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden relative"
        >
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-4 right-4 touch-target z-10"
          >
            <Edit3 className="w-5 h-5 text-gold" />
          </button>

          <div className="flex">
            {/* Photo - Left Side */}
            <div className="relative w-36 h-48 flex-shrink-0 bg-gold/20">
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gold font-bold text-5xl">A</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/30" />
            </div>

            {/* Details - Right Side */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Aïcha Ndiaye</h2>
                <p className="text-gold text-sm font-medium mt-1">Créatrice Beauté & Lifestyle</p>
                
                <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
                  <MapPin className="w-3 h-3" />
                  <span>Dakar, Sénégal</span>
                </div>

                <p className="text-muted-foreground text-xs mt-3 line-clamp-2">
                  Passionnée de beauté africaine 🌍 Je partage mes routines et découvertes.
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-gold-gradient">259K</p>
                  <p className="text-[10px] text-muted-foreground">Abonnés</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gold-gradient">4.9</p>
                  <div className="flex items-center justify-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-gold fill-gold" />
                    <p className="text-[10px] text-muted-foreground">Note</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gold-gradient">23</p>
                  <p className="text-[10px] text-muted-foreground">Collabs</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Social Accounts */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-display text-lg font-semibold mb-4">Réseaux sociaux</h3>
          <div className="space-y-3">
            {socialAccounts.map((account, index) => {
              const Icon = account.icon;
              return (
                <motion.div
                  key={account.platform}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{account.platform}</p>
                    <p className="text-sm text-muted-foreground">{account.handle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold font-semibold">{account.followers}</p>
                    <p className="text-xs text-green-400">Connecté</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Pricing Grid */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Grille tarifaire</h3>
            <button className="text-gold text-sm">Modifier</button>
          </div>
          <div className="glass-card p-4 space-y-3">
            {pricingGrid.map((item, index) => (
              <div
                key={item.type}
                className={`flex items-center justify-between py-2 ${
                  index !== pricingGrid.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-muted-foreground">{item.type}</span>
                <span className="text-gold font-semibold">{item.price}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Menu */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.05 }}
                onClick={() => handleMenuAction(item.action)}
                className={`w-full glass-card p-4 flex items-center gap-4 ${
                  item.destructive ? "hover:border-destructive/30" : "hover:border-gold/30"
                } transition-all`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.destructive ? "bg-destructive/20" : "bg-muted"
                }`}>
                  <Icon className={`w-5 h-5 ${item.destructive ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
                <span className={`flex-1 text-left font-medium ${
                  item.destructive ? "text-destructive" : "text-foreground"
                }`}>
                  {item.label}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <BottomNav userRole="creator" />
    </div>
  );
};

export default CreatorProfile;
