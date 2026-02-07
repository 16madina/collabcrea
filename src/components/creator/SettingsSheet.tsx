import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Moon,
  Globe,
  CreditCard,
  FileText,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const SettingsSheet = ({ isOpen, onClose, onLogout }: SettingsSheetProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const settingsGroups = [
    {
      title: "Compte",
      items: [
        { icon: Bell, label: "Notifications", action: "notifications", hasToggle: true },
        { icon: Shield, label: "Confidentialité", action: "privacy" },
        { icon: CreditCard, label: "Paiements", action: "payments" },
      ],
    },
    {
      title: "Préférences",
      items: [
        { icon: Globe, label: "Langue", action: "language", value: "Français" },
        { icon: Moon, label: "Mode sombre", action: "darkmode", hasToggle: true, defaultOn: true },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Aide & Support", action: "help" },
        { icon: FileText, label: "Conditions d'utilisation", action: "terms" },
      ],
    },
  ];

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER") {
      toast.error("Veuillez taper SUPPRIMER pour confirmer");
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Utilisateur non trouvé");
        return;
      }

      // Delete user's data from profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", user.id);

      if (profileError) {
        console.error("Error deleting profile:", profileError);
      }

      // Delete user's roles
      const { error: rolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id);

      if (rolesError) {
        console.error("Error deleting roles:", rolesError);
      }

      // Delete portfolio items
      const { error: portfolioError } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("user_id", user.id);

      if (portfolioError) {
        console.error("Error deleting portfolio:", portfolioError);
      }

      // Sign out the user
      await supabase.auth.signOut();

      toast.success("Compte supprimé avec succès", {
        description: "Nous sommes désolés de vous voir partir."
      });

      // Redirect to home
      window.location.href = "/";
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("Erreur lors de la suppression", {
        description: error.message || "Veuillez réessayer"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display text-xl font-bold">Paramètres</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {settingsGroups.map((group, groupIndex) => (
                  <div key={group.title}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item, itemIndex) => {
                        const Icon = item.icon;
                        return (
                          <motion.button
                            key={item.action}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <Icon className="w-5 h-5 text-foreground" />
                              </div>
                              <span className="font-medium">{item.label}</span>
                            </div>
                            {item.hasToggle ? (
                              <Switch defaultChecked={item.defaultOn} />
                            ) : item.value ? (
                              <span className="text-sm text-muted-foreground">{item.value}</span>
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Danger Zone */}
                <div>
                  <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-3">
                    Zone de danger
                  </h3>
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-destructive/10 transition-colors border border-destructive/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-destructive">Supprimer mon compte</span>
                        <p className="text-xs text-muted-foreground">Cette action est irréversible</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-destructive" />
                  </motion.button>
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={onLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">
              Supprimer votre compte ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3">
              <p>
                Cette action est <strong className="text-destructive">irréversible</strong>. 
                Toutes vos données seront définitivement supprimées :
              </p>
              <ul className="text-left text-sm space-y-1 bg-muted/50 rounded-lg p-3">
                <li>• Votre profil et informations personnelles</li>
                <li>• Votre portfolio et médias</li>
                <li>• Vos candidatures et messages</li>
                <li>• Vos notifications</li>
              </ul>
              <p className="text-sm">
                Pour confirmer, tapez <strong className="text-destructive">SUPPRIMER</strong> ci-dessous :
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Tapez SUPPRIMER"
                className="text-center font-mono"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              className="w-full sm:w-auto"
              onClick={() => setDeleteConfirmText("")}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "SUPPRIMER" || isDeleting}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SettingsSheet;
