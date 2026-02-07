import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useYouTubeSync } from "@/hooks/useYouTubeSync";
import { useTikTokSync } from "@/hooks/useTikTokSync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ProfileEditForm from "@/components/creator/ProfileEditForm";
import ProfileHeader from "@/components/creator/ProfileHeader";
import ProfileStats from "@/components/creator/ProfileStats";
import ProfileTabs, { ProfileTabType } from "@/components/creator/ProfileTabs";
import SettingsSheet from "@/components/creator/SettingsSheet";
import InfoTab from "@/components/creator/tabs/InfoTab";
import PricingTab from "@/components/creator/tabs/PricingTab";
import OffersTab from "@/components/creator/tabs/OffersTab";
import ReviewsTab from "@/components/creator/tabs/ReviewsTab";
import IdentityVerificationTab from "@/components/creator/IdentityVerificationTab";
import PricingEditSheet from "@/components/creator/PricingEditSheet";
import SocialEditSheet from "@/components/creator/SocialEditSheet";
import AvatarEditSheet from "@/components/creator/AvatarEditSheet";
import BannerEditSheet from "@/components/creator/BannerEditSheet";
import BioEditSheet from "@/components/creator/BioEditSheet";
import ResidenceEditSheet from "@/components/creator/ResidenceEditSheet";
import PortfolioEditSheet from "@/components/creator/PortfolioEditSheet";

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
  residence_country: string | null;
  youtube_followers: string | null;
  instagram_followers: string | null;
  tiktok_followers: string | null;
  snapchat_followers: string | null;
  pricing: PricingItem[] | null;
  email_verified: boolean;
  identity_verified: boolean;
  identity_document_url: string | null;
  identity_submitted_at: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
}

