import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Globe, ShieldCheck, ExternalLink } from "lucide-react";
import { FaYoutube, FaInstagram, FaTiktok, FaSnapchatGhost, FaFacebookF } from "react-icons/fa";
import { CountryFlag } from "@/lib/flags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";


interface ProfileData {
  full_name: string;
  company_name: string | null;
  company_description: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  banner_url: string | null;
  bio: string | null;
  category: string | null;
  country: string | null;
  sector: string | null;
  website: string | null;
  followers: string | null;
  youtube_followers: string | null;
  instagram_followers: string | null;
  tiktok_followers: string | null;
  snapchat_followers: string | null;
  facebook_followers: string | null;
  identity_verified: boolean | null;
  residence_country: string | null;
}

interface ChatProfileSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewFullProfile?: (userId: string, role: string) => void;
}

const ChatProfileSheet = ({ userId, open, onOpenChange, onViewFullProfile }: ChatProfileSheetProps) => {
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !open) {
      // Reset when closed so next open shows loading
      setProfile(null);
      setLoading(true);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, company_name, company_description, avatar_url, logo_url, banner_url, bio, category, country, sector, website, followers, youtube_followers, instagram_followers, tiktok_followers, snapchat_followers, facebook_followers, identity_verified, residence_country")
          .eq("user_id", userId)
          .single();
        
        setProfile(profileData);

        // Fetch role separately — may fail due to RLS (brand can't see other brand roles)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        
        setRole(roleData?.role || null);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, open]);

  const displayName = profile?.company_name || profile?.full_name || "Utilisateur";
  const avatarUrl = profile?.logo_url || profile?.avatar_url;
  const isBrand = role === "brand";

  const socials = [
    { icon: FaYoutube, value: profile?.youtube_followers, color: "text-red-500", label: "YouTube" },
    { icon: FaInstagram, value: profile?.instagram_followers, color: "text-pink-500", label: "Instagram" },
    { icon: FaTiktok, value: profile?.tiktok_followers, color: "text-foreground", label: "TikTok" },
    { icon: FaFacebookF, value: profile?.facebook_followers, color: "text-blue-500", label: "Facebook" },
    { icon: FaSnapchatGhost, value: profile?.snapchat_followers, color: "text-yellow-400", label: "Snapchat" },
  ].filter((s) => s.value);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto z-[80]">
        <VisuallyHidden.Root>
          <SheetTitle>Profil utilisateur</SheetTitle>
        </VisuallyHidden.Root>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
          </div>
        ) : profile ? (
          <div className="space-y-6 pb-6">
            {/* Banner + Avatar */}
            <div className="relative -mx-6 -mt-6">
              {profile.banner_url ? (
                <img
                  src={profile.banner_url}
                  alt="Banner"
                  className="w-full h-32 object-cover rounded-t-3xl"
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-r from-gold/30 to-gold/10 rounded-t-3xl" />
              )}
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-muted">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold font-bold text-2xl">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Name & info */}
            <div className="pt-8 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                {profile.identity_verified && (
                  <ShieldCheck className="w-5 h-5 text-gold fill-gold/20" />
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isBrand && profile.sector && (
                  <Badge variant="secondary" className="text-xs">{profile.sector}</Badge>
                )}
                {!isBrand && profile.category && (
                  <Badge variant="secondary" className="text-xs">{profile.category}</Badge>
                )}
                {profile.country && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <CountryFlag country={profile.country} size={14} />
                    {profile.country}
                  </span>
                )}
              </div>

              {profile.website && (
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-gold hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {profile.website}
                </a>
              )}
            </div>

            {/* Bio / Description */}
            {(isBrand ? profile.company_description : profile.bio) && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {isBrand ? "À propos" : "Bio"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isBrand ? profile.company_description : profile.bio}
                </p>
              </div>
            )}

            {/* Social stats (creators only) */}
            {!isBrand && socials.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Réseaux sociaux</h3>
                <div className="grid grid-cols-2 gap-2">
                  {socials.map((social) => (
                    <div
                      key={social.label}
                      className="glass-card p-3 flex items-center gap-3 rounded-xl"
                    >
                      <social.icon className={`w-5 h-5 ${social.color}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">{social.label}</p>
                        <p className="text-sm font-semibold text-foreground">{social.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View full profile button */}
            {onViewFullProfile && userId && (
              <Button
                variant="gold-outline"
                className="w-full"
                onClick={() => {
                  const uid = userId;
                  const r = role || "creator";
                  onOpenChange(false);
                  setTimeout(() => {
                    onViewFullProfile(uid, r);
                  }, 300);
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir le profil complet
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Profil introuvable
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ChatProfileSheet;
