import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Explore from "./pages/Explore";
import Contact from "./pages/Contact";
import Messages from "./pages/Messages";
import CreatorOffers from "./pages/creator/Offers";
import CreatorPortfolio from "./pages/creator/Portfolio";
import CreatorMessages from "./pages/creator/Messages";
import CreatorProfile from "./pages/creator/Profile";
import BrandProfile from "./pages/brand/Profile";
import BrandDashboard from "./pages/brand/Dashboard";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            
            {/* Creator Routes */}
            <Route path="/creator/dashboard" element={<Navigate to="/creator/profile" replace />} />
            <Route path="/creator/offers" element={<CreatorOffers />} />
            <Route path="/creator/portfolio" element={<CreatorPortfolio />} />
            <Route path="/creator/messages" element={<CreatorMessages />} />
            <Route path="/creator/profile" element={<CreatorProfile />} />
            
            {/* Brand Routes */}
            <Route path="/brand/dashboard" element={<Navigate to="/brand/profile" replace />} />
            <Route path="/brand/marketplace" element={<BrandDashboard />} />
            <Route path="/brand/create-offer" element={<BrandDashboard />} />
            <Route path="/brand/favorites" element={<BrandDashboard />} />
            <Route path="/brand/profile" element={<BrandProfile />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
