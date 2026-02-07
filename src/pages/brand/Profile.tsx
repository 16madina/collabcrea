import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import BrandProfileHeader from "@/components/brand/BrandProfileHeader";
import BrandStats from "@/components/brand/BrandStats";
import BrandProfileTabs, { BrandProfileTabType } from "@/components/brand/BrandProfileTabs";
import SettingsSheet from "@/components/creator/SettingsSheet";
import BrandInfoTab from "@/components/brand/tabs/BrandInfoTab";
import BrandOffersTab from "@/components/brand/tabs/BrandOffersTab";
import BrandCollaborationsTab from "@/components/brand/tabs/BrandCollaborationsTab";
import BrandReviewsTab from "@/components/brand/tabs/BrandReviewsTab";
import BrandFavoritesTab from "@/components/brand/tabs/BrandFavoritesTab";
import BrandProfileEditForm from "@/components/brand/BrandProfileEditForm";
import BrandBannerEditSheet from "@/components/brand/BrandBannerEditSheet";
import BrandLogoEditSheet from "@/components/brand/BrandLogoEditSheet";
import VerificationBanner from "@/components/VerificationBanner";
import IdentityVerificationTab from "@/components/creator/IdentityVerificationTab";

interface BrandProfileData {
  company_name: string;
  company_description: string | null;
  sector: string | null;
  website: string | null;
  country: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  email_verified: boolean;
  identity_verified: boolean;
  identity_document_url: string | null;
  identity_submitted_at: string | null;
}

interface Offer {
  id: string;
  title: string;
  status: "active" | "closed" | "draft";
  category: string;
  budget_min: number;
  budget_max: number;
  applicationsCount: number;
  createdAt: string;
  deadline: string | null;
}

