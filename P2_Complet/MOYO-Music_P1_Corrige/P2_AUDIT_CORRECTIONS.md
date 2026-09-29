# MOYO Music — P2 : paiements, réconciliation, billetterie et sécurité

## Réalisé

### Paiements
- Les paiements sont persistés localement en `PENDING` avant l'appel prestataire.
- Les réponses `UNKNOWN` (timeout, réseau, HTTP 5xx) ne sont plus transformées en échec automatique.
- Réconciliation périodique via `reconcilePendingTransactions()` avec verrou PostgreSQL advisory.
- Nouvelle tentative fournisseur avec la même `Idempotency-Key` lorsqu'aucune référence externe exploitable n'est disponible.
- Vérification du montant lors de la confirmation.
- Webhook HMAC + anti-rejeu (`payment_webhook_events`).
- Une transaction `SUCCESS` ou `FAILED` est idempotente et ne peut pas créditer/rembourser deux fois.

### Wallet / retraits
- Les fonds restent réservés tant que le prestataire n'a pas confirmé l'état final.
- Les retraits `UNKNOWN` restent `PENDING`.
- Les retraits échoués libèrent les fonds une seule fois.
- Endpoint admin `/api/payments/reconcile` pour forcer une réconciliation.

### Billetterie
- Une place passe d'abord en `PENDING_PAYMENT`.
- `tickets_reserved` protège la capacité pendant le paiement.
- `tickets_sold` n'augmente qu'après confirmation du paiement.
- Aucun QR billet actif n'est remis avant `SUCCESS`.
- Paiement confirmé -> ticket `VALID`.
- Paiement refusé -> ticket `CANCELLED` et réservation libérée.
- Endpoint public `/api/ticketing/purchase-status` pour suivre une commande avec clé d'idempotence + téléphone.
- Le frontend attend la confirmation réelle avant d'afficher le QR.

### Sécurité
- CORS configurable via `CORS_ORIGINS`.
- En-têtes HTTP de sécurité de base.
- Limitation de débit sur login, inscription, achat de billet, retrait et initiation de paiement.
- `JWT_SECRET` obligatoire et suffisamment long en production.
- Permission navigateur `camera=(self)` conservée pour le scanner QR.
- Bootstrap `.env` chargé avant les modules qui lisent les secrets.

## Validation
- `backend npm run build` : OK.
- `frontend npx tsc --noEmit` : OK.
- `frontend npm run build` : bloqué dans l'environnement de travail par le binaire SWC Linux manquant et non téléchargeable ici.

## À valider sur staging
- Contrat réel KibangouPay (nom d'en-tête de signature, payload exact, endpoint de statut).
- Tests avec PostgreSQL réel : concurrence retraits, achats simultanés et scans simultanés.
- Test webhook signé avec montant correct/incorrect et rejouabilité.
- Test d'un timeout réseau puis réconciliation réussie.
