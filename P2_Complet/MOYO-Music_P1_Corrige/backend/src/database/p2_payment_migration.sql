-- Migration documentaire P2.
-- initDb.ts applique automatiquement ces changements, ce fichier sert aussi
-- de référence pour les environnements qui utilisent un pipeline de migrations.
ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider_last_checked_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reconciliation_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tickets_reserved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_transaction_id UUID;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency
  ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_purchase_idempotency
  ON tickets(purchase_idempotency_key) WHERE purchase_idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_pending_reconciliation
  ON transactions(status, transaction_type, created_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_tickets_payment_transaction
  ON tickets(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_tickets_pending_expiration
  ON tickets(status, payment_expires_at) WHERE status = 'PENDING_PAYMENT';

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_key VARCHAR(255) UNIQUE NOT NULL,
  provider_event_id VARCHAR(255),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL,
  amount_fcfa DECIMAL(14,2),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
