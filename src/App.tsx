import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import CreatorDashboard from "./pages/creator/Dashboard";
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
          <Route path="/creator/offers" element={<CreatorDashboard />} />
          <Route path="/creator/portfolio" element={<CreatorDashboard />} />
          <Route path="/creator/messages" element={<CreatorDashboard />} />
          <Route path="/creator/profile" element={<CreatorDashboard />} />
          
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
