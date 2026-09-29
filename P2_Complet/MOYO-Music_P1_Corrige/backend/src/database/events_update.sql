-- TABLE POUR LA GESTION DES COLLABORATEURS ET DES REVENUE SPLITS DES ÉVÉNEMENTS
CREATE TABLE IF NOT EXISTS event_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL, -- 'main_artist', 'guest_artist', 'orchestra', 'promoter', 'influencer', 'sound_engineer'
    phone_number VARCHAR(50) NOT NULL, -- MoMo/Airtel pour reversement
    split_percentage DECIMAL(5, 2) NOT NULL, -- Ex: 50.00 (%)
    payout_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter colonnes pour invités, type d'événement et configuration technique
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) DEFAULT 'Concert Live';
ALTER TABLE events ADD COLUMN IF NOT EXISTS invited_guests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS revenue_splits JSONB DEFAULT '[]'::jsonb;
