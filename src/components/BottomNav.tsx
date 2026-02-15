import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Briefcase, Handshake, User } from "lucide-react";
import { useCollabsBadgeCount } from "@/hooks/useCollabsBadgeCount";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  showBadge?: boolean;
}

const BottomNav = () => {
  const location = useLocation();
  const collabsBadgeCount = useCollabsBadgeCount();
  const { user, role } = useAuth();

  const isAuthenticated = !!user;
  const basePath = role === "brand" ? "/brand" : "/creator";

  // Same 5 tabs for everyone - routes adapt based on auth state
  const navItems: NavItem[] = [
    { 
      icon: Home, 
      label: "Accueil", 
      path: "/" 
    },
    { 
      icon: Search, 
      label: "Créateurs", 
      path: isAuthenticated && role === "brand" ? "/brand/marketplace" : "/explore" 
    },
    { 
      icon: Briefcase, 
      label: "Offres", 
      path: isAuthenticated ? `${basePath}/offers` : "/auth?tab=offers"
    },
    { 
      icon: Handshake, 
      label: "Collabs", 
      path: isAuthenticated ? `${basePath}/collabs` : "/auth",
      showBadge: isAuthenticated
    },
    { 
      icon: User, 
      label: isAuthenticated ? "Profil" : "Connexion", 
      path: isAuthenticated ? `${basePath}/profile` : "/auth"
    },
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
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path.split("?")[0]));
            const Icon = item.icon;

            return (
              <Link key={`${item.label}-${index}`} to={item.path}>
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
                    {/* Unread badge for Collabs */}
                    {item.showBadge && collabsBadgeCount > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-gold text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {collabsBadgeCount > 99 ? "99+" : collabsBadgeCount}
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
