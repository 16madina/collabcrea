# Fiabiliser les paiements Mobile Money

## Diagnostic confirmé

- Le parcours Wave Côte d’Ivoire doit utiliser uniquement la page de paiement hébergée : création d’une transaction, génération d’un lien unique, puis ouverture de ce lien. L’appel direct n’est officiellement disponible que pour MTN Bénin/Côte d’Ivoire et Moov Bénin/Togo.
- La transaction du dernier essai est toujours `pending` côté API, même si la page affiche un échec. Le paiement n’a donc pas été validé par Wave.
- L’application vérifie actuellement le statut toutes les 6 secondes, mais aucun webhook FedaPay n’est installé. Un webhook ne corrigera pas un refus Wave, mais il est indispensable pour confirmer automatiquement un paiement lorsque l’utilisateur ferme la page ou l’application.

## Modifications

1. Ajouter un endpoint webhook public dédié aux événements FedaPay.
   - Accepter uniquement les événements de transaction utiles.
   - Ne jamais faire confiance au contenu reçu : récupérer la transaction directement auprès de FedaPay avec son identifiant.
   - Vérifier le montant, la devise, la marque, la collaboration et les métadonnées avant toute modification.
   - Traiter plusieurs fois le même événement sans créditer ni avancer deux fois la collaboration.

2. Centraliser la finalisation du paiement.
   - Utiliser la même logique sûre depuis le webhook et depuis le bouton « J’ai payé, vérifier ».
   - Enregistrer la transaction de séquestre une seule fois.
   - Faire avancer la collaboration et envoyer la notification seulement après un statut officiel `approved` ou `transferred`.

3. Renforcer le démarrage du paiement Wave.
   - Conserver exclusivement le checkout hébergé pour Wave et Orange.
   - Valider strictement le numéro ivoirien à 10 chiffres et éviter tout indicatif dupliqué.
   - Créer un lien neuf à chaque tentative et conserver l’identifiant de la tentative côté application.
   - Afficher clairement les statuts `pending`, `declined`, `canceled` et `expired` au lieu d’un message générique.

4. Tester et déployer.
   - Tester les requêtes non autorisées, événements invalides, doublons et paiements approuvés.
   - Déployer les fonctions concernées et vérifier les journaux.

## Configuration finale dans FedaPay

Après déploiement, l’URL du webhook sera fournie pour l’ajouter dans le compte FedaPay avec les événements `transaction.approved`, `transaction.transferred`, `transaction.declined` et `transaction.canceled`.
