import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChildSafety = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Sécurité des enfants</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-foreground">
        <h2 className="text-2xl font-bold">Normes de sécurité des enfants (CSAE)</h2>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : 10 février 2026</p>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Engagement</h3>
          <p>
            CollabCrea s'engage fermement à protéger la sécurité des enfants. Notre plateforme est destinée
            aux utilisateurs âgés de 18 ans et plus. Nous appliquons une politique de tolérance zéro envers
            tout contenu lié à l'abus sexuel sur des enfants et à l'exploitation sexuelle d'enfants (CSAE).
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Politique contre les contenus CSAE</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Tout contenu représentant, encourageant ou facilitant l'exploitation ou les abus sexuels sur des enfants est strictement interdit.</li>
            <li>Tout utilisateur publiant, partageant ou distribuant de tels contenus sera immédiatement banni de la plateforme.</li>
            <li>Les comptes en infraction seront signalés aux autorités compétentes et aux organisations de protection de l'enfance.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Signalement</h3>
          <p>
            CollabCrea permet à ses utilisateurs de signaler tout contenu ou comportement inapproprié
            directement dans l'application via notre système de signalement intégré. Chaque signalement
            est examiné par notre équipe de modération dans les plus brefs délais.
          </p>
          <p>
            Pour signaler un problème lié à la sécurité des enfants, vous pouvez :
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Utiliser le bouton de signalement disponible sur chaque profil et chaque offre dans l'application.</li>
            <li>Nous contacter par email à : <a href="mailto:contact@collabcrea.com" className="text-primary underline">contact@collabcrea.com</a></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Modération et prévention</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Notre équipe de modération examine les contenus signalés et prend des mesures immédiates, y compris la suppression de contenu et le bannissement de comptes.</li>
            <li>Nous coopérons pleinement avec les forces de l'ordre et les organisations de protection de l'enfance.</li>
            <li>L'inscription est réservée aux personnes de 18 ans et plus.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Contact</h3>
          <p>
            Pour toute question relative à la sécurité des enfants sur notre plateforme, contactez-nous à :
          </p>
          <p>
            <a href="mailto:contact@collabcrea.com" className="text-primary underline">contact@collabcrea.com</a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default ChildSafety;
