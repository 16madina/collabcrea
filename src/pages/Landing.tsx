import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Users, Star, HelpCircle, X, Briefcase, DollarSign, Calendar, MapPin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LandingNav from "@/components/LandingNav";
import heroImage from "@/assets/hero-creator.jpg";
import creatorTech from "@/assets/creator-tech.jpg";
import creatorFashion from "@/assets/creator-fashion.jpg";
import creatorFitness from "@/assets/creator-fitness.jpg";
import creatorCuisine from "@/assets/creator-cuisine.jpg";
import creatorBeauty from "@/assets/creator-beauty.jpg";
import creatorHumour from "@/assets/creator-humour.jpg";
import creatorLifestyle from "@/assets/creator-lifestyle.jpg";
import creatorMusic from "@/assets/creator-music.jpg";

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

// Créateurs avec infos complètes
const allCreators = [
  {
    firstName: "Kofi",
    lastName: "Mensah",
    category: "Tech",
    followers: "320K",
    country: "Ghana",
    flag: "🇬🇭",
    image: creatorTech,
  },
  {
    firstName: "Amara",
    lastName: "Diallo",
    category: "Mode",
    followers: "450K",
    country: "Sénégal",
    flag: "🇸🇳",
    image: creatorFashion,
  },
  {
    firstName: "Moussa",
    lastName: "Traoré",
    category: "Fitness",
    followers: "280K",
    country: "Mali",
    flag: "🇲🇱",
    image: creatorFitness,
  },
  {
    firstName: "Fatou",
    lastName: "Ndiaye",
    category: "Cuisine",
    followers: "190K",
    country: "Sénégal",
    flag: "🇸🇳",
    image: creatorCuisine,
  },
  {
    firstName: "Awa",
    lastName: "Diop",
    category: "Beauté",
    followers: "520K",
    country: "Côte d'Ivoire",
    flag: "🇨🇮",
    image: creatorBeauty,
  },
  {
    firstName: "Kwame",
    lastName: "Asante",
    category: "Humour",
    followers: "890K",
    country: "Nigeria",
    flag: "🇳🇬",
    image: creatorHumour,
  },
  {
    firstName: "Mariama",
    lastName: "Bah",
    category: "Lifestyle",
    followers: "210K",
    country: "Guinée",
    flag: "🇬🇳",
    image: creatorLifestyle,
  },
  {
    firstName: "Youssef",
    lastName: "Oumar",
    category: "Musique",
    followers: "670K",
    country: "Cameroun",
    flag: "🇨🇲",
    image: creatorMusic,
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

// Offres disponibles
const allOffers = [
  {
    id: 1,
    brand: "Karité d'Or",
    logo: "🏛️",
    location: "Côte d'Ivoire",
    title: "Campagne beauté naturelle",
    category: "Beauté",
    contentType: "Reel",
    budget: "150K - 300K FCFA",
    deadline: "Avant le 28 févr.",
    description: "Recherche créateurs beauté pour promouvoir notre nouvelle gamme de soins au karité.",
  },
  {
    id: 2,
    brand: "TechAfrik",
    logo: "📱",
    location: "Nigeria",
    title: "Tech Review Smartphone",
    category: "Tech",
    contentType: "Vidéo YouTube",
    budget: "200K - 500K FCFA",
    deadline: "Avant le 27 févr.",
    description: "Besoin de YouTubers tech pour unboxing et review de notre nouveau smartphone.",
  },
  {
    id: 3,
    brand: "Nestlé Afrique",
    logo: "☕",
    location: "Sénégal",
    title: "Recettes créatives Nescafé",
    category: "Cuisine",
    contentType: "Reel",
    budget: "400K - 800K FCFA",
    deadline: "Avant le 5 mars",
    description: "Partagez des recettes originales avec nos produits café.",
  },
  {
    id: 4,
    brand: "Nike Afrique",
    logo: "✓",
    location: "Ghana",
    title: "Challenge fitness viral",
    category: "Fitness",
    contentType: "TikTok",
    budget: "800K - 1.5M FCFA",
    deadline: "Avant le 15 mars",
    description: "Lancez un challenge fitness avec nos nouveaux équipements.",
  },
  {
    id: 5,
    brand: "L'Oréal Afrique",
    logo: "💄",
    location: "Cameroun",
    title: "Tutoriel maquillage",
    category: "Beauté",
    contentType: "Vidéo YouTube",
    budget: "350K - 700K FCFA",
    deadline: "Avant le 10 mars",
    description: "Créez des tutoriels avec notre nouvelle gamme de maquillage.",
  },
  {
    id: 6,
    brand: "MTN",
    logo: "📶",
    location: "Côte d'Ivoire",
    title: "Campagne Mobile Money",
    category: "Tech",
    contentType: "Story",
    budget: "600K - 1.2M FCFA",
    deadline: "Avant le 20 mars",
    description: "Promouvoir notre service de paiement mobile auprès des jeunes.",
  },
];

type TabType = "creators" | "offers";

const Landing = () => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("creators");

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 h-[50vh]">
          <img
            src={heroImage}
            alt="African content creator"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
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
          className="relative z-10 px-6 pt-4"
        >
          <motion.div variants={fadeInUp} className="mb-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-gold text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Marketplace Africain #1
            </span>
          </motion.div>

          {/* Slogan Principal - Compact */}
          <motion.h2
            variants={fadeInUp}
            className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight mb-2"
          >
            Connectez votre marque aux{" "}
            <span className="text-gold-gradient">voix qui comptent</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground text-xs mb-4 max-w-sm"
          >
            La plateforme premium de mise en relation entre créateurs africains et marques mondiales.
          </motion.p>

          {/* Boutons + Comment ça marche */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-2 mb-4">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHowItWorks(true)}
              className="text-gold hover:text-gold/80"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Comment ça marche ?
            </Button>
          </motion.div>

          {/* Stats - Très compact */}
          <motion.div
            variants={fadeInUp}
            className="flex justify-between gap-2"
          >
            {[
              { value: "54+", label: "Pays" },
              { value: "10K+", label: "Créateurs" },
              { value: "500+", label: "Marques" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 glass rounded-lg p-2 text-center"
              >
                <p className="text-sm font-bold text-gold-gradient">{stat.value}</p>
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Créateurs populaires - Grandes cartes */}
          <motion.div variants={fadeInUp} className="mt-8">
            <h3 className="font-display text-lg font-bold mb-4">
              Créateurs <span className="text-gold-gradient">populaires</span>
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
              {allCreators.slice(0, 4).map((creator, index) => (
                <motion.div
                  key={creator.firstName}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex-shrink-0 w-40 glass-card overflow-hidden"
                >
                  {/* Photo avec badge catégorie et note */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={creator.image}
                      alt={`${creator.firstName} ${creator.lastName}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    
                    {/* Badge catégorie */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold text-primary-foreground">
                      {creator.category}
                    </span>
                    
                    {/* Badge note */}
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium glass">
                      <Star className="w-3 h-3 text-gold fill-gold" />
                      <span className="text-foreground">{(4.5 + Math.random() * 0.5).toFixed(1)}</span>
                    </span>
                  </div>

                  {/* Infos */}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {creator.firstName} {creator.lastName}
                    </h4>
                    <p className="text-xs text-gold">{creator.followers}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Section avec onglets */}
      <section className="px-6 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {/* Onglets */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("creators")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "creators"
                  ? "bg-gold text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Nos Créateurs
            </button>
            <button
              onClick={() => setActiveTab("offers")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "offers"
                  ? "bg-gold text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="w-4 h-4 inline-block mr-2" />
              Offres
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "creators" ? (
              <motion.div
                key="creators"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold">
                    Nos <span className="text-gold-gradient">Créateurs</span>
                  </h3>
                  <Link to="/auth?role=brand" className="text-gold text-xs flex items-center gap-1">
                    Voir tous <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Grille de cartes créateurs */}
                <div className="grid grid-cols-2 gap-3">
                  {allCreators.map((creator, index) => (
                    <motion.div
                      key={creator.firstName + creator.lastName}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card overflow-hidden"
                    >
                      {/* Photo */}
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={creator.image}
                          alt={`${creator.firstName} ${creator.lastName}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                        
                        {/* Catégorie Badge */}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold text-primary-foreground">
                          {creator.category}
                        </span>
                      </div>

                      {/* Infos */}
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-foreground">
                          {creator.firstName} {creator.lastName}
                        </h4>
                        
                        {/* Pays */}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                          <span>{creator.flag}</span>
                          <span>{creator.country}</span>
                        </div>

                        {/* Followers */}
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="w-3 h-3 text-gold" />
                          <span className="text-xs font-semibold text-gold">{creator.followers}</span>
                          <span className="text-[10px] text-muted-foreground">abonnés</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="offers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold">
                    Opportunités <span className="text-gold-gradient">disponibles</span>
                  </h3>
                  <Link to="/auth?role=creator" className="text-gold text-xs flex items-center gap-1">
                    Postuler <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Liste des offres */}
                <div className="space-y-3">
                  {allOffers.map((offer, index) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card p-4 border border-gold/20"
                    >
                      {/* Header: Logo + Brand + Location */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-2xl shadow-lg">
                          {offer.logo}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gold">
                            {offer.brand}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {offer.location}
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-bold text-foreground mb-2">
                        {offer.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {offer.description}
                      </p>

                      {/* Category Badges */}
                      <div className="flex gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-gold/40 text-gold">
                          <span className="text-sm">👤</span>
                          {offer.category}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium border border-border text-muted-foreground">
                          {offer.contentType}
                        </span>
                      </div>

                      {/* Budget & Deadline */}
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gold" />
                          <span className="font-semibold text-gold">{offer.budget}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{offer.deadline}</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Link to="/auth?role=creator">
                        <Button 
                          variant="outline" 
                          size="default" 
                          className="w-full border-gold/50 text-foreground hover:bg-gold/10 hover:border-gold"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Postuler
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-8 bg-violet-gradient">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-6 border-gold/30 text-center"
        >
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-3" />
          <h3 className="font-display text-xl font-bold mb-2">
            Prêt à <span className="text-gold-gradient">briller</span> ?
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Rejoignez la communauté Collab'Or
          </p>
          <Link to="/auth">
            <Button variant="gold" size="default" className="w-full">
              Commencer maintenant
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 pb-28 text-center border-t border-border">
        <p className="text-gold-gradient font-display text-lg font-semibold mb-1">
          Collab'Or
        </p>
        <p className="text-muted-foreground text-[10px] mb-2">
          "Connectez votre marque aux voix qui comptent"
        </p>
        <p className="text-muted-foreground text-[10px]">
          © 2024 Collab'Or. Tous droits réservés.
        </p>
      </footer>

      {/* Bottom Navigation */}
      <LandingNav />

      {/* Modal Comment ça marche */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full glass-card rounded-t-3xl p-6 safe-bottom max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">
                  Comment ça <span className="text-gold-gradient">marche</span> ?
                </h2>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="touch-target"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                {howItWorks.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
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

              <div className="mt-8">
                <Link to="/auth" onClick={() => setShowHowItWorks(false)}>
                  <Button variant="gold" size="lg" className="w-full">
                    Commencer maintenant
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
