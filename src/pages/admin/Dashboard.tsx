import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Bell, FileCheck, BarChart3, LogOut, Flag, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminVerificationTab from "@/components/admin/AdminVerificationTab";
import AdminNotificationsTab from "@/components/admin/AdminNotificationsTab";
import AdminStatsTab from "@/components/admin/AdminStatsTab";
import AdminModerationTab from "@/components/admin/AdminModerationTab";
import AdminCommissionsTab from "@/components/admin/AdminCommissionsTab";
import logoCollabCrea from "@/assets/logo-collabcrea.png";

const AdminDashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!adminLoading && !isAdmin && user) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gold">Chargement...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoCollabCrea} alt="CollabCréa" className="h-8" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" />
              <span className="font-display font-bold text-gold">Admin Panel</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-6 mb-6">
            <TabsTrigger value="users" className="flex items-center gap-1 text-xs">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-1 text-xs">
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Identités</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-1 text-xs">
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">Modération</span>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-1 text-xs">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Commissions</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifs</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1 text-xs">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>

          <TabsContent value="verification">
            <AdminVerificationTab />
          </TabsContent>

          <TabsContent value="moderation">
            <AdminModerationTab />
          </TabsContent>

          <TabsContent value="commissions">
            <AdminCommissionsTab />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotificationsTab />
          </TabsContent>

          <TabsContent value="stats">
            <AdminStatsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
