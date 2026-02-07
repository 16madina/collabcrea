import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Moon,
  Sun,
  Globe,
  FileText,
  Trash2,
  AlertTriangle,
  Loader2,
  MessageCircle,
  Mail,
  Check,
  Lock
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

type Language = "fr" | "en";

const SettingsSheet = ({ isOpen, onClose, onLogout }: SettingsSheetProps) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [showHelpSheet, setShowHelpSheet] = useState(false);

  // Settings state
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("app_language") as Language) || "fr";
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });
  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem("push_notifications") !== "false";
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem("email_notifications") !== "false";
  });
  const [profileVisible, setProfileVisible] = useState(() => {
    return localStorage.getItem("profile_visible") !== "false";
  });
  const [showOnlineStatus, setShowOnlineStatus] = useState(() => {
    return localStorage.getItem("show_online_status") !== "false";
  });

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Save language
  useEffect(() => {
    localStorage.setItem("app_language", language);
  }, [language]);

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

  const handleSaveNotifications = () => {
    localStorage.setItem("push_notifications", String(pushNotifications));
    localStorage.setItem("email_notifications", String(emailNotifications));
    toast.success("Préférences de notifications enregistrées");
    setShowNotificationsSheet(false);
  };

  const handleSavePrivacy = () => {
    localStorage.setItem("profile_visible", String(profileVisible));
    localStorage.setItem("show_online_status", String(showOnlineStatus));
    toast.success("Paramètres de confidentialité enregistrés");
    setShowPrivacySheet(false);
  };

  const languages = [
    { code: "fr" as Language, label: "Français", flag: "🇫🇷" },
    { code: "en" as Language, label: "English", flag: "🇬🇧" },
  ];

  const t = {
    fr: {
      settings: "Paramètres",
      account: "Compte",
      logout: "Déconnexion",
      logoutDesc: "Se déconnecter de votre compte",
      notifications: "Notifications",
      privacy: "Confidentialité",
      preferences: "Préférences",
      language: "Langue",
      darkMode: "Mode sombre",
      support: "Support",
      helpSupport: "Aide & Support",
      terms: "Conditions d'utilisation",
      dangerZone: "Zone de danger",
      deleteAccount: "Supprimer mon compte",
      deleteDesc: "Cette action est irréversible",
      pushNotif: "Notifications push",
      pushNotifDesc: "Recevoir des notifications sur votre appareil",
      emailNotif: "Notifications email",
      emailNotifDesc: "Recevoir des emails pour les mises à jour importantes",
      save: "Enregistrer",
      profileVisible: "Profil visible",
      profileVisibleDesc: "Permettre aux marques de voir votre profil",
      onlineStatus: "Statut en ligne",
      onlineStatusDesc: "Montrer quand vous êtes en ligne",
      faq: "Questions fréquentes",
      contactUs: "Nous contacter",
      reportBug: "Signaler un bug",
    },
    en: {
      settings: "Settings",
      account: "Account",
      logout: "Log out",
      logoutDesc: "Sign out of your account",
      notifications: "Notifications",
      privacy: "Privacy",
      preferences: "Preferences",
      language: "Language",
      darkMode: "Dark mode",
      support: "Support",
      helpSupport: "Help & Support",
      terms: "Terms of Service",
      dangerZone: "Danger zone",
      deleteAccount: "Delete my account",
      deleteDesc: "This action is irreversible",
      pushNotif: "Push notifications",
      pushNotifDesc: "Receive notifications on your device",
      emailNotif: "Email notifications",
      emailNotifDesc: "Receive emails for important updates",
      save: "Save",
      profileVisible: "Profile visible",
      profileVisibleDesc: "Allow brands to see your profile",
      onlineStatus: "Online status",
      onlineStatusDesc: "Show when you are online",
      faq: "Frequently asked questions",
      contactUs: "Contact us",
      reportBug: "Report a bug",
    },
  };

  const text = t[language];

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
                <h2 className="font-display text-xl font-bold">{text.settings}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Logout - First and prominent */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {text.account}
                  </h3>
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={onLogout}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gold/10 hover:bg-gold/20 transition-colors border border-gold/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-gold" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-foreground">{text.logout}</span>
                        <p className="text-xs text-muted-foreground">{text.logoutDesc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gold" />
                  </motion.button>
                </div>

                {/* Notifications */}
                <div>
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => setShowNotificationsSheet(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Bell className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-medium">{text.notifications}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>

                  {/* Privacy */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setShowPrivacySheet(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Shield className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-medium">{text.privacy}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                </div>

                {/* Preferences */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {text.preferences}
                  </h3>
                  
                  {/* Language */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => setShowLanguageSheet(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Globe className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-medium">{text.language}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.button>

                  {/* Dark Mode */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full flex items-center justify-between p-3 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {darkMode ? (
                          <Moon className="w-5 h-5 text-foreground" />
                        ) : (
                          <Sun className="w-5 h-5 text-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{text.darkMode}</span>
                    </div>
                    <Switch 
                      checked={darkMode} 
                      onCheckedChange={setDarkMode}
                    />
                  </motion.div>
                </div>

                {/* Support */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {text.support}
                  </h3>
                  
                  {/* Help & Support */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    onClick={() => setShowHelpSheet(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-medium">{text.helpSupport}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>

                  {/* Terms */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => {
                      onClose();
                      navigate("/terms");
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-medium">{text.terms}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>

                  {/* Privacy Policy */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    onClick={() => {
                      onClose();
                      navigate("/privacy");
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-medium">Politique de confidentialité</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                </div>

                {/* Danger Zone */}
                <div>
                  <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-3">
                    {text.dangerZone}
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
                        <span className="font-medium text-destructive">{text.deleteAccount}</span>
                        <p className="text-xs text-muted-foreground">{text.deleteDesc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-destructive" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Language Sheet */}
      <AnimatePresence>
        {showLanguageSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLanguageSheet(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border rounded-t-3xl p-6"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-4">{text.language}</h3>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageSheet(false);
                      toast.success(lang.code === "fr" ? "Langue changée en Français" : "Language changed to English");
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                      language === lang.code ? "bg-gold/20 border border-gold/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium">{lang.label}</span>
                    </div>
                    {language === lang.code && (
                      <Check className="w-5 h-5 text-gold" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications Sheet */}
      <AnimatePresence>
        {showNotificationsSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationsSheet(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border rounded-t-3xl p-6"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-4">{text.notifications}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gold" />
                    <div>
                      <p className="font-medium">{text.pushNotif}</p>
                      <p className="text-xs text-muted-foreground">{text.pushNotifDesc}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={pushNotifications} 
                    onCheckedChange={setPushNotifications}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gold" />
                    <div>
                      <p className="font-medium">{text.emailNotif}</p>
                      <p className="text-xs text-muted-foreground">{text.emailNotifDesc}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveNotifications}
                className="w-full mt-6"
                variant="gold"
              >
                {text.save}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Privacy Sheet */}
      <AnimatePresence>
        {showPrivacySheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacySheet(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border rounded-t-3xl p-6"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-4">{text.privacy}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gold" />
                    <div>
                      <p className="font-medium">{text.profileVisible}</p>
                      <p className="text-xs text-muted-foreground">{text.profileVisibleDesc}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={profileVisible} 
                    onCheckedChange={setProfileVisible}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gold" />
                    <div>
                      <p className="font-medium">{text.onlineStatus}</p>
                      <p className="text-xs text-muted-foreground">{text.onlineStatusDesc}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={showOnlineStatus} 
                    onCheckedChange={setShowOnlineStatus}
                  />
                </div>
              </div>
              <Button 
                onClick={handleSavePrivacy}
                className="w-full mt-6"
                variant="gold"
              >
                {text.save}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Help & Support Sheet */}
      <AnimatePresence>
        {showHelpSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpSheet(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border rounded-t-3xl p-6"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-4">{text.helpSupport}</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowHelpSheet(false);
                    onClose();
                    navigate("/contact");
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-gold" />
                  <span className="font-medium">{text.faq}</span>
                </button>
                <button
                  onClick={() => {
                    setShowHelpSheet(false);
                    onClose();
                    navigate("/contact");
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Mail className="w-5 h-5 text-gold" />
                  <span className="font-medium">{text.contactUs}</span>
                </button>
                <button
                  onClick={() => {
                    toast.info("Fonctionnalité à venir", {
                      description: "Le signalement de bugs sera bientôt disponible"
                    });
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <AlertTriangle className="w-5 h-5 text-gold" />
                  <span className="font-medium">{text.reportBug}</span>
                </button>
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
