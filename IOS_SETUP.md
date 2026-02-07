# Guide de déploiement iOS avec Capacitor

## Prérequis

- **Mac avec macOS** (obligatoire pour iOS)
- **Xcode 15+** installé depuis l'App Store
- **Compte Apple Developer** (99$/an pour publier sur l'App Store)
- Node.js 18+ installé
- CocoaPods installé (`sudo gem install cocoapods`)

## Étapes de configuration

### 1. Exporter le projet sur GitHub

1. Dans Lovable, va dans **Settings → GitHub → Connect project**
2. Autorise l'application GitHub Lovable
3. Clique sur **Create Repository**

### 2. Cloner et installer le projet en local

```bash
git clone https://github.com/TON_USERNAME/collabcrea.git
cd collabcrea
npm install
```

### 3. Ajouter la plateforme iOS

```bash
npx cap add ios
```

### 4. Build et synchronisation

```bash
npm run build
npx cap sync ios
```

### 5. Ouvrir dans Xcode

```bash
npx cap open ios
```

## Configuration des notifications push iOS

### Étape 1: Activer les Push Notifications dans Xcode

1. Ouvre le projet dans Xcode
2. Sélectionne la target **App**
3. Va dans **Signing & Capabilities**
4. Clique sur **+ Capability** → **Push Notifications**
5. Ajoute aussi **Background Modes** → coche **Remote notifications**

### Étape 2: Créer une clé APNs

1. Va sur [Apple Developer Portal](https://developer.apple.com)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Clique **+** pour créer une nouvelle clé
4. Coche **Apple Push Notifications service (APNs)**
5. Télécharge la clé `.p8` (garde-la précieusement!)
6. Note le **Key ID** et ton **Team ID**

### Étape 3: Configurer Firebase pour iOS

1. Dans la [console Firebase](https://console.firebase.google.com)
2. Va dans **Project Settings** → **Cloud Messaging**
3. Dans la section **Apple app configuration**
4. Upload ta clé APNs (.p8)
5. Entre le **Key ID** et **Team ID**

### Étape 4: Ajouter GoogleService-Info.plist

1. Télécharge `GoogleService-Info.plist` depuis Firebase Console
2. Copie-le dans `ios/App/App/`
3. Dans Xcode, fais un clic droit sur le dossier **App** → **Add Files to "App"**
4. Sélectionne `GoogleService-Info.plist`

### Étape 5: Configurer le Podfile

Modifie `ios/App/Podfile` et ajoute:

```ruby
target 'App' do
  capacitor_pods
  # Add your Pods here
  pod 'Firebase/Messaging'
end
```

Puis exécute:
```bash
cd ios/App
pod install
cd ../..
```

## Lancer l'application

### Sur simulateur:
```bash
npx cap run ios
```

### Sur appareil physique:
1. Connecte ton iPhone via USB
2. Dans Xcode, sélectionne ton appareil
3. Clique **Run** (⌘R)

> ⚠️ Les notifications push ne fonctionnent PAS sur le simulateur. Utilise un vrai appareil pour tester.

## Configuration des icônes et splash screen

### App Icon
1. Dans Xcode, ouvre `ios/App/App/Assets.xcassets`
2. Clique sur **AppIcon**
3. Glisse tes icônes aux différentes tailles requises

### Splash Screen
1. Ouvre `ios/App/App/Assets.xcassets`
2. Modifie **Splash** avec ton image

## Publier sur l'App Store

### 1. Créer un App Store Connect record
1. Va sur [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps** → **+** → **New App**
3. Remplis les informations de l'app

### 2. Archiver l'app
1. Dans Xcode: **Product** → **Archive**
2. Une fois archivé, clique **Distribute App**
3. Choisis **App Store Connect**
4. Suis les étapes de validation

### 3. Soumettre pour review
1. Dans App Store Connect, complète les métadonnées
2. Ajoute les screenshots
3. Soumets pour review Apple (1-3 jours)

## Troubleshooting

### Erreur de signature
- Vérifie que tu es connecté avec ton Apple ID dans Xcode
- Sélectionne ton Team dans **Signing & Capabilities**

### Pod install échoue
```bash
cd ios/App
pod repo update
pod install
```

### Notifications non reçues
- Vérifie que tu utilises un appareil physique (pas simulateur)
- Vérifie les capabilities Push Notifications dans Xcode
- Vérifie la configuration APNs dans Firebase

## Hot Reload (développement)

La configuration actuelle pointe vers la preview Lovable.
Pour la production, modifie `capacitor.config.ts` et retire la section `server`:

```typescript
const config: CapacitorConfig = {
  appId: 'app.lovable.10ffe8ef2a674f9bbb4a3a8eec126aa0',
  appName: 'collabcrea',
  webDir: 'dist',
  // Retire "server" pour la production
};
```
