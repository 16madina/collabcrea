Je vais corriger ce flux pour que le bouton “J’ai un code d’activation / d’invitation” affiche directement la saisie du code, au lieu de naviguer vers l’accueil.

Plan de correction :

1. Remplacer la redirection du bouton dans `src/pages/Auth.tsx`
   - Aujourd’hui, `openInviteGate()` met un flag puis fait `navigate("/")`.
   - C’est ce qui provoque le retour à la page d’accueil et peut ensuite laisser l’app repartir vers le profil si l’utilisateur est connecté.
   - Je vais faire ouvrir une fenêtre/pop-up de saisie du code directement depuis `/auth`.

2. Ajouter un vrai pop-up de code sur la page Auth
   - Créer un `Dialog` avec :
     - champ `COLLAB-XXXX`
     - bouton “Valider le code”
     - message d’erreur clair si le code est invalide ou déjà utilisé
     - loader pendant la vérification
   - Le bouton “J’ai un code d’invitation” ouvrira ce Dialog sans changer de page.

3. Utiliser la même sécurité “code à usage unique”
   - Le pop-up appellera `claim_invite_code` comme l’écran d’accès privé.
   - Si le code est accepté, il sera immédiatement désactivé pour empêcher une deuxième utilisation.
   - Le code sera enregistré localement uniquement pour permettre de continuer la création de compte.

4. Corriger la suite d’inscription après validation du code
   - Après validation, fermer le pop-up.
   - Afficher le bouton “Créer un compte”.
   - Pré-remplir le champ code de l’étape finale avec le code validé.

5. Éviter les redirections automatiques indésirables
   - Si l’utilisateur clique “J’ai un code” depuis `/auth`, il ne sera plus envoyé vers `/`.
   - Si un utilisateur déjà connecté arrive sur `/auth` uniquement pour entrer un code, le pop-up pourra s’ouvrir sans que la page le renvoie immédiatement vers le profil.

Détail technique :
- Fichier principal à modifier : `src/pages/Auth.tsx`.
- Je garderai `InviteGate.tsx` pour protéger les autres pages, mais le bouton de la page Auth ne dépendra plus de la redirection vers l’accueil.
- Je vérifierai aussi que l’appel de validation côté inscription reste compatible avec les codes déjà “claim” par le pop-up.