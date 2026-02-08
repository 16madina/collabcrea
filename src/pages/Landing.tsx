import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Users, HelpCircle, X, Briefcase, DollarSign, Calendar, MapPin, Send, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import CreatorCard from "@/components/CreatorCard";
import CreatorDetailSheet from "@/components/CreatorDetailSheet";
import NotificationBell from "@/components/NotificationBell";
import type { Creator } from "@/components/CreatorDetailSheet";
import { useCreators } from "@/hooks/useCreators";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-creator.jpg";
import logoCollabCrea from "@/assets/logo-collabcrea.png";
import logoCollabCreaFull from "@/assets/logo-collabcrea-full-new.png";
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
  const [selectedCreator, setSelectedCreator] = useState<(Creator & { userId: string }) | null>(null);
  const [showCreatorDetail, setShowCreatorDetail] = useState(false);
  const { isAdmin } = useAdmin();
  const { user } = useAuth();
  const { allCreators, loading } = useCreators();

  const handleCreatorClick = (creator: Creator & { userId: string }) => {
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
          className="relative z-10 px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-2"
        >
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img 
                src={logoCollabCrea} 
                alt="CollabCréa" 
                className="h-10 md:h-12 w-auto"
              />
            </Link>
            <div className="flex items-center gap-1">
              {user && <NotificationBell />}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="text-xs px-2 py-1.5 h-auto text-gold">
                    <Shield className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Link to={user ? (isAdmin ? "/admin" : "/auth") : "/auth"}>
                <Button variant="glass-gold" size="sm" className="text-xs px-3 py-1.5 h-auto">
                  {user ? "Mon compte" : "Connexion"}
                </Button>
              </Link>
            </div>
          </div>
        </motion.header>

        {/* Hero Content */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="relative z-10 px-6 pt-8 flex flex-col items-center text-center"
        >
          {/* Logo centré avec glow statique */}
          <motion.div 
            variants={fadeInUp} 
            className="mb-4 relative"
            style={{
              filter: "drop-shadow(0 0 30px rgba(212, 175, 55, 0.5))"
            }}
          >
            <img 
              src={logoCollabCreaFull} 
              alt="CollabCréa" 
              className="h-32 md:h-40 w-auto mx-auto"
            />
          </motion.div>

          {/* Slogan */}
          <motion.h2
            variants={fadeInUp}
            className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight mb-4 max-w-sm"
          >
            Connectez votre marque aux{" "}
            <span className="text-gold-gradient">voix qui comptent</span>
          </motion.h2>

          <motion.div variants={fadeInUp} className="mb-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-gold text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Marketplace Africain #1
            </span>
          </motion.div>

          {/* Boutons avec stats en dessous - Optimisé mobile */}
          <motion.div variants={fadeInUp} className="flex items-stretch justify-center gap-2 mb-4 w-full px-2">
            {/* Je suis Créateur + stat */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <Link to="/auth?role=creator" className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gold hover:text-gold/80 text-xs sm:text-sm w-full px-1 sm:px-3 h-auto py-2"
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Créateur</span>
                </Button>
              </Link>
              <div className="glass rounded-lg px-2 sm:px-3 py-1.5 text-center mt-1.5 w-full">
                <p className="text-base sm:text-lg font-bold text-gold-gradient">10K+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Créateurs</p>
              </div>
            </div>

            {/* Je suis une Marque + stat */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <Link to="/auth?role=brand" className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gold hover:text-gold/80 text-xs sm:text-sm w-full px-1 sm:px-3 h-auto py-2"
                >
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Marque</span>
                </Button>
              </Link>
              <div className="glass rounded-lg px-2 sm:px-3 py-1.5 text-center mt-1.5 w-full">
                <p className="text-base sm:text-lg font-bold text-gold-gradient">500+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Marques</p>
              </div>
            </div>

            {/* Comment ça marche + stat */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHowItWorks(true)}
                className="text-gold hover:text-gold/80 text-xs sm:text-sm w-full px-1 sm:px-3 h-auto py-2"
              >
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Comment ?</span>
              </Button>
              <div className="glass rounded-lg px-2 sm:px-3 py-1.5 text-center mt-1.5 w-full">
                <p className="text-base sm:text-lg font-bold text-gold-gradient">54+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Pays</p>
              </div>
            </div>
          </motion.div>

          {/* Créateurs populaires - Défilement infini */}
          <motion.div variants={fadeInUp} className="mt-6 w-full">
            <h3 className="font-display text-base font-bold mb-3 text-center">
              Créateurs <span className="text-gold-gradient">populaires</span>
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
              </div>
            ) : (
              <div className="overflow-hidden -mx-6">
                <div className="flex animate-marquee gap-3 w-max">
                  {/* Première série de cartes */}
                  {allCreators.slice(0, 4).map((creator, index) => (
                    <div key={`first-${creator.userId}`} className="flex-shrink-0">
                      <CreatorCard
                        creator={creator}
                        index={index}
                        variant="horizontal"
                        onClick={() => handleCreatorClick(creator)}
                      />
                    </div>
                  ))}
                  {/* Duplication pour effet infini */}
                  {allCreators.slice(0, 4).map((creator, index) => (
                    <div key={`second-${creator.userId}`} className="flex-shrink-0">
                      <CreatorCard
                        creator={creator}
                        index={index}
                        variant="horizontal"
                        onClick={() => handleCreatorClick(creator)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {allCreators.map((creator, index) => (
                      <CreatorCard
                        key={creator.userId}
                        creator={creator}
                        index={index}
                        onClick={() => handleCreatorClick(creator)}
                      />
                    ))}
                  </div>
                )}
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
      <BottomNav />

      {/* Creator Detail Sheet */}
      <CreatorDetailSheet
        creator={selectedCreator}
        creatorUserId={selectedCreator?.userId.startsWith("static-") ? null : selectedCreator?.userId}
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
