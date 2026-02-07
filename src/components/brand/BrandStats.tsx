import { motion } from "framer-motion";
import { Megaphone, Users, Star, TrendingUp } from "lucide-react";

interface BrandStatsProps {
  activeOffers: number;
  totalCollaborations: number;
  averageRating: number | null;
  totalSpent?: number | null;
}

const BrandStats = ({
  activeOffers,
  totalCollaborations,
  averageRating,
  totalSpent,
}: BrandStatsProps) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  const stats = [
    {
      icon: Megaphone,
      value: activeOffers.toString(),
      label: "Offres",
      color: "text-gold",
    },
    {
      icon: Users,
      value: totalCollaborations.toString(),
      label: "Collabs",
      color: "text-accent",
    },
    {
      icon: Star,
      value: averageRating ? averageRating.toFixed(1) : "-",
      label: "Note",
      color: "text-gold",
      isStar: true,
    },
    {
      icon: TrendingUp,
      value: totalSpent ? formatCurrency(totalSpent) : "-",
      label: "Investi",
      color: "text-primary",
      suffix: totalSpent ? " FCFA" : "",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="px-4 py-4"
    >
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex flex-col items-center p-3 rounded-2xl bg-muted/30"
            >
              <div className={`mb-1 ${stat.color}`}>
                <Icon className={`w-4 h-4 ${stat.isStar ? "fill-current" : ""}`} />
              </div>
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default BrandStats;
