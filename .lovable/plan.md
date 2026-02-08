
# Plan : Unifier la Navigation de l'Application

## Problème Identifié
L'application utilise deux barres de navigation distinctes :
- `LandingNav.tsx` : pages publiques (onglets "Messages, Connexion")
- `BottomNav.tsx` : pages authentifiées (onglets "Collabs, Profil")

Cela crée une confusion où l'utilisateur a l'impression d'utiliser deux applications différentes.

## Solution Proposée
Unifier la navigation en utilisant un **seul composant intelligent** qui adapte ses onglets selon le contexte (connecté ou non).

## Architecture Technique

### 1. Supprimer LandingNav et utiliser uniquement BottomNav
Le composant `BottomNav` sera modifié pour gérer trois états :
- **Non connecté** : "Accueil, Explorer, Offres, Messages, Connexion"
- **Connecté (Créateur)** : "Accueil, Explorer, Offres, Collabs, Profil"
- **Connecté (Marque)** : "Accueil, Créateurs, Offres, Collabs, Profil"

### 2. Modifications de fichiers

**Fichier : `src/components/BottomNav.tsx`**
- Ajouter la détection de l'état d'authentification via `useAuth()`
- Rendre le prop `userRole` optionnel
- Créer trois configurations de navigation :
  - `guestNavItems` : pour visiteurs non connectés
  - `creatorNavItems` : pour créateurs connectés
  - `brandNavItems` : pour marques connectées
- Conserver le badge des messages non lus sur "Collabs" pour les utilisateurs connectés

**Fichier : `src/pages/Landing.tsx`**
- Remplacer `<LandingNav />` par `<BottomNav />` sans props (mode invité)

**Fichier : `src/pages/Explore.tsx`**
- Remplacer `<LandingNav />` par `<BottomNav />` sans props (mode invité)

**Fichier : `src/components/LandingNav.tsx`**
- Supprimer ce fichier (obsolète)

### 3. Logique de sélection des onglets

```text
┌─────────────────────────────────────────────────────────────┐
│                    BottomNav                                │
├─────────────────────────────────────────────────────────────┤
│  useAuth() → user, role                                     │
│                                                             │
│  if (!user) → guestNavItems                                 │
│    [Accueil, Explorer, Offres, Messages, Connexion]         │
│                                                             │
│  if (role === "creator") → creatorNavItems                  │
│    [Accueil, Explorer, Offres, Collabs*, Profil]            │
│                                                             │
│  if (role === "brand") → brandNavItems                      │
│    [Accueil, Créateurs, Offres, Collabs*, Profil]           │
│                                                             │
│  * = avec badge messages non lus                            │
└─────────────────────────────────────────────────────────────┘
```

### 4. Cohérence des icônes et libellés

| Position | Invité | Créateur | Marque |
|----------|--------|----------|--------|
| 1 | Accueil (Home) | Accueil (Home) | Accueil (Home) |
| 2 | Explorer (Search) | Explorer (Search) | Créateurs (Search) |
| 3 | Offres (Briefcase) | Offres (Briefcase) | Offres (Megaphone) |
| 4 | Messages (MessageCircle) | Collabs (Handshake) | Collabs (Handshake) |
| 5 | Connexion (User) | Profil (User) | Profil (User) |

### 5. Gestion des routes

Pour les utilisateurs non connectés qui cliquent sur "Messages" :
- Rediriger vers `/auth` avec un message invitant à se connecter

Pour les utilisateurs connectés :
- Les routes adaptées automatiquement selon le rôle (`/creator/*` ou `/brand/*`)

## Résultat Attendu
- Une seule barre de navigation cohérente sur toutes les pages
- Transition fluide entre les états connecté/déconnecté
- Plus de confusion pour l'utilisateur
- Les onglets 1 (Accueil) et 5 (Connexion/Profil) restent constants visuellement
