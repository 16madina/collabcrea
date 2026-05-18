## Plan de correction

1. Corriger la source de vérité de l’accès privé
   - Garder `app_settings.invite_codes_required` comme source principale.
   - Supprimer l’effet de cache persistant qui peut masquer un changement admin après déconnexion/reconnexion.
   - Forcer chaque écran sensible à relire l’état serveur au montage, puis écouter les changements en temps réel.

2. Synchroniser `InviteGate` et la page d’authentification
   - Quand l’accès privé est réactivé, invalider localement l’ancien déverrouillage `invite_gate_code` pour les visiteurs non connectés.
   - Éviter qu’un ancien code stocké dans `localStorage` donne encore accès après que l’admin a changé le mode.
   - Faire en sorte que `/auth` respecte immédiatement l’état activé/désactivé pour afficher ou cacher “Créer un compte”.

3. Rendre le toggle admin plus robuste
   - Après activation/désactivation, écrire la valeur en base puis émettre un événement local pour rafraîchir l’interface courante.
   - Recharger la valeur réelle après sauvegarde pour éviter que le switch affiche un état optimiste incorrect.

4. Tests à effectuer
   - Vérifier en base que `invite_codes_required = true` est bien actif.
   - Tester le scénario: activer dans admin, se déconnecter, revenir sur `/auth`, vérifier que la création de compte demande un code.
   - Tester l’inverse: désactiver dans admin, se déconnecter, revenir sur `/auth`, vérifier que le code n’est plus demandé.
   - Tester le changement dans le même navigateur avec ancien `localStorage` pour confirmer qu’il ne bloque plus l’état réel.

## Détail technique

Le bug vient probablement du fait que `invite_gate_code` reste en `localStorage` après une ancienne validation. Quand le système est réactivé, la page `/auth` considère encore ce stockage local comme “code déjà validé”, donc elle ne redemande pas le code. La correction va séparer clairement:

- le réglage global: lu depuis `app_settings.invite_codes_required`;
- le code local temporaire: valable seulement pour continuer une inscription, pas comme permission permanente après réactivation admin.