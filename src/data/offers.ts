import logoKariteDor from "@/assets/logo-karite-dor.jpg";
import logoTechAfrik from "@/assets/logo-techafrik.jpg";
import logoNestleAfrique from "@/assets/logo-nestle-afrique.jpg";
import logoNikeAfrique from "@/assets/logo-nike-afrique.jpg";
import logoLorealAfrique from "@/assets/logo-loreal-afrique.jpg";
import logoMtn from "@/assets/logo-mtn.jpg";

export interface MockOffer {
  id: string;
  brand: string;
  brand_id: string;
  logo_url: string;
  location: string;
  title: string;
  category: string;
  content_type: string;
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  description: string;
  status: string;
  created_at: string;
}

export const mockOffers: MockOffer[] = [
  {
    id: "mock-1",
    brand: "Karité d'Or",
    brand_id: "mock-brand-1",
    logo_url: logoKariteDor,
    location: "Côte d'Ivoire",
    title: "Campagne beauté naturelle",
    category: "Beauté",
    content_type: "Reel",
    budget_min: 150000,
    budget_max: 300000,
    deadline: "2026-02-28",
    description: "Recherche créateurs beauté pour promouvoir notre nouvelle gamme de soins au karité.",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    brand: "TechAfrik",
    brand_id: "mock-brand-2",
    logo_url: logoTechAfrik,
    location: "Nigeria",
    title: "Tech Review Smartphone",
    category: "Tech",
    content_type: "Vidéo YouTube",
    budget_min: 200000,
    budget_max: 500000,
    deadline: "2026-02-27",
    description: "Besoin de YouTubers tech pour unboxing et review de notre nouveau smartphone.",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    brand: "Nestlé Afrique",
    brand_id: "mock-brand-3",
    logo_url: logoNestleAfrique,
    location: "Sénégal",
    title: "Recettes créatives Nescafé",
    category: "Cuisine",
    content_type: "Reel",
    budget_min: 400000,
    budget_max: 800000,
    deadline: "2026-03-05",
    description: "Partagez des recettes originales avec nos produits café.",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    brand: "Nike Afrique",
    brand_id: "mock-brand-4",
    logo_url: logoNikeAfrique,
    location: "Ghana",
    title: "Challenge fitness viral",
    category: "Fitness",
    content_type: "TikTok",
    budget_min: 800000,
    budget_max: 1500000,
    deadline: "2026-03-15",
    description: "Lancez un challenge fitness avec nos nouveaux équipements.",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-5",
    brand: "L'Oréal Afrique",
    brand_id: "mock-brand-5",
    logo_url: logoLorealAfrique,
    location: "Cameroun",
    title: "Tutoriel maquillage",
    category: "Beauté",
    content_type: "Vidéo YouTube",
    budget_min: 350000,
    budget_max: 700000,
    deadline: "2026-03-10",
    description: "Créez des tutoriels avec notre nouvelle gamme de maquillage.",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-6",
    brand: "MTN",
    brand_id: "mock-brand-6",
    logo_url: logoMtn,
    location: "Côte d'Ivoire",
    title: "Campagne Mobile Money",
    category: "Tech",
    content_type: "Story",
    budget_min: 600000,
    budget_max: 1200000,
    deadline: "2026-03-20",
    description: "Promouvoir notre service de paiement mobile auprès des jeunes.",
    status: "active",
    created_at: new Date().toISOString(),
  },
];
