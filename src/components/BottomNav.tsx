import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Megaphone, MessageCircle, User, Briefcase } from "lucide-react";

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
  const basePath = userRole === "creator" ? "/creator" : "/brand";

  const navItems: NavItem[] = userRole === "creator" 
    ? [
        { icon: Home, label: "Accueil", path: "/" },
        { icon: Search, label: "Explorer", path: "/explore" },
        { icon: Briefcase, label: "Offres", path: `${basePath}/offers`, isCenter: true },
        { icon: MessageCircle, label: "Messages", path: `${basePath}/messages` },
        { icon: User, label: "Profil", path: `${basePath}/profile` },
      ]
    : [
        { icon: Home, label: "Accueil", path: "/" },
        { icon: Search, label: "Créateurs", path: `${basePath}/marketplace` },
        { icon: Megaphone, label: "Offres", path: `${basePath}/offers`, isCenter: true },
        { icon: MessageCircle, label: "Messages", path: `${basePath}/messages` },
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
                  className="flex flex-col items-center touch-target px-3"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? "text-gold" : "text-muted-foreground"
                    }`}
                  />
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
