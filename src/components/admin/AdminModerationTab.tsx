import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Flag,
  User,
  FileWarning,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Report {
  id: string;
  reporter_id: string;
  report_type: "user" | "offer" | "fraud";
  target_user_id: string | null;
  target_offer_id: string | null;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reporter?: {
    full_name: string;
    avatar_url: string | null;
  };
  target_user?: {
    full_name: string;
    avatar_url: string | null;
    user_id: string;
  };
  target_offer?: {
    title: string;
    brand_id: string;
  };
}

const AdminModerationTab = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<"all" | "user" | "offer" | "fraud">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | "ban">("resolve");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeType !== "all") {
        query = query.eq("report_type", activeType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch additional data for each report
      const enrichedReports = await Promise.all(
        (data || []).map(async (report) => {
          const enriched: Report = { ...report } as Report;

          // Get reporter info
          const { data: reporterData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", report.reporter_id)
            .maybeSingle();

          if (reporterData) {
            enriched.reporter = reporterData;
          }

          // Get target user info
          if (report.target_user_id) {
            const { data: targetUserData } = await supabase
              .from("profiles")
              .select("full_name, avatar_url, user_id")
              .eq("user_id", report.target_user_id)
              .maybeSingle();

            if (targetUserData) {
              enriched.target_user = targetUserData;
            }
          }

          // Get target offer info
          if (report.target_offer_id) {
            const { data: targetOfferData } = await supabase
              .from("offers")
              .select("title, brand_id")
              .eq("id", report.target_offer_id)
              .maybeSingle();

            if (targetOfferData) {
              enriched.target_offer = targetOfferData;
            }
          }

          return enriched;
        })
      );

      setReports(enrichedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les signalements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeType]);

  const handleAction = async () => {
    if (!currentUser || !selectedReport) return;
    setIsProcessing(true);

    try {
      const newStatus = actionType === "dismiss" ? "dismissed" : "resolved";

      // Update report status
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedReport.id);

      if (updateError) throw updateError;

      // If banning user
      if (actionType === "ban" && selectedReport.target_user_id) {
        const { error: banError } = await supabase
          .from("profiles")
          .update({
            is_banned: true,
            ban_reason: adminNotes || "Compte banni suite à un signalement",
            banned_at: new Date().toISOString(),
          })
          .eq("user_id", selectedReport.target_user_id);

        if (banError) throw banError;

        // Notify banned user
        await supabase.from("notifications").insert({
          user_id: selectedReport.target_user_id,
          title: "Compte suspendu",
          message: adminNotes || "Votre compte a été suspendu suite à un signalement.",
          type: "error",
          created_by: currentUser.id,
        });
      }

      // Log the action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: `report_${actionType}`,
        target_user_id: selectedReport.target_user_id,
        details: {
          report_id: selectedReport.id,
          report_type: selectedReport.report_type,
          notes: adminNotes,
        },
      });

      toast({
        title: actionType === "dismiss" ? "Signalement rejeté" : "Signalement traité",
        description: actionType === "ban" 
          ? "L'utilisateur a été banni" 
          : "Le signalement a été traité avec succès",
      });

      setShowActionDialog(false);
      setShowDetailSheet(false);
      setAdminNotes("");
      fetchReports();
    } catch (error) {
      console.error("Error processing report:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le signalement",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">En attente</Badge>;
      case "reviewed":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">En cours</Badge>;
      case "resolved":
        return <Badge variant="outline" className="border-green-500 text-green-500">Résolu</Badge>;
      case "dismissed":
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Rejeté</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "offer":
        return <FileWarning className="w-4 h-4" />;
      case "fraud":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "user":
        return "Utilisateur";
      case "offer":
        return "Annonce";
      case "fraud":
        return "Fraude";
      default:
        return type;
    }
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chargement des signalements...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Flag className="w-5 h-5 text-destructive" />
        <h3 className="font-semibold">
          Modération ({pendingCount} en attente)
        </h3>
      </div>

      {/* Type filter tabs */}
      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as typeof activeType)}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
          <TabsTrigger value="user" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="offer" className="text-xs">
            <FileWarning className="w-3 h-3 mr-1" />
            Annonces
          </TabsTrigger>
          <TabsTrigger value="fraud" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Fraudes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reports list */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p>Aucun signalement {activeType !== "all" ? `de type "${getTypeLabel(activeType)}"` : ""}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className={`overflow-hidden ${report.status === "pending" ? "border-yellow-500/50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    report.report_type === "fraud" 
                      ? "bg-destructive/10 text-destructive" 
                      : report.report_type === "user" 
                        ? "bg-orange-500/10 text-orange-500" 
                        : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {getTypeIcon(report.report_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{getTypeLabel(report.report_type)}</span>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <p className="text-sm text-foreground line-clamp-2">{report.reason}</p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(report.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </div>

                    {report.target_user && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={report.target_user.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {report.target_user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          Cible: {report.target_user.full_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowDetailSheet(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[85vh]">
          {selectedReport && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {getTypeIcon(selectedReport.report_type)}
                  Signalement - {getTypeLabel(selectedReport.report_type)}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4 overflow-y-auto pb-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  {getStatusBadge(selectedReport.status)}
                </div>

                {/* Reporter info */}
                {selectedReport.reporter && (
                  <div className="p-4 glass rounded-xl">
                    <h4 className="text-sm font-semibold mb-2">Signalé par</h4>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedReport.reporter.avatar_url || undefined} />
                        <AvatarFallback>
                          {selectedReport.reporter.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedReport.reporter.full_name}</span>
                    </div>
                  </div>
                )}

                {/* Target info */}
                {selectedReport.target_user && (
                  <div className="p-4 glass rounded-xl">
                    <h4 className="text-sm font-semibold mb-2">Utilisateur signalé</h4>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedReport.target_user.avatar_url || undefined} />
                        <AvatarFallback>
                          {selectedReport.target_user.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedReport.target_user.full_name}</span>
                    </div>
                  </div>
                )}

                {selectedReport.target_offer && (
                  <div className="p-4 glass rounded-xl">
                    <h4 className="text-sm font-semibold mb-2">Annonce signalée</h4>
                    <p className="font-medium">{selectedReport.target_offer.title}</p>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Motif du signalement</h4>
                  <p className="text-sm p-3 glass rounded-lg">{selectedReport.reason}</p>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Description détaillée</h4>
                    <p className="text-sm p-3 glass rounded-lg text-muted-foreground">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                {/* Admin notes if already processed */}
                {selectedReport.admin_notes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Notes admin</h4>
                    <p className="text-sm p-3 glass rounded-lg text-muted-foreground">
                      {selectedReport.admin_notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selectedReport.status === "pending" && (
                  <div className="grid grid-cols-3 gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionType("dismiss");
                        setShowActionDialog(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeter
                    </Button>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setActionType("resolve");
                        setShowActionDialog(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Résoudre
                    </Button>
                    {selectedReport.target_user_id && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setActionType("ban");
                          setShowActionDialog(true);
                        }}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Bannir
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Action Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "dismiss" && "Rejeter le signalement"}
              {actionType === "resolve" && "Résoudre le signalement"}
              {actionType === "ban" && "Bannir l'utilisateur"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "ban" 
                ? "L'utilisateur sera banni et ne pourra plus accéder à la plateforme."
                : "Ajoutez une note pour documenter votre décision."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Notes (optionnel)..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === "ban" ? "bg-destructive hover:bg-destructive/90" : ""}
              disabled={isProcessing}
            >
              {isProcessing ? "..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminModerationTab;
