# Audit Moyo — P1 (retraits Wallet + survente billetterie)

## Corrigé

- Retrait Wallet : réservation atomique du solde avec `SELECT ... FOR UPDATE`.
- Retrait Wallet : idempotence via `Idempotency-Key` + colonne `transactions.idempotency_key`.
- Retrait Wallet : transaction locale `PENDING`, débit avant l'appel externe, remboursement atomique en cas d'échec.
- Billetterie : achat protégé par verrou de ligne `events ... FOR UPDATE`, donc deux acheteurs concurrents ne peuvent pas dépasser `total_capacity`.
- Billetterie : idempotence d'achat via `tickets.purchase_idempotency_key`.
- Scan billet : validation atomique `UPDATE ... WHERE status='VALID'`, empêchant deux scans concurrents d'autoriser deux entrées.
- API KibangouPay : les erreurs réseau/HTTP ne sont plus transformées silencieusement en faux succès. Le mock exige désormais `KIBANGOUPAY_MOCK_MODE=true`.
- La clé API KibangouPay codée en dur a été retirée du code source ; elle doit être fournie par variable d'environnement.

## Point à vérifier avant production

- Le contrat exact de l'API/webhook KibangouPay reste à valider avec sa documentation réelle. Le code ne considère plus une erreur de passerelle comme un paiement réussi.
- Un retrait laissé en `PENDING` après une panne du serveur entre la réservation et l'appel externe doit être réconcilié par un mécanisme de reprise/consultation du statut du fournisseur.
- L'achat de billet actuel crée encore le billet directement ; le paiement réel doit être relié au flux billetterie avant de présenter l'achat comme payé.
