import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
  MoreVertical,
  Ban,
  MessageSquareWarning,
  Bell,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AdminSendNotificationSheet from "./AdminSendNotificationSheet";

interface AdminUserCardProps {
  user: {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    email_verified: boolean | null;
    identity_verified: boolean | null;
    is_banned: boolean | null;
    country: string | null;
    category: string | null;
    company_name: string | null;
    role: "creator" | "brand";
  };
  onUserUpdated: () => void;
}

const AdminUserCard = ({ user, onUserUpdated }: AdminUserCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showWarningSheet, setShowWarningSheet] = useState(false);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleBan = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_banned: !user.is_banned,
          ban_reason: user.is_banned ? null : banReason,
          banned_at: user.is_banned ? null : new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Log the action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: user.is_banned ? "unban" : "ban",
        target_user_id: user.user_id,
        details: { reason: banReason },
      });

      toast({
        title: user.is_banned ? "Utilisateur débanni" : "Utilisateur banni",
        description: user.is_banned
          ? `${user.full_name} a été débanni.`
          : `${user.full_name} a été banni.`,
      });

      onUserUpdated();
    } catch (error) {
      console.error("Error banning user:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowBanDialog(false);
      setBanReason("");
    }
  };

  const handleSendWarning = async () => {
    if (!currentUser || !warningMessage.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: user.user_id,
        title: "Avertissement",
        message: warningMessage,
        type: "warning",
        created_by: currentUser.id,
      });

      if (error) throw error;

      // Log the action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: "warning",
        target_user_id: user.user_id,
        details: { message: warningMessage },
      });

      toast({
        title: "Avertissement envoyé",
        description: `Un avertissement a été envoyé à ${user.full_name}.`,
      });

      setShowWarningSheet(false);
      setWarningMessage("");
    } catch (error) {
      console.error("Error sending warning:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'avertissement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-gold/20 text-gold">
              {user.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate">
                {user.role === "brand" ? user.company_name || user.full_name : user.full_name}
              </h4>
              {user.is_banned && (
                <Badge variant="destructive" className="text-[10px]">
                  Banni
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {user.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {user.country}
                </span>
              )}
              {user.category && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {user.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {user.email_verified ? (
                <Badge variant="outline" className="text-[10px] border-green-500 text-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Email
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-muted-foreground">
                  <XCircle className="w-3 h-3 mr-1" />
                  Email
                </Badge>
              )}
              {user.identity_verified ? (
                <Badge variant="outline" className="text-[10px] border-green-500 text-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Identité
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-muted-foreground">
                  <XCircle className="w-3 h-3 mr-1" />
                  Identité
                </Badge>
              )}
            </div>
          </div>

          <Sheet open={showActions} onOpenChange={setShowActions}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Actions pour {user.full_name}
                </SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 mt-4">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setShowActions(false);
                    setShowWarningSheet(true);
                  }}
                >
                  <MessageSquareWarning className="w-4 h-4 mr-2 text-yellow-500" />
                  Envoyer un avertissement
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setShowActions(false);
                    setShowNotificationSheet(true);
                  }}
                >
                  <Bell className="w-4 h-4 mr-2 text-blue-500" />
                  Envoyer une notification
                </Button>
                <Button
                  variant={user.is_banned ? "outline" : "destructive"}
                  className="justify-start"
                  onClick={() => {
                    setShowActions(false);
                    setShowBanDialog(true);
                  }}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {user.is_banned ? "Débannir l'utilisateur" : "Bannir l'utilisateur"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Ban Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.is_banned ? "Débannir" : "Bannir"} {user.full_name} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.is_banned
                ? "L'utilisateur pourra à nouveau accéder à la plateforme."
                : "L'utilisateur ne pourra plus accéder à la plateforme."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!user.is_banned && (
            <Textarea
              placeholder="Raison du bannissement (optionnel)..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="mt-2"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              className={user.is_banned ? "" : "bg-destructive hover:bg-destructive/90"}
              disabled={isLoading}
            >
              {isLoading ? "..." : user.is_banned ? "Débannir" : "Bannir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning Sheet */}
      <Sheet open={showWarningSheet} onOpenChange={setShowWarningSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-yellow-500" />
              Envoyer un avertissement
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <Textarea
              placeholder="Message d'avertissement..."
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              rows={4}
            />
            <Button
              className="w-full"
              onClick={handleSendWarning}
              disabled={!warningMessage.trim() || isLoading}
            >
              {isLoading ? "Envoi..." : "Envoyer l'avertissement"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Notification Sheet */}
      <AdminSendNotificationSheet
        open={showNotificationSheet}
        onOpenChange={setShowNotificationSheet}
        userId={user.user_id}
        userName={user.full_name}
      />
    </>
  );
};

export default AdminUserCard;
