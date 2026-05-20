import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, DollarSign, Calendar, Send, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";

interface OfferData {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  location: string | null;
  logo_url: string | null;
  presence_mode: string;
  on_site_city: string | null;
  on_site_neighborhood: string | null;
  on_site_store_name: string | null;
  status: string;
  created_at: string;
  brand_id: string;
  brand_name?: string;
}

const OfferDetail = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!offerId) return;
    (async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .eq("status", "active")
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      // fetch brand name
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, full_name")
        .eq("user_id", data.brand_id)
        .maybeSingle();
      setOffer({
        ...(data as any),
        brand_name: profile?.company_name || profile?.full_name || "Marque",
      });
      setLoading(false);
    })();
  }, [offerId]);

  const formatBudget = () => {
    if (!offer) return "";
    if (offer.budget_min === offer.budget_max) {
      return `${offer.budget_min.toLocaleString("fr-FR")} FCFA`;
    }
    return `${offer.budget_min.toLocaleString("fr-FR")} - ${offer.budget_max.toLocaleString("fr-FR")} FCFA`;
  };

  const handleApply = () => {
    if (!user) {
      navigate(`/auth?redirect=/offer/${offerId}`);
      return;
    }
    navigate("/creator/offers");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  if (notFound || !offer) {
    return (
      <>
        <SEO
          title="Offre introuvable — CollabCréa"
          description="Cette offre n'est plus disponible."
          path={`/offer/${offerId}`}
        />
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <h1 className="text-2xl font-display font-bold mb-2">Offre introuvable</h1>
          <p className="text-muted-foreground mb-6">Cette offre n'est plus disponible.</p>
          <Button onClick={() => navigate("/explore")} variant="gold">Explorer les offres</Button>
        </div>
      </>
    );
  }

  const url = `https://collabcrea.com/offer/${offer.id}`;
  const description = offer.description.slice(0, 155);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: offer.title,
    description: offer.description,
    datePosted: offer.created_at,
    validThrough: offer.deadline,
    employmentType: "CONTRACTOR",
    hiringOrganization: {
      "@type": "Organization",
      name: offer.brand_name,
    },
    jobLocation: offer.on_site_city || offer.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: offer.on_site_city || offer.location,
          },
        }
      : undefined,
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "XOF",
      value: {
        "@type": "QuantitativeValue",
        minValue: offer.budget_min,
        maxValue: offer.budget_max,
        unitText: "PROJECT",
      },
    },
    url,
  };

  return (
    <>
      <SEO
        title={`${offer.title} — ${offer.brand_name} | CollabCréa`}
        description={description}
        path={`/offer/${offer.id}`}
        type="article"
        image={offer.logo_url || undefined}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link to="/" className="font-display font-bold text-gold">CollabCréa</Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <section className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gold/20 flex items-center justify-center flex-shrink-0">
              {offer.logo_url ? (
                <img src={offer.logo_url} alt={offer.brand_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gold font-bold text-2xl">{offer.brand_name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-gold font-semibold">{offer.brand_name}</p>
              {offer.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {offer.location}
                </p>
              )}
            </div>
          </section>

          <h1 className="font-display font-bold text-3xl text-gold-gradient">{offer.title}</h1>

          <div className="flex flex-wrap gap-2">
            {offer.category && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/10 border border-gold/30 text-gold">
                {offer.category}
              </span>
            )}
            {offer.content_type && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted/30 border border-border text-muted-foreground">
                {offer.content_type}
              </span>
            )}
            {offer.presence_mode === "on_site" && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 border border-accent/30 text-accent inline-flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Sur place
              </span>
            )}
          </div>

          <section className="rounded-2xl bg-card border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold" />
              <span className="font-semibold text-gold">{formatBudget()}</span>
            </div>
            {offer.deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>Avant le {new Date(offer.deadline).toLocaleDateString("fr-FR")}</span>
              </div>
            )}
            {offer.presence_mode === "on_site" && (offer.on_site_store_name || offer.on_site_city) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Store className="w-5 h-5" />
                <span>{[offer.on_site_store_name, offer.on_site_neighborhood, offer.on_site_city].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{offer.description}</p>
          </section>

          <Button onClick={handleApply} variant="gold" size="lg" className="w-full">
            <Send className="w-4 h-4 mr-2" />
            {user ? "Postuler à cette offre" : "Se connecter pour postuler"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/explore" className="underline">Voir toutes les offres</Link>
          </p>
        </main>
      </div>
    </>
  );
};

export default OfferDetail;
