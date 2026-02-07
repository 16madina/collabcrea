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
  CreditCard,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const SettingsSheet = ({ isOpen, onClose, onLogout }: SettingsSheetProps) => {
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

  return (
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
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-xl"
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
            </div>

            {/* Logout */}
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
  );
};

export default SettingsSheet;
