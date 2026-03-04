import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import SplashScreen from "@/components/SplashScreen";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Explore from "./pages/Explore";
import Contact from "./pages/Contact";
import CreatorOffers from "./pages/creator/Offers";
import CreatorPortfolio from "./pages/creator/Portfolio";
import CreatorProfile from "./pages/creator/Profile";
import CreatorWallet from "./pages/creator/Wallet";
import BrandProfile from "./pages/brand/Profile";
import BrandMarketplace from "./pages/brand/Marketplace";
import BrandOffers from "./pages/brand/Offers";
import CreateOffer from "./pages/brand/CreateOffer";
import CollabsHub from "./pages/CollabsHub";
import AdminDashboard from "./pages/admin/Dashboard";
import NotFound from "./pages/NotFound";
import ProfileView from "./pages/ProfileView";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ChildSafety from "./pages/ChildSafety";

const queryClient = new QueryClient();

// Component to initialize push notifications
const PushNotificationInitializer = () => {
  usePushNotifications();
  return null;
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  useEffect(() => {
    // Check if user has seen splash in this session
    const seen = sessionStorage.getItem("hasSeenSplash");
    if (seen) {
      setShowSplash(false);
      setHasSeenSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
    sessionStorage.setItem("hasSeenSplash", "true");
  };

  return (
    <>
      {showSplash && !hasSeenSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      <PushNotificationInitializer />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/child-safety" element={<ChildSafety />} />
          <Route path="/profile/:userId" element={<ProfileView />} />
          <Route path="/user-details/:userId" element={<ProfileView />} />
          {/* Creator Routes */}
          <Route path="/creator/dashboard" element={<Navigate to="/creator/profile" replace />} />
          <Route path="/creator/offers" element={<CreatorOffers />} />
          <Route path="/creator/portfolio" element={<CreatorPortfolio />} />
          <Route path="/creator/collabs" element={<CollabsHub />} />
          <Route path="/creator/messages" element={<Navigate to="/creator/collabs?tab=messages" replace />} />
          <Route path="/creator/profile" element={<CreatorProfile />} />
          <Route path="/creator/wallet" element={<CreatorWallet />} />
          
          {/* Brand Routes */}
          <Route path="/brand/dashboard" element={<Navigate to="/brand/profile" replace />} />
          <Route path="/brand/marketplace" element={<BrandMarketplace />} />
          <Route path="/brand/offers" element={<BrandOffers />} />
          <Route path="/brand/create-offer" element={<CreateOffer />} />
          <Route path="/brand/edit-offer/:offerId" element={<CreateOffer />} />
          <Route path="/brand/collabs" element={<CollabsHub />} />
          <Route path="/brand/messages" element={<Navigate to="/brand/collabs?tab=messages" replace />} />
          <Route path="/brand/profile" element={<BrandProfile />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Generic redirects */}
          <Route path="/messages" element={<Navigate to="/creator/collabs?tab=messages" replace />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
