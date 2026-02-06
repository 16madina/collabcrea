import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import CreatorDashboard from "./pages/creator/Dashboard";
import CreatorOffers from "./pages/creator/Offers";
import CreatorPortfolio from "./pages/creator/Portfolio";
import CreatorMessages from "./pages/creator/Messages";
import CreatorProfile from "./pages/creator/Profile";
import BrandDashboard from "./pages/brand/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Creator Routes */}
          <Route path="/creator/dashboard" element={<CreatorDashboard />} />
          <Route path="/creator/offers" element={<CreatorOffers />} />
          <Route path="/creator/portfolio" element={<CreatorPortfolio />} />
          <Route path="/creator/messages" element={<CreatorMessages />} />
          <Route path="/creator/profile" element={<CreatorProfile />} />
          
          {/* Brand Routes */}
          <Route path="/brand/dashboard" element={<BrandDashboard />} />
          <Route path="/brand/marketplace" element={<BrandDashboard />} />
          <Route path="/brand/create-offer" element={<BrandDashboard />} />
          <Route path="/brand/favorites" element={<BrandDashboard />} />
          <Route path="/brand/profile" element={<BrandDashboard />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
