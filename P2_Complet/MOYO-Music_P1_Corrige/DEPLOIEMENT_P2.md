# Déploiement MOYO Music — P2

## 1. Backend

```bash
cd backend
npm ci
npm run build
npm start
```

Variables minimales en production :

```env
NODE_ENV=production
DATABASE_URL=postgres://...
JWT_SECRET=<au moins 32 caractères aléatoires>
CORS_ORIGINS=https://votre-frontend.example
KIBANGOUPAY_BASE_URL=https://...
KIBANGOUPAY_PROJECT_ID=...
KIBANGOUPAY_API_KEY=...
KIBANGOUPAY_WEBHOOK_SECRET=...
KIBANGOUPAY_MOCK_MODE=false
PAYMENT_RECONCILIATION_INTERVAL_MS=60000
```

`initializeDatabase()` applique automatiquement les colonnes et tables P2. Une migration SQL de référence est disponible dans `backend/src/database/p2_payment_migration.sql`.

## 2. Frontend

```bash
cd frontend
npm ci
npm run build
npm start
```

Définir :

```env
NEXT_PUBLIC_API_URL=https://votre-api.example/api
```

## 3. Vérifications à faire sur staging

- 2 retraits simultanés avec un solde insuffisant pour les deux combinés.
- 20 achats simultanés sur un événement de capacité 10.
- 2 scans simultanés du même QR.
- Paiement ticket `PENDING` puis webhook `SUCCESS` signé.
- Webhook dupliqué : aucune deuxième émission ni aucun double crédit.
- Webhook avec montant incorrect : transaction non finalisée.
- Timeout/HTTP 5xx du prestataire puis réconciliation avec la même clé d'idempotence.
- Un retrait `FAILED` recrédite le wallet une seule fois.
- Une page de scan QR conserve l'accès caméra.