const BrandProfile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBannerEdit, setShowBannerEdit] = useState(false);
  const [showLogoEdit, setShowLogoEdit] = useState(false);
  const [profileData, setProfileData] = useState<BrandProfileData | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const emailConfirmationShown = useRef(false);
  const [activeTab, setActiveTab] = useState<BrandProfileTabType>(
    (searchParams.get("tab") as BrandProfileTabType) || "info"
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

      // Check if auth session shows email is verified
      const authEmailVerified = Boolean((user as any)?.email_confirmed_at || (user as any)?.confirmed_at);
      const combinedEmailVerified = (data.email_verified ?? false) || authEmailVerified;

      setProfileData({
        company_name: data.company_name || data.full_name,
        company_description: data.company_description,
        sector: data.sector,
        website: data.website,
        country: data.country,
        logo_url: data.logo_url,
        avatar_url: data.avatar_url,
        banner_url: data.banner_url,
        created_at: data.created_at,
        email_verified: combinedEmailVerified,
        identity_verified: data.identity_verified || false,
        identity_document_url: data.identity_document_url,
        identity_submitted_at: data.identity_submitted_at,
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

  const fetchOffers = async () => {
    if (!user) return;
    
    try {
      const { data: offersData, error } = await supabase
        .from("offers")
        .select(`
          id,
          title,
          status,
          category,
          budget_min,
          budget_max,
          created_at,
          deadline
        `)
        .eq("brand_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get application counts for each offer
      const offersWithCounts = await Promise.all(
        (offersData || []).map(async (offer) => {
          const { count } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("offer_id", offer.id);

          return {
            ...offer,
            applicationsCount: count || 0,
            createdAt: offer.created_at,
          } as Offer;
        })
      );

      setOffers(offersWithCounts);
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchOffers();
  }, [user]);

  // Listen for email verification event (when user clicks the verification link)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Trigger on USER_UPDATED or SIGNED_IN events (user clicked verification link)
      if ((event === 'USER_UPDATED' || event === 'SIGNED_IN') && session?.user) {
        // Check multiple indicators of email verification
        const authUser = session.user as any;
        const emailVerified = 
          authUser?.email_confirmed_at || 
          authUser?.confirmed_at || 
          authUser?.user_metadata?.email_verified === true;
        
        if (!emailVerified) return;
        
        // Check if database has different status
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("email_verified, company_name, full_name")
          .eq("user_id", session.user.id)
          .single();
        
        if (dbProfile && !dbProfile.email_verified) {
          // Email was just verified via link! Update profile
          await supabase
            .from("profiles")
            .update({ email_verified: true })
            .eq("user_id", session.user.id);
          
          // Show confirmation banner
          if (!emailConfirmationShown.current) {
            emailConfirmationShown.current = true;
            setShowEmailConfirmation(true);
          }

          // Send welcome email for brands
          const brandName = dbProfile?.company_name || dbProfile?.full_name;
          if (brandName) {
            try {
              await supabase.functions.invoke("send-welcome-email", {
                body: {
                  email: session.user.email,
                  userName: brandName,
                  userRole: "brand",
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

  // Check on initial load if email was just verified (user coming from verification link)
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user || emailConfirmationShown.current) return;
      
      const authUser = user as any;
      const authEmailVerified = authUser?.email_confirmed_at || authUser?.confirmed_at;
      
      if (authEmailVerified) {
        // Check if the verification happened recently (within last 2 minutes)
        const verifiedAt = new Date(authEmailVerified);
        const now = new Date();
        const timeDiff = now.getTime() - verifiedAt.getTime();
        const twoMinutes = 2 * 60 * 1000;
        
        if (timeDiff < twoMinutes) {
          // Check if DB wasn't updated yet
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("email_verified")
            .eq("user_id", user.id)
            .single();
          
          if (dbProfile && !dbProfile.email_verified) {
            // Update DB and show confirmation
            await supabase
              .from("profiles")
              .update({ email_verified: true })
              .eq("user_id", user.id);
            
            emailConfirmationShown.current = true;
            setShowEmailConfirmation(true);
            fetchProfile();
          }
        }
      }
    };
    
    checkEmailVerification();
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get("tab") as BrandProfileTabType;
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: BrandProfileTabType) => {
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

  const formatJoinedDate = () => {
    if (!profileData?.created_at) return null;
    const date = new Date(profileData.created_at);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const activeOffersCount = offers.filter(o => o.status === "active").length;

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
      {/* Email Verification Confirmation Banner */}
      <AnimatePresence>
        {showEmailConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-accent via-accent/90 to-accent p-4 shadow-lg"
          >
            <div className="max-w-md mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Email vérifié avec succès ! 🎉</p>
                  <p className="text-sm text-white/80">Bienvenue sur CollabCréa</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEmailConfirmation(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {isEditing && profileData && (
          <BrandProfileEditForm
            onClose={handleCloseEdit}
            initialData={{
              company_name: profileData.company_name,
              company_description: profileData.company_description,
              sector: profileData.sector,
              website: profileData.website,
              country: profileData.country,
            }}
          />
        )}
      </AnimatePresence>

      {/* Settings Sheet */}
      <SettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
      />

      {/* Banner Edit Sheet */}
      <BrandBannerEditSheet
        isOpen={showBannerEdit}
        onClose={() => setShowBannerEdit(false)}
        currentBannerUrl={profileData?.banner_url || null}
        onUpdate={fetchProfile}
      />

      {/* Logo Edit Sheet */}
      <BrandLogoEditSheet
        isOpen={showLogoEdit}
        onClose={() => setShowLogoEdit(false)}
        currentLogoUrl={profileData?.logo_url || profileData?.avatar_url}
        onUpdate={fetchProfile}
      />

      {/* Profile Header with Banner */}
      <BrandProfileHeader
        companyName={profileData?.company_name || ""}
        sector={profileData?.sector || null}
        website={profileData?.website || null}
        logoUrl={profileData?.logo_url || profileData?.avatar_url}
        bannerUrl={profileData?.banner_url || null}
        isVerified={profileData?.identity_verified || false}
        onSettingsClick={() => setShowSettings(true)}
        onEditLogo={() => setShowLogoEdit(true)}
        onEditBanner={() => setShowBannerEdit(true)}
      />

      {/* Verification Banner */}
      {profileData && (
        <div className="px-4 py-3">
          <VerificationBanner
            status={{
              email_verified: profileData.email_verified,
              identity_verified: profileData.identity_verified,
              identity_submitted_at: profileData.identity_submitted_at,
            }}
            showActions={true}
            userRole="brand"
          />
        </div>
      )}

      {/* Stats */}
      <BrandStats
        activeOffers={activeOffersCount}
        totalCollaborations={0}
        averageRating={null}
        totalSpent={null}
      />

      {/* Tabs */}
      <BrandProfileTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        offersCount={offers.length}
        collaborationsCount={0}
        reviewsCount={0}
        favoritesCount={0}
        showVerificationTab={!profileData?.identity_verified}
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
            <BrandInfoTab
              companyDescription={profileData?.company_description || null}
              sector={profileData?.sector || null}
              website={profileData?.website || null}
              country={profileData?.country || null}
              joinedDate={formatJoinedDate()}
              onEdit={() => setIsEditing(true)}
            />
          )}
          
          {activeTab === "offers" && (
            <BrandOffersTab offers={offers} />
          )}
          
          {activeTab === "collaborations" && (
            <BrandCollaborationsTab collaborations={[]} />
          )}

          {activeTab === "favorites" && (
            <BrandFavoritesTab favorites={[]} />
          )}
          
          {activeTab === "reviews" && (
            <BrandReviewsTab reviews={[]} averageRating={null} />
          )}

          {activeTab === "verification" && (
            <IdentityVerificationTab 
              identityDocumentUrl={profileData?.identity_document_url || null}
              identitySubmittedAt={profileData?.identity_submitted_at || null}
              identityVerified={profileData?.identity_verified || false}
              emailVerified={profileData?.email_verified || false}
              onUpdate={fetchProfile}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav userRole="brand" />
    </div>
  );
};

export default BrandProfile;
