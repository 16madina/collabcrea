

# Plan : Corriger la redirection des emails de vérification vers collabcrea.com

## Problème identifié

Le lien de vérification dans l'email est généré par Supabase avec le format :
```
https://[projet-supabase].supabase.co/auth/v1/verify?token=xxx&redirect_to=https://collabcrea.com/...
```

Supabase utilise une **URL de site configurée** dans ses paramètres pour déterminer vers où rediriger l'utilisateur après la vérification. Cette URL doit être `https://collabcrea.com`.

## Solution

### Étape 1 : Configurer l'URL du site dans Lovable Cloud

Je dois mettre à jour les paramètres d'authentification pour définir `collabcrea.com` comme URL de site principale.

### Étape 2 : Ajouter collabcrea.com aux URLs de redirection autorisées

Pour que Supabase accepte la redirection vers ton domaine, il doit être dans la liste des URLs autorisées.

## Détails techniques

La configuration se fait via l'outil `configure-auth` avec :
- **Site URL** : `https://collabcrea.com` (URL principale de redirection après vérification)
- **Redirect URLs** : Ajouter `https://collabcrea.com/**` pour autoriser toutes les pages du site

Cette configuration est nécessaire car Supabase valide que l'URL de redirection fait partie des domaines autorisés avant d'y rediriger l'utilisateur.

