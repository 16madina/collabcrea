## Problème

Sur la page Connexion, le lien **"Pas encore de compte ? S'inscrire"** (en bas du formulaire de connexion) bascule directement vers le formulaire d'inscription **sans vérifier si l'utilisateur a un code d'activation valide**. Résultat : un utilisateur peut contourner totalement le code en passant par "Se connecter" puis "S'inscrire".

Le bouton "Créer un compte" sur l'écran de choix initial est, lui, déjà correctement protégé (il n'apparaît que si `!inviteRequired || hasValidatedCode`), mais le raccourci depuis la page Connexion ne l'est pas.

## Correction

Dans `src/pages/Auth.tsx` :

1. **Intercepter le clic "S'inscrire" depuis le formulaire de connexion**
   - Modifier la fonction passée en `onSwitchToSignup` au composant `LoginForm` (ligne ~776).
   - Nouveau comportement :
     - Si les codes ne sont pas requis OU si l'utilisateur a déjà validé un code → basculer en mode `signup` comme aujourd'hui.
     - Sinon → ouvrir directement le pop-up de saisie du code (`openInviteGate()`) sans changer de mode. La création de compte ne sera débloquée qu'après validation du code.

2. **Sécuriser aussi l'écran de choix au cas où**
   - Vérifier que le bouton "S'inscrire" / "Créer un compte" sur l'écran de choix passe bien par la même garde (`!inviteRequired || hasValidatedCode`). Si ce n'est pas le cas, appliquer la même logique.

3. **Filet de sécurité dans le formulaire d'inscription**
   - Dans `SignupForm`, si on arrive en mode `signup` alors que `inviteRequired && !hasValidatedCode` (ne devrait plus arriver après la correction ci-dessus, mais par sécurité) :
     - Afficher un état "Code requis" avec un bouton qui rouvre le pop-up.
     - Empêcher la soumission de l'étape 4 tant que le code n'est pas validé (la validation `validate_invite_code` côté `handleSignup` reste en place comme dernière barrière serveur).

4. **Pas de régression côté UX**
   - Le pop-up reste un `Dialog` in-page (pas de redirection vers `/`).
   - Une fois le code validé, on bascule automatiquement en mode `signup` pour que l'utilisateur enchaîne sans friction.
   - Le code reste **à usage unique** grâce à `claim_invite_code` déjà appelé dans le pop-up.

## Fichiers modifiés

- `src/pages/Auth.tsx` (logique du bouton "S'inscrire" depuis Connexion + filet de sécurité signup)

Aucun changement base de données n'est nécessaire : la fonction `claim_invite_code` et la table `invite_codes` font déjà respecter l'unicité d'utilisation.