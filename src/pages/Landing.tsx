import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, TrendingUp, Star, Instagram, Youtube, CheckCircle, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LandingNav from "@/components/LandingNav";
import heroImage from "@/assets/hero-creator.jpg";
import creatorTech from "@/assets/creator-tech.jpg";
import creatorFashion from "@/assets/creator-fashion.jpg";
import creatorFitness from "@/assets/creator-fitness.jpg";
import creatorCuisine from "@/assets/creator-cuisine.jpg";

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

const featuredCreators = [
  {
    name: "Kofi Mensah",
    category: "Tech",
    followers: "320K",
    rating: 4.9,
    image: creatorTech,
    platforms: ["YouTube", "Instagram"],
  },
  {
    name: "Amara Diallo",
    category: "Mode",
    followers: "450K",
    rating: 5.0,
    image: creatorFashion,
    platforms: ["Instagram", "TikTok"],
  },
  {
    name: "Moussa Traoré",
    category: "Fitness",
    followers: "280K",
    rating: 4.8,
    image: creatorFitness,
    platforms: ["YouTube", "TikTok"],
  },
  {
    name: "Fatou Ndiaye",
    category: "Cuisine",
    followers: "190K",
    rating: 4.9,
    image: creatorCuisine,
    platforms: ["YouTube", "Instagram"],
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Créez votre profil",
    description: "Inscrivez-vous et personnalisez votre profil avec votre portfolio et tarifs.",
  },
  {
    step: "02",
    title: "Recevez des offres",
    description: "Les marques vous découvrent et vous envoient des propositions de collaboration.",
  },
  {
    step: "03",
    title: "Collaborez & Gagnez",
    description: "Négociez, créez du contenu et recevez votre paiement en FCFA.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 h-[70vh]">
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
          className="relative z-10 px-6 pt-8"
        >
          <motion.div variants={fadeInUp} className="mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-gold text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Marketplace Africain #1
            </span>
          </motion.div>

          {/* Slogan Principal - Réduit et monté */}
          <motion.h2
            variants={fadeInUp}
            className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight mb-2"
          >
            Connectez votre marque aux{" "}
            <span className="text-gold-gradient">voix qui comptent</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground text-sm mb-6 max-w-sm"
          >
            La plateforme premium de mise en relation entre créateurs africains et marques mondiales.
          </motion.p>

          {/* Boutons */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-2 mb-6">
            <Link to="/auth?role=creator">
              <Button variant="gold" size="default" className="w-full group">
                Je suis Créateur
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/auth?role=brand">
              <Button variant="glass-gold" size="default" className="w-full">
                Je suis une Marque
              </Button>
            </Link>
          </motion.div>

          {/* Stats - Réduits et compacts */}
          <motion.div
            variants={fadeInUp}
            className="flex justify-between gap-2 mb-6"
          >
            {[
              { value: "54+", label: "Pays" },
              { value: "10K+", label: "Créateurs" },
              { value: "500+", label: "Marques" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 glass rounded-xl p-3 text-center"
              >
                <p className="text-lg font-bold text-gold-gradient">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Creators - Juste après les boutons */}
      <section className="px-6 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold">
              Créateurs <span className="text-gold-gradient">vedettes</span>
            </h3>
            <Link to="/auth?role=brand" className="text-gold text-xs flex items-center gap-1">
              Voir tous <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
            {featuredCreators.map((creator, index) => (
              <motion.div
                key={creator.name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-[140px]"
              >
                <div className="glass-card overflow-hidden group">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={creator.image}
                      alt={creator.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    
                    {/* Category Badge */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/90 text-primary-foreground">
                      {creator.category}
                    </span>

                    {/* Rating */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full glass text-[10px]">
                      <Star className="w-2.5 h-2.5 text-gold fill-gold" />
                      <span className="text-foreground">{creator.rating}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <h4 className="font-semibold text-xs text-foreground truncate">{creator.name}</h4>
                    <p className="text-gold text-[10px] font-medium">{creator.followers}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-12 bg-violet-gradient">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="font-display text-2xl font-bold text-center mb-8">
            Comment ça <span className="text-gold-gradient">marche</span> ?
          </h3>

          <div className="space-y-6">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center">
                  <span className="text-gold font-bold">{item.step}</span>
                </div>
                <div>
                  <h4 className="font-display text-lg font-semibold text-gold mb-1">
                    {item.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
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
              features: [
                "Exposez votre talent à 500+ marques",
                "Fixez vos tarifs en FCFA",
                "Messagerie intégrée sécurisée",
                "Portfolio professionnel",
              ],
              gradient: "from-gold/20 to-transparent",
            },
            {
              title: "Pour les Marques",
              features: [
                "Accès à 10K+ créateurs vérifiés",
                "Filtres par catégorie et pays",
                "Gestion des campagnes simplifiée",
                "Analytics détaillés",
              ],
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
              <h4 className="font-display text-lg font-semibold text-gold mb-4">
                {feature.title}
              </h4>
              <ul className="space-y-3">
                {feature.features.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
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
          {["Beauté", "Mode", "Cuisine", "Humour", "Tech", "Lifestyle", "Fitness", "Musique", "Business", "Éducation"].map(
            (category, index) => (
              <motion.span
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="px-4 py-2 rounded-full glass text-sm text-gold border-gold/20 hover:border-gold/40 transition-colors cursor-pointer"
              >
                {category}
              </motion.span>
            )
          )}
        </motion.div>
      </section>

      {/* Pricing Types */}
      <section className="px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="font-display text-2xl font-bold text-center mb-2">
            Types de <span className="text-gold-gradient">contenu</span>
          </h3>
          <p className="text-muted-foreground text-center text-sm mb-8">
            Tarification flexible en FCFA
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { type: "Story Instagram", icon: Instagram, range: "30K - 100K" },
              { type: "Reel / TikTok", icon: Play, range: "50K - 200K" },
              { type: "Vidéo YouTube", icon: Youtube, range: "150K - 500K" },
              { type: "Live", icon: Play, range: "100K - 300K" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-4 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{item.type}</h4>
                  <p className="text-gold text-xs font-medium">{item.range} FCFA</p>
                </motion.div>
              );
            })}
          </div>
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
          <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold mb-2">
            Prêt à <span className="text-gold-gradient">briller</span> ?
          </h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Rejoignez la communauté Collab'Or et connectez-vous aux opportunités qui comptent.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/auth?role=creator">
              <Button variant="gold" size="lg" className="w-full">
                Devenir Créateur
                <Sparkles className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/auth?role=brand">
              <Button variant="glass-gold" size="lg" className="w-full">
                Inscrire ma Marque
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 pb-28 text-center border-t border-border">
        <p className="text-gold-gradient font-display text-lg font-semibold mb-2">
          Collab'Or
        </p>
        <p className="text-muted-foreground text-xs mb-4">
          "Connectez votre marque aux voix qui comptent"
        </p>
        <p className="text-muted-foreground text-xs">
          © 2024 Collab'Or. Tous droits réservés.
        </p>
      </footer>

      {/* Bottom Navigation */}
      <LandingNav />
    </div>
  );
};

export default Landing;
