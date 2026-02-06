import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Edit3, 
  Instagram, 
  Youtube, 
  MapPin, 
  Star, 
  ChevronRight,
  LogOut,
  Bell,
  Shield,
  HelpCircle
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ProfileEditForm from "@/components/creator/ProfileEditForm";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Snapchat icon component
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.42.42 0 0 1 .165-.036c.101 0 .21.035.3.096.135.09.21.21.21.36 0 .165-.09.315-.225.405a2.2 2.2 0 0 1-.405.195c-.12.045-.24.09-.359.12-.165.045-.329.09-.479.149-.21.075-.27.225-.3.449 0 .03-.015.06-.015.09v.061c.014.175.03.375.089.569a.32.32 0 0 0 .029.069c.021.044.04.085.061.12.165.256.314.404.614.599.27.18.614.315 1.019.45.104.033.21.063.3.105.209.09.405.24.495.45.045.12.06.255.045.39-.075.33-.375.54-.674.585a3.65 3.65 0 0 1-.569.045c-.225 0-.45-.03-.66-.045-.255-.03-.494-.045-.704-.045-.12 0-.24 0-.345.015-.21.015-.42.09-.6.195-.375.195-.705.615-1.095 1.11-.194.25-.404.5-.629.71-.344.33-.749.54-1.169.69-.479.18-.989.27-1.559.27h-.15c-.57 0-1.08-.09-1.559-.27a3.3 3.3 0 0 1-1.169-.69c-.225-.21-.435-.46-.629-.71-.39-.495-.72-.915-1.095-1.11a1.38 1.38 0 0 0-.6-.195c-.106-.015-.225-.015-.345-.015-.21 0-.449.015-.704.045-.21.015-.435.045-.66.045a3.65 3.65 0 0 1-.569-.045c-.3-.045-.599-.255-.674-.585a.71.71 0 0 1 .045-.39c.09-.21.285-.36.495-.45.09-.04.195-.072.3-.105.405-.135.749-.27 1.019-.45.3-.195.449-.343.614-.599l.061-.12c.01-.022.02-.045.029-.069.059-.194.075-.394.089-.569v-.061c0-.03-.015-.06-.015-.09-.03-.224-.09-.374-.3-.449a2.81 2.81 0 0 0-.479-.149c-.12-.03-.24-.075-.359-.12a2.2 2.2 0 0 1-.405-.195c-.135-.09-.225-.24-.225-.405 0-.15.075-.27.21-.36a.5.5 0 0 1 .3-.096.42.42 0 0 1 .165.036c.374.181.733.301 1.033.301.198 0 .326-.045.401-.09a22.1 22.1 0 0 1-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.859 1.069 11.216.793 12.206.793z"/>
  </svg>
);

interface PricingItem {
  type: string;
  price: number;
  description: string;
}

interface ProfileData {
  full_name: string;
  bio: string | null;
  category: string | null;
  country: string | null;
  youtube_followers: string | null;
  instagram_followers: string | null;
  tiktok_followers: string | null;
  snapchat_followers: string | null;
  pricing: PricingItem[] | null;
}

const menuItems = [
  { icon: Bell, label: "Notifications", action: "notifications" },
  { icon: Shield, label: "Confidentialité", action: "privacy" },
  { icon: HelpCircle, label: "Aide & Support", action: "help" },
  { icon: LogOut, label: "Déconnexion", action: "logout", destructive: true },
];

const CreatorProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setProfileData({
        full_name: data.full_name,
        bio: data.bio,
        category: data.category,
        country: data.country,
        youtube_followers: data.youtube_followers,
        instagram_followers: data.instagram_followers,
        tiktok_followers: data.tiktok_followers,
        snapchat_followers: data.snapchat_followers,
        pricing: data.pricing as unknown as PricingItem[] | null,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleMenuAction = async (action: string) => {
    if (action === "logout") {
      await signOut();
      navigate("/");
    }
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    fetchProfile();
  };

  // Calculate total followers
  const getTotalFollowers = () => {
    if (!profileData) return "0";
    const parseFollowers = (value: string | null) => {
      if (!value) return 0;
      const num = parseFloat(value.replace(/[^0-9.]/g, ""));
      if (value.toLowerCase().includes("m")) return num * 1000000;
      if (value.toLowerCase().includes("k")) return num * 1000;
      return num;
    };

    const total = parseFollowers(profileData.youtube_followers) +
                  parseFollowers(profileData.instagram_followers) +
                  parseFollowers(profileData.tiktok_followers) +
                  parseFollowers(profileData.snapchat_followers);

    if (total >= 1000000) return `${(total / 1000000).toFixed(1)}M`;
    if (total >= 1000) return `${(total / 1000).toFixed(0)}K`;
    return total.toString();
  };

  // Build social accounts from real data
  const getSocialAccounts = () => {
    if (!profileData) return [];
    const accounts = [];
    
    if (profileData.youtube_followers) {
      accounts.push({
        platform: "YouTube",
        icon: Youtube,
        followers: profileData.youtube_followers,
      });
    }
    if (profileData.instagram_followers) {
      accounts.push({
        platform: "Instagram",
        icon: Instagram,
        followers: profileData.instagram_followers,
      });
    }
    if (profileData.tiktok_followers) {
      accounts.push({
        platform: "TikTok",
        icon: TikTokIcon,
        followers: profileData.tiktok_followers,
      });
    }
    if (profileData.snapchat_followers) {
      accounts.push({
        platform: "Snapchat",
        icon: SnapchatIcon,
        followers: profileData.snapchat_followers,
      });
    }
    return accounts;
  };

  const socialAccounts = getSocialAccounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gold">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Edit Form Modal */}
      <AnimatePresence>
        {isEditing && profileData && (
          <ProfileEditForm
            onClose={handleCloseEdit}
            initialData={profileData}
          />
        )}
      </AnimatePresence>

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

      {/* Profile Card */}
      <div className="px-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center relative"
        >
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 touch-target"
          >
            <Edit3 className="w-5 h-5 text-gold" />
          </button>

          <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 ring-4 ring-gold/30">
            <span className="text-gold font-bold text-3xl">
              {profileData?.full_name?.charAt(0) || "?"}
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold">
            {profileData?.full_name || "Votre nom"}
          </h2>
          <p className="text-gold text-sm font-medium mt-1">
            Créateur {profileData?.category || ""}
          </p>
          
          {profileData?.country && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-2">
              <MapPin className="w-4 h-4" />
              <span>{profileData.country}</span>
            </div>
          )}

          {profileData?.bio && (
            <p className="text-muted-foreground text-sm mt-4 max-w-xs mx-auto">
              {profileData.bio}
            </p>
          )}

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-2xl font-bold text-gold-gradient">{getTotalFollowers()}</p>
              <p className="text-xs text-muted-foreground">Abonnés</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-gradient">-</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-3 h-3 text-gold fill-gold" />
                <p className="text-xs text-muted-foreground">Note</p>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-gradient">0</p>
              <p className="text-xs text-muted-foreground">Collabs</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Social Accounts */}
      {socialAccounts.length > 0 && (
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
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-semibold">{account.followers}</p>
                      <p className="text-xs text-accent">Connecté</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Pricing Grid */}
      {profileData?.pricing && profileData.pricing.length > 0 && (
        <div className="px-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Grille tarifaire</h3>
              <button onClick={() => setIsEditing(true)} className="text-gold text-sm">
                Modifier
              </button>
            </div>
            <div className="glass-card p-4 space-y-3">
              {profileData.pricing.map((item, index) => (
                <div
                  key={item.type}
                  className={`flex items-center justify-between py-2 ${
                    index !== (profileData.pricing?.length || 0) - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div>
                    <span className="text-foreground">{item.type}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <span className="text-gold font-semibold">
                    {item.price.toLocaleString()} FCFA
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty state for new users */}
      {(!socialAccounts.length && (!profileData?.pricing || profileData.pricing.length === 0)) && (
        <div className="px-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 text-center"
          >
            <p className="text-muted-foreground mb-4">
              Complétez votre profil pour attirer plus de marques !
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-gold font-medium"
            >
              Modifier mon profil →
            </button>
          </motion.div>
        </div>
      )}

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
