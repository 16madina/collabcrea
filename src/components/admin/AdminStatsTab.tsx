import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  FileCheck,
  Bell,
  Ban,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

interface Stats {
  totalCreators: number;
  totalBrands: number;
  verifiedUsers: number;
  pendingVerifications: number;
  bannedUsers: number;
  totalNotifications: number;
  totalOffers: number;
  totalApplications: number;
}

const AdminStatsTab = () => {
  const [stats, setStats] = useState<Stats>({
    totalCreators: 0,
    totalBrands: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    bannedUsers: 0,
    totalNotifications: 0,
    totalOffers: 0,
    totalApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get creators count
        const { count: creatorsCount } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "creator");

        // Get brands count
        const { count: brandsCount } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "brand");

        // Get verified users
        const { count: verifiedCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("identity_verified", true);

        // Get pending verifications
        const { count: pendingCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .not("identity_document_url", "is", null)
          .eq("identity_verified", false);

        // Get banned users
        const { count: bannedCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_banned", true);

        // Get notifications count
        const { count: notificationsCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true });

        // Get offers count
        const { count: offersCount } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true });

        // Get applications count
        const { count: applicationsCount } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true });

        setStats({
          totalCreators: creatorsCount || 0,
          totalBrands: brandsCount || 0,
          verifiedUsers: verifiedCount || 0,
          pendingVerifications: pendingCount || 0,
          bannedUsers: bannedCount || 0,
          totalNotifications: notificationsCount || 0,
          totalOffers: offersCount || 0,
          totalApplications: applicationsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Créateurs",
      value: stats.totalCreators,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Marques",
      value: stats.totalBrands,
      icon: Briefcase,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Vérifiés",
      value: stats.verifiedUsers,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "En attente",
      value: stats.pendingVerifications,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Bannis",
      value: stats.bannedUsers,
      icon: Ban,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Notifications",
      value: stats.totalNotifications,
      icon: Bell,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      title: "Offres",
      value: stats.totalOffers,
      icon: FileCheck,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Candidatures",
      value: stats.totalApplications,
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chargement des statistiques...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-gold" />
        Statistiques de la plateforme
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Résumé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total utilisateurs</span>
            <span className="font-semibold">{stats.totalCreators + stats.totalBrands}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taux de vérification</span>
            <span className="font-semibold">
              {stats.totalCreators + stats.totalBrands > 0
                ? Math.round(
                    (stats.verifiedUsers / (stats.totalCreators + stats.totalBrands)) * 100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ratio créateurs/marques</span>
            <span className="font-semibold">
              {stats.totalBrands > 0
                ? (stats.totalCreators / stats.totalBrands).toFixed(1)
                : stats.totalCreators}
              :1
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsTab;
