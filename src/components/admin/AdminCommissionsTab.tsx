import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CollaborationWithFee {
  id: string;
  agreed_amount: number;
  platform_fee: number;
  creator_amount: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  offer: {
    title: string;
  } | null;
  creator_profile: {
    full_name: string;
  } | null;
  brand_profile: {
    full_name: string;
    company_name: string | null;
  } | null;
}

interface CommissionStats {
  totalCommissions: number;
  completedCommissions: number;
  pendingCommissions: number;
  thisMonthCommissions: number;
  collaborationsCount: number;
}

const AdminCommissionsTab = () => {
  const [collaborations, setCollaborations] = useState<CollaborationWithFee[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    completedCommissions: 0,
    pendingCommissions: 0,
    thisMonthCommissions: 0,
    collaborationsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      // Fetch all collaborations with platform fees
      const { data: collabsData, error } = await supabase
        .from("collaborations")
        .select(`
          id,
          agreed_amount,
          platform_fee,
          creator_amount,
          status,
          created_at,
          approved_at,
          offer_id,
          creator_id,
          brand_id
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data
      const collaborationsWithDetails: CollaborationWithFee[] = [];
      
      for (const collab of collabsData || []) {
        // Get offer details
        const { data: offer } = await supabase
          .from("offers")
          .select("title")
          .eq("id", collab.offer_id)
          .maybeSingle();

        // Get creator profile
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", collab.creator_id)
          .maybeSingle();

        // Get brand profile
        const { data: brandProfile } = await supabase
          .from("profiles")
          .select("full_name, company_name")
          .eq("user_id", collab.brand_id)
          .maybeSingle();

        collaborationsWithDetails.push({
          ...collab,
          offer,
          creator_profile: creatorProfile,
          brand_profile: brandProfile,
        });
      }

      setCollaborations(collaborationsWithDetails);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalCommissions = collaborationsWithDetails.reduce(
        (sum, c) => sum + (c.platform_fee || 0),
        0
      );

      const completedCommissions = collaborationsWithDetails
        .filter((c) => c.status === "completed")
        .reduce((sum, c) => sum + (c.platform_fee || 0), 0);

      const pendingCommissions = collaborationsWithDetails
        .filter((c) => c.status !== "completed" && c.status !== "cancelled")
        .reduce((sum, c) => sum + (c.platform_fee || 0), 0);

      const thisMonthCommissions = collaborationsWithDetails
        .filter((c) => new Date(c.created_at) >= startOfMonth)
        .reduce((sum, c) => sum + (c.platform_fee || 0), 0);

      setStats({
        totalCommissions,
        completedCommissions,
        pendingCommissions,
        thisMonthCommissions,
        collaborationsCount: collaborationsWithDetails.length,
      });
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_payment: { label: "En attente paiement", variant: "outline" },
      in_progress: { label: "En cours", variant: "secondary" },
      content_submitted: { label: "Contenu soumis", variant: "secondary" },
      revision_requested: { label: "Révision demandée", variant: "outline" },
      completed: { label: "Terminé", variant: "default" },
      cancelled: { label: "Annulé", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chargement des commissions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-semibold flex items-center gap-2">
        <Coins className="w-5 h-5 text-gold" />
        Commissions de la plateforme
      </h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatAmount(stats.completedCommissions)}</p>
                <p className="text-xs text-muted-foreground">Commissions perçues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatAmount(stats.pendingCommissions)}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/10">
                <Coins className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatAmount(stats.totalCommissions)}</p>
                <p className="text-xs text-muted-foreground">Total cumulé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatAmount(stats.thisMonthCommissions)}</p>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Résumé financier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre de collaborations</span>
            <span className="font-semibold">{stats.collaborationsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taux de commission</span>
            <span className="font-semibold">10%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission moyenne</span>
            <span className="font-semibold">
              {stats.collaborationsCount > 0
                ? formatAmount(Math.round(stats.totalCommissions / stats.collaborationsCount))
                : "0 FCFA"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Collaborations Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Historique des commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {collaborations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Aucune collaboration enregistrée
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Offre</TableHead>
                    <TableHead>Marque</TableHead>
                    <TableHead>Créateur</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborations.map((collab) => (
                    <TableRow key={collab.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(collab.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {collab.offer?.title || "N/A"}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate">
                        {collab.brand_profile?.company_name || collab.brand_profile?.full_name || "N/A"}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate">
                        {collab.creator_profile?.full_name || "N/A"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatAmount(collab.agreed_amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-semibold text-gold">
                        {formatAmount(collab.platform_fee)}
                      </TableCell>
                      <TableCell>{getStatusBadge(collab.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCommissionsTab;
