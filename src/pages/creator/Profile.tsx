import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  email_verified: boolean;
  identity_verified: boolean;
  identity_document_url: string | null;
  identity_submitted_at: string | null;
  avatar_url: string | null;
  created_at: string;
}

const CreatorProfile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPricingSheet, setShowPricingSheet] = useState(false);
  const [showSocialSheet, setShowSocialSheet] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTabType>(
    (searchParams.get("tab") as ProfileTabType) || "info"
  );

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
        email_verified: data.email_verified ?? false,
        identity_verified: data.identity_verified ?? false,
        identity_document_url: data.identity_document_url,
        identity_submitted_at: data.identity_submitted_at,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
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
        isVerified={isFullyVerified}
        isEmailVerified={profileData?.email_verified || false}
        isIdentityVerified={profileData?.identity_verified || false}
        onSettingsClick={() => setShowSettings(true)}
        onVerifyClick={() => handleTabChange("verification")}
        onEditAvatar={() => setIsEditing(true)}
        onEditBanner={() => setIsEditing(true)}
      />

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
              socialAccounts={socialAccounts}
              joinedDate={formatJoinedDate()}
              onEditBio={() => setIsEditing(true)}
              onEditSocial={() => setShowSocialSheet(true)}
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

      <BottomNav userRole="creator" />
    </div>
  );
};

export default CreatorProfile;
