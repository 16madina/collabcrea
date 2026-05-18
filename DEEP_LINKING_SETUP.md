# Deep Linking — CollabCréa

Scheme: `collabcrea://`  •  Universal/App Links: `https://collabcrea.com/ouvrir` et `/open`

## Android — ✅ Déjà configuré

`android/app/src/main/AndroidManifest.xml` contient deux `intent-filter` :
- `collabcrea://...` (custom scheme)
- `https://collabcrea.com/ouvrir|/open` (App Links vérifiés)

`android/app/src/main/res/values/strings.xml` : `custom_url_scheme` = `collabcrea`.

Après `git pull` en local :
```bash
npm install && npm run build && npx cap sync android
```

### Vérification App Links (HTTPS)
1. Récupère le SHA‑256 de ta clé de signature (Play Console → Setup → App signing).
2. Remplace `REPLACE_WITH_SHA256_FROM_PLAY_CONSOLE` dans `public/.well-known/assetlinks.json`.
3. Redéploie le site. Le fichier doit être servi en `https://collabcrea.com/.well-known/assetlinks.json` (Content-Type `application/json`).

## iOS — À faire en local (le dossier `ios/` n'est pas dans le repo)

### 1. Custom URL scheme `collabcrea://`
Dans `ios/App/App/Info.plist`, ajouter :
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.collabcrea.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>collabcrea</string>
    </array>
  </dict>
</array>
```

### 2. Universal Links (recommandé)
Dans Xcode → target App → **Signing & Capabilities** → **+ Capability** → **Associated Domains**.
Ajoute : `applinks:collabcrea.com`

Puis remplace `TEAMID` dans `public/.well-known/apple-app-site-association` par ton Team ID Apple (10 caractères).  
Le fichier doit être servi en `https://collabcrea.com/.well-known/apple-app-site-association`
- sans extension, en `Content-Type: application/json`
- sans redirection.

### 3. Sync
```bash
npm run build && npx cap sync ios && npx cap open ios
```

## Test rapide
- Tape dans Safari/Chrome mobile : `collabcrea://creator/profile` → l'app doit s'ouvrir.
- Tape `https://collabcrea.com/ouvrir?to=/creator/profile` :
  - App installée + Universal/App Links OK → l'app s'ouvre directement.
  - Sinon → la page `/ouvrir` propose les boutons (Ouvrir l'app / Télécharger / Web).
