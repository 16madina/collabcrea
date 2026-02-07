# Guide de déploiement Android avec Capacitor

## Prérequis

- Node.js 18+ installé
- Android Studio installé avec un émulateur ou appareil physique
- Compte GitHub connecté à Lovable

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

### 3. Ajouter la plateforme Android

```bash
npx cap add android
```

### 4. Configurer Firebase pour les notifications push

1. Déplace le fichier `google-services.json` vers `android/app/`:
```bash
mv google-services.json android/app/
```

2. Modifie `android/app/build.gradle` et ajoute en haut du fichier:
```gradle
apply plugin: 'com.google.gms.google-services'
```

3. Modifie `android/build.gradle` (le fichier racine) et ajoute dans `dependencies`:
```gradle
classpath 'com.google.gms:google-services:4.4.0'
```

### 5. Build et synchronisation

```bash
npm run build
npx cap sync android
```

### 6. Lancer l'application

**Sur émulateur:**
```bash
npx cap run android
```

**Ouvrir dans Android Studio:**
```bash
npx cap open android
```

## Configuration des icônes

Remplace les icônes par défaut dans:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

## Envoyer des notifications push

Pour envoyer des notifications depuis le serveur, utilise l'API Firebase Cloud Messaging (FCM) avec le token récupéré par l'app.

### Exemple d'envoi via Edge Function:

```typescript
// supabase/functions/send-push/index.ts
const fcmToken = "TOKEN_DU_DEVICE";
const message = {
  to: fcmToken,
  notification: {
    title: "CollabCrea",
    body: "Nouvelle opportunité disponible!"
  },
  data: {
    route: "/creator/offers"
  }
};

await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Authorization': `key=VOTRE_SERVER_KEY`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(message)
});
```

## Hot Reload (développement)

La configuration actuelle pointe vers la preview Lovable pour le hot reload.
Pour la production, modifie `capacitor.config.ts` et retire la section `server`.

## Troubleshooting

### L'app ne se lance pas
- Vérifie que Android Studio est bien installé avec les SDK Android
- Lance `npx cap doctor` pour diagnostiquer les problèmes

### Notifications non reçues
- Vérifie que `google-services.json` est dans `android/app/`
- Vérifie les permissions dans les paramètres de l'appareil
