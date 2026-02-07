import { motion } from "framer-motion";
import { Users, Star, Briefcase, TrendingUp } from "lucide-react";

interface ProfileStatsProps {
  totalFollowers: string;
  rating: number | null;
  collaborations: number;
  engagementRate?: number | null;
}

const ProfileStats = ({
  totalFollowers,
  rating,
  collaborations,
  engagementRate,
}: ProfileStatsProps) => {
  const stats = [
    {
      icon: Users,
      value: totalFollowers,
      label: "Abonnés",
      color: "text-gold",
    },
    {
      icon: Star,
      value: rating ? rating.toFixed(1) : "-",
      label: "Note",
      color: "text-accent",
      isStar: true,
    },
    {
      icon: Briefcase,
      value: collaborations.toString(),
      label: "Collabs",
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      value: engagementRate ? `${engagementRate.toFixed(1)}%` : "-",
      label: "Engage.",
      color: "text-gold",
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

export default ProfileStats;
