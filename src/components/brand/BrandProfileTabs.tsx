import { motion } from "framer-motion";
import { 
  Building2, 
  Megaphone, 
  Users, 
  Star,
  Shield,
  Heart,
  type LucideIcon 
} from "lucide-react";

export type BrandProfileTabType = "info" | "offers" | "collaborations" | "reviews" | "favorites" | "verification";

interface Tab {
  id: BrandProfileTabType;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BrandProfileTabsProps {
  activeTab: BrandProfileTabType;
  onTabChange: (tab: BrandProfileTabType) => void;
  offersCount?: number;
  collaborationsCount?: number;
  reviewsCount?: number;
  favoritesCount?: number;
  showVerificationTab?: boolean;
}

const BrandProfileTabs = ({
  activeTab,
  onTabChange,
  offersCount = 0,
  collaborationsCount = 0,
  reviewsCount = 0,
  favoritesCount = 0,
  showVerificationTab = false,
}: BrandProfileTabsProps) => {
  const baseTabs: Tab[] = [
    { id: "info", label: "Entreprise", icon: Building2 },
    { id: "offers", label: "Offres", icon: Megaphone, badge: offersCount },
    { id: "favorites", label: "Favoris", icon: Heart, badge: favoritesCount },
    { id: "collaborations", label: "Collabs", icon: Users, badge: collaborationsCount },
    { id: "reviews", label: "Avis", icon: Star, badge: reviewsCount },
  ];

  const tabs: Tab[] = showVerificationTab 
    ? [...baseTabs, { id: "verification" as BrandProfileTabType, label: "Vérification", icon: Shield }]
    : baseTabs;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="flex overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 min-w-[80px] flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                isActive 
                  ? "text-gold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold bg-gold text-background rounded-full px-1">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeBrandTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BrandProfileTabs;
