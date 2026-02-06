import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Users, HelpCircle, X, Briefcase, DollarSign, Calendar, MapPin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LandingNav from "@/components/LandingNav";
import CreatorCard from "@/components/CreatorCard";
import CreatorDetailSheet from "@/components/CreatorDetailSheet";
import type { Creator } from "@/components/CreatorDetailSheet";
import { allCreators } from "@/data/creators";
import heroImage from "@/assets/hero-creator.jpg";
import logoCollabCrea from "@/assets/logo-collabcrea.png";
import logoKariteDor from "@/assets/logo-karite-dor.jpg";
import logoTechAfrik from "@/assets/logo-techafrik.jpg";
import logoNestleAfrique from "@/assets/logo-nestle-afrique.jpg";
import logoNikeAfrique from "@/assets/logo-nike-afrique.jpg";
import logoLorealAfrique from "@/assets/logo-loreal-afrique.jpg";
import logoMtn from "@/assets/logo-mtn.jpg";

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

const allOffers = [
  {
    id: 1,
    brand: "Karité d'Or",
    logo: logoKariteDor,
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
    logo: logoTechAfrik,
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
    logo: logoNestleAfrique,
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
    logo: logoNikeAfrique,
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
    logo: logoLorealAfrique,
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
    logo: logoMtn,
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
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showCreatorDetail, setShowCreatorDetail] = useState(false);

  const handleCreatorClick = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowCreatorDetail(true);
  };

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
            <Link to="/" className="flex items-center">
              <img 
                src={logoCollabCrea} 
                alt="CollabCréa" 
                className="h-16 md:h-20 w-auto"
              />
            </Link>
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

          {/* Créateurs populaires */}
          <motion.div variants={fadeInUp} className="mt-8">
            <h3 className="font-display text-lg font-bold mb-4">
              Créateurs <span className="text-gold-gradient">populaires</span>
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
              {allCreators.slice(0, 4).map((creator, index) => (
                <CreatorCard
                  key={creator.firstName}
                  creator={creator}
                  index={index}
                  variant="horizontal"
                  onClick={() => handleCreatorClick(creator)}
                />
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
                  <Link to="/explore" className="text-gold text-xs flex items-center gap-1">
                    Voir tous <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Grille de cartes créateurs */}
                <div className="grid grid-cols-2 gap-3">
                  {allCreators.map((creator, index) => (
                    <CreatorCard
                      key={creator.firstName + creator.lastName}
                      creator={creator}
                      index={index}
                      onClick={() => handleCreatorClick(creator)}
                    />
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

                {/* Grille des offres */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allOffers.map((offer, index) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="relative rounded-2xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)',
                      }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold/60 to-gold/20" />
                      
                      <div className="p-4 pl-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                            <img src={offer.logo} alt={offer.brand} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gold">
                              {offer.brand}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {offer.location}
                            </div>
                          </div>
                        </div>

                        <h3 className="font-display font-bold text-gold-gradient text-base mb-2">
                          {offer.title}
                        </h3>

                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {offer.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gold/10 border border-gold/30 text-gold">
                            <span>👤</span>
                            {offer.category}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted/30 border border-border text-muted-foreground">
                            {offer.contentType}
                          </span>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gold" />
                            <span className="font-semibold text-gold text-sm">{offer.budget}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{offer.deadline}</span>
                          </div>
                        </div>

                        <Link to="/auth?role=creator" className="block">
                          <button className="w-full py-3 rounded-xl border-2 border-gold/60 text-foreground font-medium flex items-center justify-center gap-2 hover:bg-gold/10 hover:border-gold transition-all">
                            <Send className="w-4 h-4" />
                            Postuler
                          </button>
                        </Link>
                      </div>
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
            Rejoignez la communauté CollabCréa
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
        <img 
          src={logoCollabCrea} 
          alt="CollabCréa" 
          className="h-16 w-auto mx-auto mb-4"
        />
        <p className="text-muted-foreground text-[10px] mb-2">
          "Connectez votre marque aux voix qui comptent"
        </p>
        <p className="text-muted-foreground text-[10px]">
          © 2026 CollabCréa. Tous droits réservés.
        </p>
      </footer>

      {/* Bottom Navigation */}
      <LandingNav />

      {/* Creator Detail Sheet */}
      <CreatorDetailSheet
        creator={selectedCreator}
        open={showCreatorDetail}
        onOpenChange={setShowCreatorDetail}
      />

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
