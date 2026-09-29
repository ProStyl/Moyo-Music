-- EXTENSION DU SCHÉMA BCDA POUR LE WALLET INTERNE, LES COMPTES D'ATTENTE ET LE RAPPROCHEMENT DES BILLETS
ALTER TABLE royalty_payout_logs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS escrow_artist_name VARCHAR(255);

-- Table des déclarations et rapprochement de billetterie papier (Invendus / Annulations)
CREATE TABLE IF NOT EXISTS physical_ticket_declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES users(id),
    event_name VARCHAR(255) NOT NULL,
    batch_code VARCHAR(100) UNIQUE NOT NULL,
    initial_tickets_printed INTEGER NOT NULL,
    unit_price_fcfa DECIMAL(10, 2) NOT NULL,
    actual_tickets_sold INTEGER DEFAULT 0,
    unsold_tickets_returned INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'DECLARED', -- 'DECLARED', 'RECONCILED_COMPLETED', 'CANCELLED'
    final_tax_collected_fcfa DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reconciled_at TIMESTAMP WITH TIME ZONE
);
