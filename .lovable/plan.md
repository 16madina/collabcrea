

# Plan de correction : Déconnexion intempestive

## Problemes identifies

### 1. Rate limit sur le rafraichissement de token
Le code actuel declenche plusieurs appels `supabase.auth.refreshSession()` en parallele :
- Dans `useAuth.tsx` : `onAuthStateChange` + `getSession()`
- Dans `Profile.tsx` : `checkEmailVerification()` appelle aussi `refreshSession()`

Cela cause une erreur 429 (rate limit) qui revoque les tokens et deconnecte l'utilisateur.

### 2. Pas de redirection explicite apres login
Dans `Auth.tsx`, apres un login reussi (ligne 315), le code affiche seulement un toast mais ne redirige pas. La redirection automatique (lignes 96-100) depend du `userRole` qui n'est pas encore charge.

## Solution proposee

### Etape 1 : Supprimer le refreshSession() redondant dans Profile.tsx
- Retirer l'appel `supabase.auth.refreshSession()` dans `checkEmailVerification()`
- Utiliser directement les donnees du `user` de `useAuth` qui sont deja a jour

### Etape 2 : Ajouter une redirection explicite apres login dans Auth.tsx
- Apres un login reussi, attendre que le role soit charge
- Rediriger vers `/creator/profile` ou `/brand/profile` selon le role

### Etape 3 : Eviter les appels paralleles dans useAuth.tsx
- Ajouter un flag pour eviter les appels multiples a `fetchUserData`
- S'assurer que `loading` reste `true` jusqu'a ce que le role soit charge

## Fichiers a modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/creator/Profile.tsx` | Supprimer `refreshSession()` dans `checkEmailVerification` |
| `src/pages/Auth.tsx` | Ajouter redirection explicite apres login avec attente du role |
| `src/hooks/useAuth.tsx` | Ajouter flag anti-doublon et attendre le role avant de mettre loading=false |

## Details techniques

```text
Auth.tsx - handleLogin()
+----------------------------------+
| 1. signIn() reussi               |
| 2. Attendre fetchUserData()      |
| 3. Rediriger vers profil         |
+----------------------------------+

useAuth.tsx - fetchUserData()
+----------------------------------+
| 1. Check si deja en cours        |
| 2. Fetch profile + role          |
| 3. loading = false seulement     |
|    apres role charge             |
+----------------------------------+
```

