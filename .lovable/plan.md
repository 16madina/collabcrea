
# Plan de correction : Probleme de connexion

## Diagnostic

Lors de la connexion, une erreur 406 (PGRST116) se produit car le compte possede deux roles dans la base de donnees (creator et admin). Le code utilise `.single()` pour recuperer le role, ce qui echoue quand plusieurs lignes sont retournees.

## Solution

Modifier la logique de recuperation du role pour gerer le cas ou un utilisateur a plusieurs roles, en priorisant le role principal (creator ou brand) tout en conservant le role admin separement.

## Modifications a apporter

### Fichier 1 : src/hooks/useAuth.tsx

**Changement** : Remplacer `.single()` par `.limit(1)` et ajouter une logique de priorite pour les roles multiples.

```typescript
// Avant (ligne 52-56)
supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", userId)
  .single()

// Apres
supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", userId)
```

Ensuite, adapter le traitement du resultat pour :
1. Recuperer tous les roles de l'utilisateur
2. Prioriser "creator" ou "brand" comme role principal (pour la redirection)
3. Ignorer "admin" pour la redirection (admin est un role supplementaire)

### Details techniques

```text
Flux de recuperation du role
+----------------------------------+
| 1. Fetch tous les roles         |
| 2. Filtrer roles principaux     |
|    (creator ou brand)           |
| 3. Si trouve -> setRole()       |
| 4. Redirection vers profil      |
+----------------------------------+

Logique de priorite :
- Si l'utilisateur a "creator" -> rediriger vers /creator/profile
- Si l'utilisateur a "brand" -> rediriger vers /brand/profile
- "admin" ne compte pas pour la redirection
```

### Impact

| Avant | Apres |
|-------|-------|
| Echec si plusieurs roles | Fonctionne avec plusieurs roles |
| Pas de redirection | Redirection vers le bon profil |
| Role reste null | Role principal correctement detecte |

## Benefices

- Les utilisateurs avec un role admin supplementaire pourront se connecter
- La redirection apres connexion fonctionnera correctement
- Le systeme reste compatible avec les utilisateurs ayant un seul role
