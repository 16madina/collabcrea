import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>

        <h1 className="font-display text-3xl font-bold text-gold-gradient mb-8">
          Conditions Générales d'Utilisation
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Dernière mise à jour : 6 février 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Acceptation des conditions</h2>
            <p>
              En accédant et en utilisant CollabCrea, vous acceptez d'être lié par ces Conditions Générales d'Utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Description du service</h2>
            <p>
              CollabCrea est une plateforme de mise en relation entre créateurs de contenu et marques en Afrique. 
              Notre service permet aux créateurs de présenter leur profil et aux marques de proposer des collaborations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Inscription et compte</h2>
            <p>
              Pour utiliser certaines fonctionnalités de CollabCrea, vous devez créer un compte. Vous êtes responsable de :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Fournir des informations exactes et à jour</li>
              <li>Maintenir la confidentialité de vos identifiants de connexion</li>
              <li>Toutes les activités effectuées sous votre compte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Utilisation acceptable</h2>
            <p>Vous vous engagez à ne pas :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Utiliser la plateforme à des fins illégales</li>
              <li>Publier du contenu faux, trompeur ou diffamatoire</li>
              <li>Harceler ou intimider d'autres utilisateurs</li>
              <li>Tenter de compromettre la sécurité de la plateforme</li>
              <li>Créer plusieurs comptes ou usurper l'identité d'autrui</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Propriété intellectuelle</h2>
            <p>
              Vous conservez tous les droits sur le contenu que vous publiez. En publiant du contenu sur CollabCrea, 
              vous nous accordez une licence non exclusive pour afficher ce contenu sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Intégrations tierces</h2>
            <p>
              CollabCrea peut se connecter à des services tiers (TikTok, YouTube, Instagram, etc.) pour vérifier 
              vos statistiques. Ces connexions sont soumises aux conditions d'utilisation de ces services respectifs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Limitation de responsabilité</h2>
            <p>
              CollabCrea agit uniquement comme intermédiaire. Nous ne sommes pas responsables des accords conclus 
              entre créateurs et marques, ni des litiges pouvant en découler.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront 
              effet dès leur publication sur cette page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Contact</h2>
            <p>
              Pour toute question concernant ces conditions, veuillez nous contacter via la page{" "}
              <Link to="/contact" className="text-gold hover:underline">Contact</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
