import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
          Politique de Confidentialité
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Dernière mise à jour : 6 février 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p>
              Chez CollabCrea, nous prenons la protection de vos données personnelles très au sérieux. 
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Données collectées</h2>
            <p>Nous collectons les types de données suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Informations de compte :</strong> nom, email, numéro de téléphone, pays</li>
              <li><strong>Informations de profil :</strong> photo, biographie, catégorie, tarifs</li>
              <li><strong>Données des réseaux sociaux :</strong> nombre d'abonnés (via OAuth avec votre consentement)</li>
              <li><strong>Documents d'identité :</strong> pour la vérification des créateurs</li>
              <li><strong>Données d'utilisation :</strong> interactions avec la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Fournir et améliorer nos services</li>
              <li>Vérifier l'authenticité des profils créateurs</li>
              <li>Faciliter les mises en relation avec les marques</li>
              <li>Communiquer avec vous concernant votre compte</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Intégrations tierces</h2>
            <p>
              Lorsque vous connectez vos comptes TikTok, YouTube ou autres réseaux sociaux, nous accédons 
              uniquement aux statistiques publiques (nombre d'abonnés) nécessaires pour vérifier votre profil. 
              Nous ne publions jamais en votre nom et ne stockons pas vos identifiants de connexion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Partage des données</h2>
            <p>Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations avec :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Les marques avec lesquelles vous choisissez de collaborer</li>
              <li>Nos prestataires techniques (hébergement, analyse)</li>
              <li>Les autorités si requis par la loi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Sécurité</h2>
            <p>
              Nous utilisons des mesures de sécurité conformes aux standards de l'industrie pour protéger 
              vos données, incluant le chiffrement, l'authentification sécurisée et des audits réguliers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Vos droits</h2>
            <p>Conformément aux lois applicables, vous avez le droit de :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Accéder à vos données personnelles</li>
              <li>Rectifier vos informations</li>
              <li>Supprimer votre compte et vos données</li>
              <li>Retirer votre consentement aux intégrations tierces</li>
              <li>Exporter vos données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Conservation des données</h2>
            <p>
              Nous conservons vos données tant que votre compte est actif. Après suppression de votre compte, 
              vos données sont effacées dans un délai de 30 jours, sauf obligation légale de conservation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Cookies</h2>
            <p>
              Nous utilisons des cookies essentiels pour le fonctionnement de la plateforme et des cookies 
              d'analyse pour améliorer nos services. Vous pouvez gérer vos préférences dans les paramètres 
              de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Contact</h2>
            <p>
              Pour exercer vos droits ou poser des questions sur cette politique, contactez-nous via la page{" "}
              <Link to="/contact" className="text-gold hover:underline">Contact</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