const CreatorProfile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { handleOAuthCallback: handleYouTubeCallback } = useYouTubeSync();
  const { handleOAuthCallback: handleTikTokCallback } = useTikTokSync();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPricingSheet, setShowPricingSheet] = useState(false);
  const [showSocialSheet, setShowSocialSheet] = useState(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showBannerSheet, setShowBannerSheet] = useState(false);
  const [showBioSheet, setShowBioSheet] = useState(false);
  const [showResidenceSheet, setShowResidenceSheet] = useState(false);
  const [showPortfolioSheet, setShowPortfolioSheet] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTabType>(
    (searchParams.get("tab") as ProfileTabType) || "info"
  );

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const authEmailVerified = Boolean((user as any)?.email_confirmed_at || (user as any)?.confirmed_at);
      const combinedEmailVerified = (data.email_verified ?? false) || authEmailVerified;

      setProfileData({
        full_name: data.full_name,
        bio: data.bio,
        category: data.category,
        country: data.country,
        residence_country: data.residence_country,
        youtube_followers: data.youtube_followers,
        instagram_followers: data.instagram_followers,
        tiktok_followers: data.tiktok_followers,
        snapchat_followers: data.snapchat_followers,
        pricing: data.pricing as unknown as PricingItem[] | null,
        email_verified: combinedEmailVerified,
        identity_verified: data.identity_verified ?? false,
        identity_document_url: data.identity_document_url,
        identity_submitted_at: data.identity_submitted_at,
        avatar_url: data.avatar_url,
        banner_url: data.banner_url,
        created_at: data.created_at,
      });

      // Keep DB flag in sync when the auth email is already verified
      if (authEmailVerified && !data.email_verified) {
        supabase
          .from("profiles")
          .update({ email_verified: true })
          .eq("user_id", user.id)
          .then(
            () => undefined,
            () => undefined,
          );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Listen for email verification event (when user clicks the verification link)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only trigger on USER_UPDATED event (user clicked verification link)
      if (event === 'USER_UPDATED' && session?.user) {
        const userMeta = session.user.user_metadata;
        const emailVerified = userMeta?.email_verified === true;
        
        // Check if database has different status
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("email_verified, full_name")
          .eq("user_id", session.user.id)
          .single();
        
        if (emailVerified && dbProfile && !dbProfile.email_verified) {
          // Email was just verified via link! Update profile
          await supabase
            .from("profiles")
            .update({ email_verified: true })
            .eq("user_id", session.user.id);
          
          toast.success("Email vérifié avec succès ! ✅", {
            description: "Vous pouvez maintenant accéder à toutes les fonctionnalités.",
          });

          // Send welcome email
          if (dbProfile?.full_name) {
            try {
              await supabase.functions.invoke("send-welcome-email", {
                body: {
                  email: session.user.email,
                  userName: dbProfile.full_name.split(" ")[0],
                  userRole: "creator",
                },
              });
              console.log("Welcome email sent successfully");
            } catch (emailError) {
              console.error("Failed to send welcome email:", emailError);
            }
          }
          
          fetchProfile();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle OAuth callbacks from YouTube and TikTok
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      // Clear URL params
      setSearchParams({});
      return;
    }

    if (code && state && user) {
      // Determine which OAuth flow this is based on stored session data
      const tiktokVerifier = sessionStorage.getItem("tiktok_code_verifier");
      const youtubeRedirectUri = sessionStorage.getItem("youtube_redirect_uri");

      if (tiktokVerifier) {
        // This is a TikTok callback
        handleTikTokCallback(code, state)
          .then(() => fetchProfile())
          .catch((err) => console.error("TikTok sync failed:", err))
          .finally(() => setSearchParams({}));
      } else if (youtubeRedirectUri) {
        // This is a YouTube callback
        handleYouTubeCallback(code, state)
          .then(() => fetchProfile())
          .catch((err) => console.error("YouTube sync failed:", err))
          .finally(() => setSearchParams({}));
      } else {
        // Unknown callback, clear params
        setSearchParams({});
      }
    }
  }, [searchParams, user]);

  useEffect(() => {
    const tab = searchParams.get("tab") as ProfileTabType;
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: ProfileTabType) => {
    setActiveTab(tab);
    if (tab !== "info") {
      setSearchParams({ tab });
    } else {
      setSearchParams({});
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
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
      accounts.push({ platform: "YouTube", followers: profileData.youtube_followers });
    }
    if (profileData.instagram_followers) {
      accounts.push({ platform: "Instagram", followers: profileData.instagram_followers });
    }
    if (profileData.tiktok_followers) {
      accounts.push({ platform: "TikTok", followers: profileData.tiktok_followers });
    }
    if (profileData.snapchat_followers) {
      accounts.push({ platform: "Snapchat", followers: profileData.snapchat_followers });
    }
    return accounts;
  };

  const formatJoinedDate = () => {
    if (!profileData?.created_at) return null;
    const date = new Date(profileData.created_at);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const socialAccounts = getSocialAccounts();
  const isFullyVerified = profileData?.email_verified && profileData?.identity_verified;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </motion.div>
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

      {/* Settings Sheet */}
      <SettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
      />

      {/* Profile Header with Banner */}
      <ProfileHeader
        fullName={profileData?.full_name || ""}
        category={profileData?.category || null}
        country={profileData?.country || null}
        avatarUrl={profileData?.avatar_url}
        bannerUrl={profileData?.banner_url}
        isVerified={isFullyVerified}
        isEmailVerified={profileData?.email_verified || false}
        isIdentityVerified={profileData?.identity_verified || false}
        onSettingsClick={() => setShowSettings(true)}
        onVerifyClick={() => handleTabChange("verification")}
        onEditAvatar={() => setShowAvatarSheet(true)}
        onEditBanner={() => setShowBannerSheet(true)}
      />

      {/* Portfolio Button - Prominent CTA */}
      <div className="px-4 py-3">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setShowPortfolioSheet(true)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border border-gold/30 hover:border-gold/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Mon Portfolio</p>
              <p className="text-xs text-muted-foreground">Photos, vidéos et réalisations</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </motion.button>
      </div>

      {/* Stats */}
      <ProfileStats
        totalFollowers={getTotalFollowers()}
        rating={null}
        collaborations={0}
        engagementRate={null}
      />

      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showVerificationBadge={!isFullyVerified}
        offersCount={0}
        reviewsCount={0}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "info" && (
            <InfoTab
              bio={profileData?.bio || null}
              country={profileData?.country || null}
              residenceCountry={profileData?.residence_country || null}
              socialAccounts={socialAccounts}
              joinedDate={formatJoinedDate()}
              onEditBio={() => setShowBioSheet(true)}
              onEditSocial={() => setShowSocialSheet(true)}
              onEditResidence={() => setShowResidenceSheet(true)}
            />
          )}
          
          {activeTab === "pricing" && (
            <PricingTab
              pricing={profileData?.pricing || null}
              onEditPricing={() => setShowPricingSheet(true)}
            />
          )}
          
          {activeTab === "offers" && (
            <OffersTab applications={[]} />
          )}
          
          {activeTab === "reviews" && (
            <ReviewsTab reviews={[]} averageRating={null} />
          )}
          
          {activeTab === "verification" && profileData && (
            <IdentityVerificationTab
              identityVerified={profileData.identity_verified}
              identityDocumentUrl={profileData.identity_document_url}
              identitySubmittedAt={profileData.identity_submitted_at}
              emailVerified={profileData.email_verified}
              onUpdate={fetchProfile}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pricing Edit Sheet */}
      <PricingEditSheet
        isOpen={showPricingSheet}
        onClose={() => setShowPricingSheet(false)}
        initialPricing={profileData?.pricing || null}
        onUpdate={fetchProfile}
      />

      {/* Social Edit Sheet */}
      <SocialEditSheet
        isOpen={showSocialSheet}
        onClose={() => setShowSocialSheet(false)}
        initialData={{
          youtube_followers: profileData?.youtube_followers || null,
          instagram_followers: profileData?.instagram_followers || null,
          tiktok_followers: profileData?.tiktok_followers || null,
          snapchat_followers: profileData?.snapchat_followers || null,
        }}
        onUpdate={fetchProfile}
      />

      {/* Avatar Edit Sheet */}
      <AvatarEditSheet
        isOpen={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        currentAvatarUrl={profileData?.avatar_url || null}
        onUpdate={fetchProfile}
      />

      {/* Banner Edit Sheet */}
      <BannerEditSheet
        isOpen={showBannerSheet}
        onClose={() => setShowBannerSheet(false)}
        currentBannerUrl={profileData?.banner_url || null}
        onUpdate={fetchProfile}
      />

      {/* Bio Edit Sheet */}
      <BioEditSheet
        isOpen={showBioSheet}
        onClose={() => setShowBioSheet(false)}
        currentBio={profileData?.bio || null}
        onUpdate={fetchProfile}
      />

      {/* Residence Edit Sheet */}
      <ResidenceEditSheet
        isOpen={showResidenceSheet}
        onClose={() => setShowResidenceSheet(false)}
        currentResidence={profileData?.residence_country || null}
        onUpdate={fetchProfile}
      />

      {/* Portfolio Edit Sheet */}
      <PortfolioEditSheet
        isOpen={showPortfolioSheet}
        onClose={() => setShowPortfolioSheet(false)}
      />

      <BottomNav userRole="creator" />
    </div>
  );
};

export default CreatorProfile;
