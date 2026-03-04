import { useState } from "react";
import { MoreVertical, Flag, Ban, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import ReportDialog from "@/components/ReportDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ChatActionMenuProps {
  otherUserId: string | null;
  otherUserName: string;
}

const ChatActionMenu = ({ otherUserId, otherUserName }: ChatActionMenuProps) => {
  const { user } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async () => {
    if (!user || !otherUserId) return;
    setBlocking(true);
    try {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_id: otherUserId,
      });
      if (error) {
        if (error.code === "23505") {
          toast.info("Cet utilisateur est déjà bloqué");
        } else {
          throw error;
        }
      } else {
        toast.success("Utilisateur bloqué", {
          description: `${otherUserName} ne pourra plus vous contacter`,
        });
      }
    } catch (err: any) {
      console.error("Error blocking user:", err);
      toast.error("Erreur lors du blocage");
    } finally {
      setBlocking(false);
      setShowBlockConfirm(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="touch-target">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 z-[70]">
          <DropdownMenuItem onClick={() => setShowReport(true)} className="text-destructive focus:text-destructive">
            <Flag className="w-4 h-4 mr-2" />
            Signaler cet utilisateur
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowBlockConfirm(true)} className="text-destructive focus:text-destructive">
            <Ban className="w-4 h-4 mr-2" />
            Bloquer cet utilisateur
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        reportType="user"
        targetUserId={otherUserId}
        targetName={otherUserName}
      />

      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Bloquer {otherUserName} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cet utilisateur ne pourra plus vous envoyer de messages ni vous contacter.
              Vous pouvez le débloquer à tout moment depuis vos paramètres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={blocking}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Ban className="w-4 h-4 mr-2" />
              Bloquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatActionMenu;
