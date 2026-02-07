import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  FileCheck,
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PendingVerification {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  country: string | null;
  category: string | null;
  identity_document_url: string | null;
  identity_submitted_at: string | null;
  bio: string | null;
}

const AdminVerificationTab = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingVerification | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("identity_document_url", "is", null)
        .eq("identity_verified", false)
        .order("identity_submitted_at", { ascending: true });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vérifications en attente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const handleApprove = async (user: PendingVerification) => {
    if (!currentUser) return;
    setIsProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ identity_verified: true })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Send approval notification
      await supabase.from("notifications").insert({
        user_id: user.user_id,
        title: "Identité vérifiée",
        message: "Félicitations ! Votre identité a été vérifiée avec succès. Vous avez maintenant accès à toutes les fonctionnalités de la plateforme.",
        type: "success",
        created_by: currentUser.id,
      });

      // Log the action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: "identity_approved",
        target_user_id: user.user_id,
        details: {},
      });

      toast({
        title: "Identité approuvée",
        description: `L'identité de ${user.full_name} a été vérifiée.`,
      });

      fetchPendingVerifications();
      setShowDetailSheet(false);
    } catch (error) {
      console.error("Error approving identity:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver l'identité",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser || !selectedUser) return;
    setIsProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          identity_document_url: null,
          identity_submitted_at: null,
        })
        .eq("id", selectedUser.id);

      if (updateError) throw updateError;

      // Send rejection notification
      await supabase.from("notifications").insert({
        user_id: selectedUser.user_id,
        title: "Vérification refusée",
        message: rejectReason || "Votre document d'identité n'a pas pu être vérifié. Veuillez soumettre un nouveau document conforme.",
        type: "error",
        created_by: currentUser.id,
      });

      // Log the action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: "identity_rejected",
        target_user_id: selectedUser.user_id,
        details: { reason: rejectReason },
      });

      toast({
        title: "Vérification refusée",
        description: `La vérification de ${selectedUser.full_name} a été refusée.`,
      });

      setShowRejectDialog(false);
      setShowDetailSheet(false);
      setRejectReason("");
      fetchPendingVerifications();
    } catch (error) {
      console.error("Error rejecting identity:", error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la vérification",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getDocumentUrl = async (path: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from("identity-documents")
        .createSignedUrl(path, 3600);
      return data?.signedUrl || null;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      return null;
    }
  };

  const openDocument = async (path: string) => {
    const url = await getDocumentUrl(path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chargement des vérifications en attente...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="w-5 h-5 text-gold" />
        <h3 className="font-semibold">
          Vérifications en attente ({pendingUsers.length})
        </h3>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p>Aucune vérification en attente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gold/20 text-gold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{user.full_name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {user.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.country}
                        </span>
                      )}
                    </div>
                    {user.identity_submitted_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        Soumis le{" "}
                        {format(new Date(user.identity_submitted_at), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowDetailSheet(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Examiner
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
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Vérification de {selectedUser.full_name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4 overflow-y-auto pb-4">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 glass rounded-xl">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-gold/20 text-gold text-xl">
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{selectedUser.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {selectedUser.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedUser.country}
                        </span>
                      )}
                    </div>
                    {selectedUser.category && (
                      <Badge variant="outline" className="mt-1">
                        {selectedUser.category}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {selectedUser.bio && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Biographie</h4>
                    <p className="text-sm text-muted-foreground glass p-3 rounded-lg">
                      {selectedUser.bio}
                    </p>
                  </div>
                )}

                {/* Document */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Document d'identité</h4>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => selectedUser.identity_document_url && openDocument(selectedUser.identity_document_url)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir le document
                  </Button>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedUser)}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isProcessing ? "..." : "Approuver"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser la vérification</AlertDialogTitle>
            <AlertDialogDescription>
              Indiquez la raison du refus. L'utilisateur recevra une notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Raison du refus (optionnel)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? "..." : "Refuser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVerificationTab;
