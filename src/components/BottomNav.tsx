import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Megaphone, MessageCircle, User, Briefcase, Wallet, Handshake } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  isCenter?: boolean;
}

interface BottomNavProps {
  userRole: "creator" | "brand";
}

const BottomNav = ({ userRole }: BottomNavProps) => {
  const location = useLocation();
  const unreadMessages = useUnreadMessages();
  const basePath = userRole === "creator" ? "/creator" : "/brand";

  const navItems: NavItem[] = userRole === "creator" 
    ? [
        { icon: Home, label: "Accueil", path: "/" },
        { icon: Briefcase, label: "Offres", path: `${basePath}/offers` },
        { icon: Handshake, label: "Collabs", path: `${basePath}/collaborations`, isCenter: true },
        { icon: Wallet, label: "Portefeuille", path: `${basePath}/wallet` },
        { icon: User, label: "Profil", path: `${basePath}/profile` },
      ]
    : [
        { icon: Home, label: "Accueil", path: "/" },
        { icon: Search, label: "Créateurs", path: `${basePath}/marketplace` },
        { icon: Megaphone, label: "Offres", path: `${basePath}/offers`, isCenter: true },
        { icon: Handshake, label: "Collabs", path: `${basePath}/collaborations` },
        { icon: User, label: "Profil", path: `${basePath}/profile` },
      ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="glass-nav safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center touch-target px-3 relative"
                >
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isActive ? "text-gold" : "text-muted-foreground"
                      }`}
                    />
                    {/* Unread badge for Messages */}
                    {item.label === "Messages" && unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-gold text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 transition-colors ${
                      isActive ? "text-gold" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 w-1 h-1 rounded-full bg-gold"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNav;
