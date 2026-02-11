import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Share2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  YouTubeIcon,
  InstagramIcon,
  TikTokIcon,
  SnapchatIcon,
  FacebookIcon,
} from "@/components/ui/social-icons";

interface SocialVerification {
  id: string;
  user_id: string;
  platform: string;
  page_name: string;
  claimed_followers: string;
  screenshot_url: string;
  status: string;
  ai_confidence: number | null;
  ai_extracted_name: string | null;
  ai_extracted_followers: string | null;
  ai_reason: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface UserProfile {
  full_name: string;
  avatar_url: string | null;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "youtube": return <YouTubeIcon className="w-6 h-6 p-0" size={20} />;
    case "instagram": return <InstagramIcon className="w-6 h-6 p-0" size={20} />;
    case "tiktok": return <TikTokIcon className="w-6 h-6 p-0" size={20} />;
    case "snapchat": return <SnapchatIcon className="w-6 h-6 p-0" size={20} />;
    case "facebook": return <FacebookIcon className="w-6 h-6 p-0" size={20} />;
    default: return <Share2 className="w-5 h-5" />;
  }
};

const AdminSocialVerificationTab = () => {
  const [verifications, setVerifications] = useState<(SocialVerification & { profile?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<(SocialVerification & { profile?: UserProfile }) | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("social_verifications")
        .select("*")
        .in("status", ["pending_admin"])
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for each verification
      const userIds = [...new Set((data || []).map((v: SocialVerification) => v.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      );

      setVerifications(
        (data || []).map((v: SocialVerification) => ({
          ...v,
          profile: profileMap.get(v.user_id),
        }))
      );
    } catch (error) {
      console.error("Error fetching social verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const openDetail = async (item: SocialVerification & { profile?: UserProfile }) => {
    setSelectedItem(item);
    setAdminNotes(item.admin_notes || "");
    setShowDetailSheet(true);

    // Load screenshot
    const { data } = await supabase.storage
      .from("social-screenshots")
      .createSignedUrl(item.screenshot_url, 3600);
    setScreenshotUrl(data?.signedUrl || null);
  };

  const handleApprove = async () => {
    if (!selectedItem || !currentUser) return;
    setIsProcessing(true);

    try {
      // Update verification
      await supabase
        .from("social_verifications")
        .update({
          status: "verified",
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedItem.id);

      // Update user's profile with follower count
      const followerField = `${selectedItem.platform}_followers`;
      await supabase
        .from("profiles")
        .update({ [followerField]: selectedItem.ai_extracted_followers || selectedItem.claimed_followers })
        .eq("user_id", selectedItem.user_id);

      // Notify user
      await supabase.from("notifications").insert({
        user_id: selectedItem.user_id,
        title: "Réseau social vérifié ✅",
        message: `Votre page ${selectedItem.platform} "${selectedItem.page_name}" a été vérifiée.`,
        type: "success",
        created_by: currentUser.id,
      });

      // Log
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: "social_verification_approved",
        target_user_id: selectedItem.user_id,
        details: { platform: selectedItem.platform, page_name: selectedItem.page_name },
      });

      toast({ title: "Vérifié", description: `Page ${selectedItem.platform} approuvée.` });
      setShowDetailSheet(false);
      fetchVerifications();
    } catch (error) {
      console.error("Error approving:", error);
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !currentUser) return;
    setIsProcessing(true);

    try {
      await supabase
        .from("social_verifications")
        .update({
          status: "rejected",
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedItem.id);

      await supabase.from("notifications").insert({
        user_id: selectedItem.user_id,
        title: "Vérification refusée ❌",
        message: `Votre page ${selectedItem.platform} "${selectedItem.page_name}" n'a pas pu être vérifiée. ${adminNotes || "Veuillez soumettre une nouvelle capture."}`,
        type: "error",
        created_by: currentUser.id,
      });

      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: "social_verification_rejected",
        target_user_id: selectedItem.user_id,
        details: { platform: selectedItem.platform, reason: adminNotes },
      });

      toast({ title: "Refusé", description: "Vérification refusée." });
      setShowDetailSheet(false);
      fetchVerifications();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-gold" />
        <h3 className="font-semibold">
          Vérifications réseaux sociaux ({verifications.length})
        </h3>
      </div>

      {verifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune vérification en attente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={v.platform} />
                    <div>
                      <p className="font-medium text-sm">{v.profile?.full_name || "Utilisateur"}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.page_name} · {v.claimed_followers} abonnés
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.ai_confidence !== null && (
                      <Badge variant={v.ai_confidence >= 50 ? "secondary" : "destructive"} className="text-xs">
                        IA: {v.ai_confidence}%
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openDetail(v)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {v.ai_reason && (
                  <p className="text-xs text-muted-foreground mt-2 italic">"{v.ai_reason}"</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={(open) => !open && setShowDetailSheet(false)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              {selectedItem && <PlatformIcon platform={selectedItem.platform} />}
              Vérification {selectedItem?.platform}
            </SheetTitle>
          </SheetHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="font-medium">{selectedItem.profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  Page: <strong>{selectedItem.page_name}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Abonnés déclarés: <strong>{selectedItem.claimed_followers}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Soumis le {format(new Date(selectedItem.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>

              {/* AI Analysis */}
              {selectedItem.ai_confidence !== null && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-sm font-medium mb-1">Analyse IA</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Nom détecté: <strong>{selectedItem.ai_extracted_name || "—"}</strong></div>
                    <div>Abonnés détectés: <strong>{selectedItem.ai_extracted_followers || "—"}</strong></div>
                    <div>Confiance: <strong>{selectedItem.ai_confidence}%</strong></div>
                  </div>
                  {selectedItem.ai_reason && (
                    <p className="text-xs text-muted-foreground mt-2 italic">"{selectedItem.ai_reason}"</p>
                  )}
                </div>
              )}

              {/* Screenshot */}
              {screenshotUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Capture d'écran</p>
                  <div className="rounded-xl overflow-hidden border border-border">
                    <img
                      src={screenshotUrl}
                      alt="Capture d'écran"
                      className="w-full object-contain max-h-80 bg-muted"
                    />
                  </div>
                  <a
                    href={screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gold mt-1 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Ouvrir en plein écran
                  </a>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <p className="text-sm font-medium mb-1">Notes admin</p>
                <Textarea
                  placeholder="Notes optionnelles..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Refuser
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approuver
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminSocialVerificationTab;
