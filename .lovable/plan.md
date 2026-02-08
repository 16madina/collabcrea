
## Plan de correction des Safe Areas iOS

### Probleme identifie
L'application Capacitor iOS ne respecte pas les safe areas (zones securisees) sur les iPhones avec encoche (notch). Le logo et les boutons sont affiches derriere la barre d'etat du telephone, ce qui rend le contenu illisible.

### Cause technique
1. Le fichier `index.html` manque la balise meta `viewport-fit=cover` necessaire pour Capacitor iOS
2. Plusieurs pages n'utilisent pas correctement les classes `safe-top` ou le padding `pt-[max(env(safe-area-inset-top),1rem)]`
3. Les headers de banniere (profils createur/marque) utilisent `pt-[env(safe-area-inset-top)]` mais cela doit etre applique au contenu interactif (boutons), pas seulement a la hauteur

### Pages a corriger

| Page | Probleme | Correction |
|------|----------|------------|
| `index.html` | Manque `viewport-fit=cover` | Ajouter dans la balise meta viewport |
| `Landing.tsx` | Header utilise `pt-[max(env(safe-area-inset-top),0.5rem)]` - insuffisant | Augmenter a `pt-[max(env(safe-area-inset-top),1rem)]` |
| `Auth.tsx` | Header sans safe area (`px-6 pt-2 pb-2`) | Ajouter `pt-[max(env(safe-area-inset-top),0.75rem)]` |
| `ForgotPassword.tsx` | Header sans safe area | Ajouter padding safe area |
| `ResetPassword.tsx` | Meme probleme sur 3 variants d'ecran | Corriger tous les headers |
| `TermsOfService.tsx` | Aucun safe area | Ajouter `safe-top` au container |
| `PrivacyPolicy.tsx` | Aucun safe area | Ajouter `safe-top` au container |
| `NotFound.tsx` | Aucun safe area | Ajouter `safe-top` |
| `BrandProfileHeader.tsx` | Boutons a `top-4` - trop haut | Utiliser `top-[calc(env(safe-area-inset-top)+1rem)]` |
| `ProfileHeader.tsx` (createur) | Meme probleme | Corriger positions boutons |

### Modifications techniques detaillees

#### 1. index.html
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

#### 2. Composants ProfileHeader (createur et marque)
Les boutons (admin, notification, camera, settings) sont positionnes avec `absolute top-4` qui ne tient pas compte du safe area. Il faut:
- Utiliser `top-[calc(env(safe-area-inset-top)+1rem)]` pour tous les boutons dans la banniere

#### 3. Pages Auth/ForgotPassword/ResetPassword
Ajouter `pt-[max(env(safe-area-inset-top),0.75rem)]` aux headers

#### 4. Pages statiques (Terms, Privacy, NotFound)
Ajouter `pt-[max(env(safe-area-inset-top),3rem)]` au premier container

### Verification apres implementation
1. Recompiler: `npm run build && npx cap sync ios`
2. Lancer sur simulateur ou appareil iOS
3. Verifier que le logo et les boutons sont bien sous la barre d'etat sur toutes les pages

### Fichiers a modifier
- `index.html`
- `src/pages/Landing.tsx`
- `src/pages/Auth.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/TermsOfService.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/NotFound.tsx`
- `src/components/creator/ProfileHeader.tsx`
- `src/components/brand/BrandProfileHeader.tsx`
