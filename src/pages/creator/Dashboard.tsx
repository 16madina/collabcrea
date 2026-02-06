import { motion } from "framer-motion";
import { Eye, FileText, Wallet, TrendingUp, Bell, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const stats = [
  { icon: Eye, label: "Vues", value: "12.4K", trend: "+23%" },
  { icon: FileText, label: "Offres", value: "8", trend: "+2" },
  { icon: Wallet, label: "Revenus", value: "850K", unit: "FCFA" },
];

const recentOffers = [
  {
    id: 1,
    brand: "Afrik'Beauty",
    type: "Reel Instagram",
    budget: "150,000 FCFA",
    status: "new",
  },
  {
    id: 2,
    brand: "TechAfrica",
    type: "Vidéo YouTube",
    budget: "300,000 FCFA",
    status: "pending",
  },
  {
    id: 3,
    brand: "Mode Dakar",
    type: "Story Instagram",
    budget: "50,000 FCFA",
    status: "accepted",
  },
];

const CreatorDashboard = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-muted-foreground text-sm">Bienvenue,</p>
            <h1 className="font-display text-2xl font-bold text-gold-gradient">
              Aïcha
            </h1>
          </div>
          <button className="relative touch-target">
            <Bell className="w-6 h-6 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold animate-pulse" />
          </button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="glass-card p-4 text-center"
            >
              <stat.icon className="w-5 h-5 text-gold mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">
                {stat.value}
                {stat.unit && <span className="text-xs text-muted-foreground ml-1">{stat.unit}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              {stat.trend && (
                <span className="text-xs text-green-400 flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Performance</h2>
            <span className="text-xs text-gold px-2 py-1 rounded-full bg-gold/10">
              Ce mois
            </span>
          </div>
          <div className="h-32 flex items-end justify-around gap-2">
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                className="w-full bg-gradient-to-t from-gold/20 to-gold/60 rounded-t-lg"
              />
            ))}
          </div>
          <div className="flex justify-around mt-2">
            {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
              <span key={day} className="text-xs text-muted-foreground">
                {day}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Offers */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Offres récentes</h2>
            <button className="text-gold text-sm flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <span className="text-gold font-bold text-lg">
                    {offer.brand.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{offer.brand}</h3>
                  <p className="text-sm text-muted-foreground">{offer.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-semibold">{offer.budget}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      offer.status === "new"
                        ? "bg-green-500/20 text-green-400"
                        : offer.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gold/20 text-gold"
                    }`}
                  >
                    {offer.status === "new"
                      ? "Nouveau"
                      : offer.status === "pending"
                      ? "En attente"
                      : "Accepté"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <BottomNav userRole="creator" />
    </div>
  );
};

export default CreatorDashboard;
