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

// Social media icons as simple SVG components
const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

// Créateurs avec infos complètes
const allCreators = [
  {
    firstName: "Kofi",
    lastName: "Mensah",
    category: "Tech",
    country: "Ghana",
    flag: "🇬🇭",
    image: creatorTech,
    socials: {
      youtube: "320K",
      instagram: "150K",
      tiktok: "89K",
    },
  },
  {
    firstName: "Amara",
    lastName: "Diallo",
    category: "Mode",
    country: "Sénégal",
    flag: "🇸🇳",
    image: creatorFashion,
    socials: {
      youtube: "450K",
      instagram: "380K",
      snapchat: "120K",
    },
  },
  {
    firstName: "Moussa",
    lastName: "Traoré",
    category: "Fitness",
    country: "Mali",
    flag: "🇲🇱",
    image: creatorFitness,
    socials: {
      youtube: "280K",
      instagram: "210K",
      tiktok: "450K",
    },
  },
  {
    firstName: "Fatou",
    lastName: "Ndiaye",
    category: "Cuisine",
    country: "Sénégal",
    flag: "🇸🇳",
    image: creatorCuisine,
    socials: {
      instagram: "190K",
      tiktok: "340K",
    },
  },
  {
    firstName: "Awa",
    lastName: "Diop",
    category: "Beauté",
    country: "Côte d'Ivoire",
    flag: "🇨🇮",
    image: creatorBeauty,
    socials: {
      youtube: "520K",
      instagram: "680K",
      tiktok: "920K",
      snapchat: "150K",
    },
  },
  {
    firstName: "Kwame",
    lastName: "Asante",
    category: "Humour",
    country: "Nigeria",
    flag: "🇳🇬",
    image: creatorHumour,
    socials: {
      youtube: "890K",
      tiktok: "1.2M",
      snapchat: "340K",
    },
  },
  {
    firstName: "Mariama",
    lastName: "Bah",
    category: "Lifestyle",
    country: "Guinée",
    flag: "🇬🇳",
    image: creatorLifestyle,
    socials: {
      instagram: "210K",
      tiktok: "180K",
    },
  },
  {
    firstName: "Youssef",
    lastName: "Oumar",
    category: "Musique",
    country: "Cameroun",
    flag: "🇨🇲",
    image: creatorMusic,
    socials: {
      youtube: "670K",
      instagram: "420K",
      tiktok: "550K",
      snapchat: "95K",
    },
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
                  {/* Photo avec badge nom */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={creator.image}
                      alt={`${creator.firstName} ${creator.lastName}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    
                    {/* Badge nom */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold text-primary-foreground">
                      {creator.firstName}
                    </span>
                  </div>

                  {/* Infos */}
                  <div className="p-3">
                    {/* Pays */}
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <span>{creator.flag}</span>
                      <span>{creator.country}</span>
                    </div>
                    
                    {/* Réseaux sociaux */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {creator.socials.youtube && (
                        <div className="flex items-center gap-0.5">
                          <YoutubeIcon className="w-3 h-3 text-red-500" />
                          <span className="text-[9px] text-muted-foreground">{creator.socials.youtube}</span>
                        </div>
                      )}
                      {creator.socials.instagram && (
                        <div className="flex items-center gap-0.5">
                          <InstagramIcon className="w-3 h-3 text-pink-500" />
                          <span className="text-[9px] text-muted-foreground">{creator.socials.instagram}</span>
                        </div>
                      )}
                      {creator.socials.tiktok && (
                        <div className="flex items-center gap-0.5">
                          <TiktokIcon className="w-3 h-3 text-foreground" />
                          <span className="text-[9px] text-muted-foreground">{creator.socials.tiktok}</span>
                        </div>
                      )}
                    </div>
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
                        
                        {/* Nom Badge */}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold text-primary-foreground">
                          {creator.firstName} {creator.lastName}
                        </span>
                      </div>

                      {/* Infos */}
                      <div className="p-3">
                        {/* Pays */}
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          <span>{creator.flag}</span>
                          <span>{creator.country}</span>
                        </div>

                        {/* Réseaux sociaux */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {creator.socials.youtube && (
                            <div className="flex items-center gap-1">
                              <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {creator.socials.youtube}
                              </span>
                            </div>
                          )}
                          {creator.socials.instagram && (
                            <div className="flex items-center gap-1">
                              <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {creator.socials.instagram}
                              </span>
                            </div>
                          )}
                          {creator.socials.tiktok && (
                            <div className="flex items-center gap-1">
                              <TiktokIcon className="w-3.5 h-3.5 text-foreground" />
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {creator.socials.tiktok}
                              </span>
                            </div>
                          )}
                          {creator.socials.snapchat && (
                            <div className="flex items-center gap-1">
                              <SnapchatIcon className="w-3.5 h-3.5 text-yellow-400" />
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {creator.socials.snapchat}
                              </span>
                            </div>
                          )}
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

                {/* Grille des offres - 2 colonnes */}
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
                      {/* Gold gradient border on left */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold/60 to-gold/20" />
                      
                      <div className="p-4 pl-5">
                        {/* Header: Logo + Brand + Location */}
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

                        {/* Title in Gold */}
                        <h3 className="font-display font-bold text-gold-gradient text-base mb-2">
                          {offer.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {offer.description}
                        </p>

                        {/* Category Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gold/10 border border-gold/30 text-gold">
                            <span>👤</span>
                            {offer.category}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted/30 border border-border text-muted-foreground">
                            {offer.contentType}
                          </span>
                        </div>

                        {/* Budget & Deadline */}
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

                        {/* CTA Button - Gold outlined */}
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
