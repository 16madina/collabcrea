import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, Handshake } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import MessagesTab from "@/components/collabs/MessagesTab";
import CollaborationsTab from "@/components/collabs/CollaborationsTab";
import { toast } from "sonner";

const CollabsHub = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const defaultTab = searchParams.get("tab") || "messages";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Determine user role based on URL
  const isCreator = window.location.pathname.includes("/creator");
  const userRole = isCreator ? "creator" : "brand";

  // Handle Fincra payment callback
  useEffect(() => {
    const payment = searchParams.get("payment");
    const collaborationId = searchParams.get("collaboration");
    const rawReference = searchParams.get("reference");

    const normalizedReference = (() => {
      if (!rawReference) return null;
      const decoded = decodeURIComponent(rawReference).trim();
      const nested = decoded.match(/[?&]reference=([^&]+)/);
      return (nested?.[1] ?? decoded).split("?")[0].split("&")[0];
    })();
    
    if (payment === "success" && normalizedReference && collaborationId) {
      // Verify payment with Fincra
      const verifyPayment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("fincra-verify-payment", {
            body: { reference: normalizedReference, collaborationId },
          });

          if (data?.paymentStatus === "success") {
            toast.success("Paiement confirmé ! Le contenu est maintenant en revue.");
          } else {
            toast.info("Paiement en cours de traitement. Vous serez notifié une fois confirmé.");
          }
        } catch (err) {
          console.error("Verify error:", err);
          toast.info("Paiement en cours de vérification...");
        }
      };

      verifyPayment();
      setSearchParams({ tab: "collabs" });
      setActiveTab("collabs");
    } else if (payment === "success") {
      toast.success("Paiement effectué avec succès !");
      setSearchParams({ tab: "collabs" });
      setActiveTab("collabs");
    } else if (payment === "cancelled") {
      toast.info("Paiement annulé");
      setSearchParams({ tab: "collabs" });
      setActiveTab("collabs");
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl font-bold text-gold-gradient">
            Collaborations
          </h1>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="collabs" className="flex items-center gap-2">
              <Handshake className="w-4 h-4" />
              Collabs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-0">
            <MessagesTab userRole={userRole} />
          </TabsContent>

          <TabsContent value="collabs" className="mt-0">
            <CollaborationsTab userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default CollabsHub;