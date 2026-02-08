import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, Handshake } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import MessagesTab from "@/components/collabs/MessagesTab";
import CollaborationsTab from "@/components/collabs/CollaborationsTab";

const CollabsHub = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const unreadMessages = useUnreadMessages();
  
  const defaultTab = searchParams.get("tab") || "messages";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Determine user role based on URL
  const isCreator = window.location.pathname.includes("/creator");
  const userRole = isCreator ? "creator" : "brand";

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
              {unreadMessages > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] bg-gold text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
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