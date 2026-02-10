

## Remplacer les emojis drapeaux par des images flagcdn.com

### Probleme
Les emojis drapeaux (ex: `🇬🇭`, `🇸🇳`) s'affichent comme des codes texte ("GH", "SN", "CA-CI") sur Windows et certains navigateurs. La capture d'ecran le confirme clairement.

### Solution
Utiliser des images de `flagcdn.com` (deja utilise dans le selecteur de pays) au lieu des emojis texte.

### Etapes

**1. Ajouter un mapping pays vers code ISO dans les donnees**

Creer un utilitaire `src/lib/flags.ts` avec :
- Un mapping des noms de pays francais vers les codes ISO 2 lettres (ex: "Ghana" -> "gh", "Senegal" -> "sn", "Cote d'Ivoire" -> "ci")
- Un composant `CountryFlag` reutilisable qui affiche `<img src="https://flagcdn.com/w40/{code}.png" />`
- Une fonction `getCountryCode(countryName)` pour convertir le nom en code

**2. Mettre a jour `CreatorCard.tsx`**

Remplacer les `<span>` qui affichent `{creator.flag}` et `{creator.residenceFlag}` par le composant `CountryFlag` utilisant le nom du pays pour determiner le drapeau image.

**3. Mettre a jour `CreatorDetailSheet.tsx`**

Meme remplacement pour les drapeaux affiches dans la fiche detail du createur.

**4. Mettre a jour `useCreators.ts`**

La fonction `getFlag()` qui retourne des emojis sera adaptee pour retourner des codes ISO au lieu d'emojis, ou bien le composant `CountryFlag` utilisera directement le champ `country` pour resoudre le drapeau.

**5. Donnees mock (`creators.ts`)**

Le champ `flag` emoji existant ne sera plus utilise pour le rendu visuel — le composant utilisera le champ `country` pour chercher le bon code ISO et afficher l'image correspondante.

### Details techniques

Le composant `CountryFlag` :
```text
Props: country (string), size (number, default 20)
Rendu: <img src="https://flagcdn.com/w40/{isoCode}.png" width={size} />
Fallback: icone globe si pays inconnu
```

Mapping couvrant les 54 pays africains + pays de residence (France, Belgique, Canada, etc.) deja presents dans `useCreators.ts`.

Les modifications touchent :
- `src/lib/flags.ts` (nouveau fichier)
- `src/components/CreatorCard.tsx`
- `src/components/CreatorDetailSheet.tsx`
- `src/hooks/useCreators.ts` (optionnel, nettoyage)

