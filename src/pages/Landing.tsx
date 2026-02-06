import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-creator.jpg";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="African content creator"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-hero-gradient" />
        </div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 safe-top px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-gold-gradient">
              Collab'Or
            </h1>
            <Link to="/auth">
              <Button variant="glass-gold" size="sm">
                Connexion
              </Button>
            </Link>
          </div>
        </motion.header>

        {/* Hero Content */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-8 safe-bottom"
        >
          <motion.div variants={fadeInUp} className="mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-gold text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Marketplace Africain #1
            </span>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4"
          >
            Connectez votre marque aux{" "}
            <span className="text-gold-gradient">voix qui comptent</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground text-lg mb-8 max-w-md"
          >
            La plateforme premium de mise en relation entre créateurs africains et marques mondiales.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col gap-3">
            <Link to="/auth?role=creator">
              <Button variant="gold" size="lg" className="w-full group">
                Je suis Créateur
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/auth?role=brand">
              <Button variant="glass-gold" size="lg" className="w-full">
                Je suis une Marque
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-12 bg-violet-gradient">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { value: "54+", label: "Pays", icon: Users },
            { value: "10K+", label: "Créateurs", icon: Sparkles },
            { value: "500+", label: "Marques", icon: TrendingUp },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 text-center"
            >
              <stat.icon className="w-5 h-5 text-gold mx-auto mb-2" />
              <p className="text-2xl font-bold text-gold-gradient">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-12">
        <motion.h3
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-2xl font-bold text-center mb-8"
        >
          Pourquoi <span className="text-gold-gradient">Collab'Or</span> ?
        </motion.h3>

        <div className="space-y-4">
          {[
            {
              title: "Pour les Créateurs",
              description: "Exposez votre talent, fixez vos tarifs en FCFA et recevez des offres de marques premium.",
              gradient: "from-gold/20 to-transparent",
            },
            {
              title: "Pour les Marques",
              description: "Découvrez des talents authentiques africains et lancez des campagnes d'influence impactantes.",
              gradient: "from-violet-light/20 to-transparent",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-6 bg-gradient-to-r ${feature.gradient}`}
            >
              <h4 className="font-display text-lg font-semibold text-gold mb-2">
                {feature.title}
              </h4>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-12 bg-violet-gradient">
        <motion.h3
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-xl font-bold text-center mb-6"
        >
          Catégories populaires
        </motion.h3>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2"
        >
          {["Beauté", "Mode", "Cuisine", "Humour", "Tech", "Lifestyle", "Fitness", "Musique"].map(
            (category) => (
              <span
                key={category}
                className="px-4 py-2 rounded-full glass text-sm text-gold border-gold/20 hover:border-gold/40 transition-colors cursor-pointer"
              >
                {category}
              </span>
            )
          )}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-8 border-gold/30"
        >
          <h3 className="font-display text-2xl font-bold mb-4">
            Prêt à <span className="text-gold-gradient">briller</span> ?
          </h3>
          <p className="text-muted-foreground mb-6">
            Rejoignez la communauté Collab'Or dès aujourd'hui.
          </p>
          <Link to="/auth">
            <Button variant="gold" size="lg" className="w-full">
              Commencer maintenant
              <Sparkles className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center border-t border-border">
        <p className="text-gold-gradient font-display text-lg font-semibold mb-2">
          Collab'Or
        </p>
        <p className="text-muted-foreground text-sm">
          © 2024 Collab'Or. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
