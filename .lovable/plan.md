

## Diagnostic

Le probleme principal est double :

1. **Conflit de z-index** : Le chat est dans un conteneur `fixed inset-0 z-[60]`. Le `CreatorDetailSheet` utilise le `z-50` par defaut du composant Sheet, donc il s'ouvre DERRIERE le chat -- invisible pour l'utilisateur.

2. **Pas de page profil publique** : Il n'existe aucune route `/profile/:userId` dans l'application. Le bouton tente d'ouvrir un Sheet qui est cache par le chat.

## Solution : Navigation vers une page profil dediee

### 1. Creer une page `ProfileView` (`src/pages/ProfileView.tsx`)
- Route : `/profile/:userId`
- Recupere le profil complet + role depuis la base de donnees
- Affiche les memes informations que `CreatorDetailSheet` (banner, avatar, bio, reseaux sociaux, portfolio, tarifs) mais en pleine page
- Bouton retour pour revenir a la conversation
- Si c'est un createur : afficher portfolio + tarifs + reseaux sociaux
- Si c'est une marque : afficher description, secteur, site web

### 2. Ajouter la route dans `App.tsx`
- Ajouter `<Route path="/profile/:userId" element={<ProfileView />} />`

### 3. Modifier `handleViewFullProfile` dans les 2 fichiers de messagerie
- **`src/components/collabs/MessagesTab.tsx`** (cote marque)
- **`src/pages/creator/Messages.tsx`** (cote createur)
- Remplacer la logique qui ouvre un `CreatorDetailSheet` par un simple `navigate(/profile/${userId})`
- Supprimer les etats `fullProfileCreator` et `showFullProfile` devenus inutiles
- Supprimer l'import et le rendu du `CreatorDetailSheet`

### 4. Modifier `ChatProfileSheet.tsx`
- Le callback `onViewFullProfile` declenchera desormais la navigation directement

### Fichiers modifies
- `src/pages/ProfileView.tsx` (nouveau)
- `src/App.tsx` (ajout route)
- `src/components/collabs/MessagesTab.tsx` (simplification)
- `src/pages/creator/Messages.tsx` (simplification)

