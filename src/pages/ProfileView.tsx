import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Globe, ShieldCheck } from "lucide-react";
import { FaYoutube, FaInstagram, FaTiktok, FaSnapchatGhost, FaFacebookF } from "react-icons/fa";
import { supabase } from "@/integrations/supabase/client";
import { CountryFlag } from "@/lib/flags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioTab from "@/components/creator/tabs/PortfolioTab";
import RateCardDisplay from "@/components/creator/RateCardDisplay";

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
  pricing: any;
}

const ProfileView = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      setLoading(true);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, company_name, company_description, avatar_url, logo_url, banner_url, bio, category, country, sector, website, followers, youtube_followers, instagram_followers, tiktok_followers, snapchat_followers, facebook_followers, identity_verified, residence_country, pricing")
        .eq("user_id", userId)
        .single();
      setProfile(profileData);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      setRole(roleData?.role || null);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profil introuvable</p>
        <Button variant="gold-outline" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  const displayName = profile.company_name || profile.full_name;
  const avatarUrl = profile.logo_url || profile.avatar_url;
  const isBrand = role === "brand";

  const socials = [
    { icon: FaYoutube, value: profile.youtube_followers, color: "text-red-500", label: "YouTube" },
    { icon: FaInstagram, value: profile.instagram_followers, color: "text-pink-500", label: "Instagram" },
    { icon: FaTiktok, value: profile.tiktok_followers, color: "text-foreground", label: "TikTok" },
    { icon: FaFacebookF, value: profile.facebook_followers, color: "text-blue-500", label: "Facebook" },
    { icon: FaSnapchatGhost, value: profile.snapchat_followers, color: "text-yellow-400", label: "Snapchat" },
  ].filter((s) => s.value);

  const pricing = Array.isArray(profile.pricing) ? profile.pricing : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-44 bg-gradient-to-r from-gold/30 to-gold/10" />
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-[max(env(safe-area-inset-top),0.75rem)] left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-muted">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gold/20 flex items-center justify-center">
                <span className="text-gold font-bold text-3xl">{displayName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-6 pt-16 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          {profile.identity_verified && <ShieldCheck className="w-5 h-5 text-gold fill-gold/20" />}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isBrand && profile.sector && <Badge variant="secondary">{profile.sector}</Badge>}
          {!isBrand && profile.category && <Badge variant="secondary">{profile.category}</Badge>}
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

        {/* Bio / Description */}
        {(isBrand ? profile.company_description : profile.bio) && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{isBrand ? "À propos" : "Bio"}</h3>
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
                <div key={social.label} className="glass-card p-3 flex items-center gap-3 rounded-xl">
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
      </div>

      {/* Tabs for creators */}
      {!isBrand && userId && (
        <div className="px-6 pb-8">
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="portfolio" className="flex-1">Portfolio</TabsTrigger>
              <TabsTrigger value="pricing" className="flex-1">Tarifs</TabsTrigger>
            </TabsList>
            <TabsContent value="portfolio">
              <PortfolioTab userId={userId} />
            </TabsContent>
            <TabsContent value="pricing">
              {pricing.length > 0 ? (
                <RateCardDisplay
                  pricing={pricing}
                  avatarUrl={avatarUrl || undefined}
                  fullName={displayName}
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucun tarif renseigné</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
