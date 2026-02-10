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
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
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
  identity_method: string | null;
  selfie_url: string | null;
  bio: string | null;
}

// Component to preview identity document with loading state
const IdentityDocumentPreview = ({ 
  documentPath, 
  onOpenDocument 
}: { 
  documentPath: string | null; 
  onOpenDocument: () => void 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (!documentPath) {
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase.storage
          .from("identity-documents")
          .createSignedUrl(documentPath, 3600);
        setImageUrl(data?.signedUrl || null);
      } catch (error) {
        console.error("Error loading document:", error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [documentPath]);

  if (loading) {
    return (
      <div className="aspect-square rounded-xl bg-muted flex items-center justify-center border-2 border-border">
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="aspect-square rounded-xl bg-muted flex items-center justify-center border-2 border-border">
        <div className="text-center text-muted-foreground p-4">
          <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Document non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="aspect-square rounded-xl overflow-hidden bg-muted border-2 border-border cursor-pointer hover:border-gold transition-colors"
      onClick={onOpenDocument}
    >
      <img
        src={imageUrl}
        alt="Document d'identité"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// Helper to extract user_id from selfie path
const extractUserIdFromSelfiePath = (selfiePath: string): string | null => {
  let path = selfiePath;
  if (path.startsWith("http")) {
    const match = path.match(/selfies\/(.+)$/);
    if (match) path = match[1];
  }
  // path is like "user_id/selfie-0.jpg" → extract user_id
  const parts = path.split("/");
  return parts.length >= 2 ? parts[0] : null;
};

// Single selfie image loader hook
const useSignedSelfieUrl = (path: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let resolvedPath = path;
        if (resolvedPath.startsWith("http")) {
          const match = resolvedPath.match(/selfies\/(.+)$/);
          if (match) resolvedPath = match[1];
        }
        const { data } = await supabase.storage
          .from("selfies")
          .createSignedUrl(resolvedPath, 3600);
        setImageUrl(data?.signedUrl || null);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [path]);

  return { imageUrl, loading };
};

// Selfie carousel with arrows + fullscreen
const SelfiePreview = ({ selfiePath, onFullscreen }: { selfiePath: string; onFullscreen?: (urls: string[], index: number) => void }) => {
  const userId = extractUserIdFromSelfiePath(selfiePath);
  const labels = ["Face", "Gauche", "Droite", "Sourire"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [urls, setUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [loadingAll, setLoadingAll] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const loadAll = async () => {
      const results = await Promise.all(
        labels.map(async (_, i) => {
          try {
            const { data } = await supabase.storage
              .from("selfies")
              .createSignedUrl(`${userId}/selfie-${i}.jpg`, 3600);
            return data?.signedUrl || null;
          } catch {
            return null;
          }
        })
      );
      setUrls(results);
      setLoadingAll(false);
    };
    loadAll();
  }, [userId]);

  if (!userId) {
    return (
      <div className="h-32 rounded-xl bg-muted flex items-center justify-center border border-border">
        <p className="text-xs text-muted-foreground">Selfie non disponible</p>
      </div>
    );
  }

  const currentUrl = urls[currentIndex];

  return (
    <div className="space-y-1">
      <div className="relative w-full aspect-[4/3] max-h-40 rounded-xl overflow-hidden bg-muted border border-border">
        {loadingAll ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-muted-foreground text-xs">Chargement...</div>
          </div>
        ) : currentUrl ? (
          <img
            src={currentUrl}
            alt={labels[currentIndex]}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onFullscreen?.(urls.filter(Boolean) as string[], currentIndex)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <User className="w-8 h-8 text-muted-foreground opacity-40" />
          </div>
        )}

        {/* Navigation arrows */}
        {!loadingAll && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + 4) % 4)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 flex items-center justify-center hover:bg-background/90 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % 4)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 flex items-center justify-center hover:bg-background/90 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {/* Fullscreen button */}
            <button
              onClick={() => onFullscreen?.(urls.filter(Boolean) as string[], currentIndex)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/70 flex items-center justify-center hover:bg-background/90 transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
      {/* Label + dots */}
      <div className="flex items-center justify-center gap-2">
        <p className="text-[10px] text-muted-foreground">{labels[currentIndex]}</p>
        <div className="flex gap-1">
          {labels.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? "bg-gold" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Fullscreen selfie viewer overlay
const SelfieFullscreen = ({ urls, initialIndex, onClose }: { urls: string[]; initialIndex: number; onClose: () => void }) => {
  const [index, setIndex] = useState(initialIndex);
  const labels = ["Face", "Gauche", "Droite", "Sourire"];

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 flex flex-col items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-md px-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <div className="relative rounded-2xl overflow-hidden bg-muted border border-border">
          <img src={urls[index]} alt={labels[index]} className="w-full aspect-square object-cover" />
          <button
            onClick={() => setIndex((prev) => (prev - 1 + urls.length) % urls.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIndex((prev) => (prev + 1) % urls.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">{labels[index]} — {index + 1}/{urls.length}</p>
        <div className="flex justify-center gap-2 mt-2">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-gold" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminVerificationTab = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingVerification | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullscreenSelfie, setFullscreenSelfie] = useState<{ urls: string[]; index: number } | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("identity_verified", false)
        .not("identity_submitted_at", "is", null)
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
          selfie_url: null,
          identity_method: null,
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
                       {user.identity_method && (
                         <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                           {user.identity_method === "selfie" ? "📸 Selfie" : "📄 Document"}
                         </Badge>
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

                {/* Photo Comparison - Side by side */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {selectedUser.identity_method === "selfie" 
                      ? "Comparaison photo de profil / Selfie"
                      : "Comparaison photo de profil / Document"}
                  </h4>
                  {selectedUser.identity_method === "selfie" && selectedUser.selfie_url ? (
                    <div className="space-y-3">
                      {/* Side by side: profile photo + selfie carousel, same height */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground text-center">Photo de profil</p>
                          <div className="aspect-[4/3] max-h-40 rounded-xl overflow-hidden bg-muted border border-border">
                            {selectedUser.avatar_url ? (
                              <img src={selectedUser.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <User className="w-8 h-8 text-muted-foreground opacity-50" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground text-center">Selfie</p>
                          <SelfiePreview
                            selfiePath={selectedUser.selfie_url}
                            onFullscreen={(urls, index) => setFullscreenSelfie({ urls, index })}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground text-center">Photo de profil</p>
                        <div className="aspect-square rounded-xl overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                          {selectedUser.avatar_url ? (
                            <img src={selectedUser.avatar_url} alt="Photo de profil" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center text-muted-foreground p-4">
                              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-xs">Pas de photo</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground text-center">Document d'identité</p>
                        <IdentityDocumentPreview
                          documentPath={selectedUser.identity_document_url}
                          onOpenDocument={() => selectedUser.identity_document_url && openDocument(selectedUser.identity_document_url)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Open document full size - only for document method */}
                {selectedUser.identity_method !== "selfie" && selectedUser.identity_document_url && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openDocument(selectedUser.identity_document_url!)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir le document en grand
                  </Button>
                )}

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
                    className="bg-accent hover:bg-accent/90"
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

      {/* Fullscreen selfie viewer */}
      {fullscreenSelfie && (
        <SelfieFullscreen
          urls={fullscreenSelfie.urls}
          initialIndex={fullscreenSelfie.index}
          onClose={() => setFullscreenSelfie(null)}
        />
      )}
    </div>
  );
};

export default AdminVerificationTab;
