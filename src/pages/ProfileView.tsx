import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Globe, ShieldCheck, Star, User, CreditCard, Image } from "lucide-react";
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
  const isBrand = role === "brand";
  // For creators, use avatar as hero image; for brands use logo
  const heroImage = isBrand
    ? (profile.banner_url || profile.logo_url)
    : (profile.avatar_url || profile.banner_url);
  const avatarUrl = isBrand ? (profile.logo_url || profile.avatar_url) : profile.avatar_url;

  const socials = [
    { icon: FaYoutube, value: profile.youtube_followers, color: "text-red-500", bg: "bg-[#FF0000]", label: "YouTube" },
    { icon: FaInstagram, value: profile.instagram_followers, color: "text-pink-500", bg: "bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]", label: "Instagram" },
    { icon: FaTiktok, value: profile.tiktok_followers, color: "text-foreground", bg: "bg-black", label: "TikTok" },
    { icon: FaFacebookF, value: profile.facebook_followers, color: "text-blue-500", bg: "bg-[#1877F2]", label: "Facebook" },
    { icon: FaSnapchatGhost, value: profile.snapchat_followers, color: "text-yellow-400", bg: "bg-[#FFFC00]", label: "Snapchat", iconColor: "text-black" },
  ].filter((s) => s.value);

  const pricing = Array.isArray(profile.pricing) ? profile.pricing : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero photo - like CreatorDetailSheet */}
      <div className="relative">
        {heroImage ? (
          <div className="aspect-[4/3] overflow-hidden">
            <img src={heroImage} alt={displayName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-gold/30 via-purple-500/20 to-gold/10 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-gold font-bold text-5xl">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-[max(env(safe-area-inset-top),0.75rem)] left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Info overlay on hero */}
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            {!isBrand && profile.category && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold text-primary-foreground">
                {profile.category}
              </span>
            )}
            {isBrand && profile.sector && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold text-primary-foreground">
                {profile.sector}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
            {profile.identity_verified && <ShieldCheck className="w-5 h-5 text-gold fill-gold/20" />}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {profile.country && (
              <>
                <CountryFlag country={profile.country} size={18} />
                <MapPin className="w-3 h-3" />
                <span>{profile.country}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content - Tabs for creators, simple info for brands */}
      {!isBrand && userId ? (
        <div className="px-6 pt-4 pb-8">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1 rounded-xl mb-4">
              <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                <User className="w-4 h-4 mr-1.5" />
                Infos
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                <Image className="w-4 h-4 mr-1.5" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                <CreditCard className="w-4 h-4 mr-1.5" />
                Tarifs
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-6">
              {profile.bio && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">À propos</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                </div>
              )}

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

              {socials.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3 italic">Réseaux sociaux</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {socials.map((social) => (
                      <div key={social.label} className="glass rounded-xl p-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${social.bg} flex items-center justify-center`}>
                          <social.icon className={`w-5 h-5 ${social.iconColor || "text-white"}`} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{social.label}</p>
                          <p className="font-semibold text-foreground">{social.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <PortfolioTab userId={userId} />
            </TabsContent>

            {/* Pricing Tab */}
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
      ) : (
        /* Brand info section */
        <div className="px-6 pt-4 pb-8 space-y-4">
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
          {profile.company_description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground">À propos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.company_description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
