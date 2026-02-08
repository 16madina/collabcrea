import { motion } from "framer-motion";
import { FileText, Users, TrendingUp, Bell, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const stats = [
  { icon: FileText, label: "Offres actives", value: "5" },
  { icon: Users, label: "Candidatures", value: "23" },
  { icon: TrendingUp, label: "Ce mois", value: "3.2M", unit: "FCFA" },
];

const activeOffers = [
  {
    id: 1,
    title: "Campagne Beauté Été",
    type: "Reel Instagram",
    budget: "200,000 FCFA",
    applicants: 12,
    deadline: "5 jours",
  },
  {
    id: 2,
    title: "Lancement Produit Tech",
    type: "Vidéo YouTube",
    budget: "500,000 FCFA",
    applicants: 8,
    deadline: "12 jours",
  },
];

const topCreators = [
  { id: 1, name: "Aïcha", category: "Beauté", followers: "125K", image: "A" },
  { id: 2, name: "Kofi", category: "Tech", followers: "89K", image: "K" },
  { id: 3, name: "Amara", category: "Mode", followers: "210K", image: "A" },
];

const BrandDashboard = () => {
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
            <p className="text-muted-foreground text-sm">Tableau de bord</p>
            <h1 className="font-display text-2xl font-bold text-gold-gradient">
              Afrik'Beauty
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
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Quick Action */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="gold" size="lg" className="w-full">
            <Plus className="w-5 h-5" />
            Créer une nouvelle offre
          </Button>
        </motion.div>
      </div>

      {/* Active Offers */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Offres actives</h2>
            <button className="text-gold text-sm flex items-center gap-1">
              Gérer <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {activeOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="glass-card p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{offer.title}</h3>
                    <p className="text-sm text-muted-foreground">{offer.type}</p>
                  </div>
                  <span className="text-gold font-semibold">{offer.budget}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {offer.applicants} candidatures
                  </span>
                  <span className="text-gold">{offer.deadline} restants</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Creators */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Créateurs recommandés</h2>
            <button className="text-gold text-sm flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {topCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="glass-card p-4 min-w-[140px] text-center flex-shrink-0"
              >
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gold font-bold text-xl">{creator.image}</span>
                </div>
                <h3 className="font-semibold text-foreground">{creator.name}</h3>
                <p className="text-xs text-gold">{creator.category}</p>
                <p className="text-xs text-muted-foreground mt-1">{creator.followers} abonnés</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default BrandDashboard;
