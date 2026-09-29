# MOYO Music — correctifs P1

## Correctifs appliqués

### Wallet / retraits
- Réservation atomique du solde avec verrou PostgreSQL (`FOR UPDATE`).
- Idempotence avec `Idempotency-Key` et `transactions.idempotency_key`.
- État local `PENDING` avant l'appel au prestataire.
- Remboursement atomique si KibangouPay refuse ou échoue.
- Webhook capable de confirmer un retrait et de recréditer le solde en cas d'échec.

### Billetterie
- Verrouillage de la ligne `events` lors d'un achat.
- Impossible de dépasser `total_capacity` sous concurrence.
- Idempotence avec `tickets.purchase_idempotency_key`.
- Scan de billet atomique : un seul scan concurrent peut consommer un billet `VALID`.

### Paiements
- Les erreurs KibangouPay ne sont plus transformées en faux succès.
- Le mode simulé exige explicitement `KIBANGOUPAY_MOCK_MODE=true`.
- La clé API codée en dur a été retirée du code.
- `/api/payments/initiate` utilise désormais l'utilisateur issu du JWT.
- Signature HMAC du webhook via `x-kibangoupay-signature` et `KIBANGOUPAY_WEBHOOK_SECRET`.

## Validation
- `backend`: `npm run build` ✅
- `frontend`: `npx tsc --noEmit` ✅
- `frontend npm run build`: non exécuté jusqu'au bout dans l'environnement de travail, car Next.js a tenté de télécharger son binaire SWC depuis `registry.npmjs.org`, réseau indisponible.

## Déploiement
1. Copier le projet sur la machine de déploiement.
2. Dans `backend`, définir au minimum `DATABASE_URL`, `JWT_SECRET`, `KIBANGOUPAY_BASE_URL`, `KIBANGOUPAY_PROJECT_ID`, `KIBANGOUPAY_API_KEY`, `KIBANGOUPAY_WEBHOOK_SECRET`.
3. Laisser `KIBANGOUPAY_MOCK_MODE=false` en production.
4. Exécuter `npm install` puis `npm run build` dans `backend`.
5. Exécuter `npm install` puis `npm run build` dans `frontend` sur une machine ayant accès au registre npm / le package SWC adéquat.
