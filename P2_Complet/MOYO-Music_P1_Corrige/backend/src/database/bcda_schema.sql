-- ==============================================================================
-- INFRASTRUCTURE BCDA : REGISTRE DES ŒUVRES, DROITS VOISINS & LICENCES ÉTABLISSEMENTS
-- ==============================================================================

-- 1. Registre d'Immatriculation des Œuvres Musicales Congolaises (Dépôt BCDA)
CREATE TABLE IF NOT EXISTS bcda_works_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) DEFAULT 'Rumba Congolaise',
    isrc_code VARCHAR(100) UNIQUE,
    iswc_code VARCHAR(100),
    registration_number VARCHAR(100) UNIQUE NOT NULL, -- Ex: BCDA-CG-2026-00842
    
    -- Volet A : Droits d'Auteur (Auteurs & Paroles)
    authors JSONB DEFAULT '[]'::jsonb, -- [{ name, role: 'Auteur', phone, split_percentage: 25 }]
    
    -- Volet B : Droits de Composition (Compositeurs & Beatmakers)
    composers JSONB DEFAULT '[]'::jsonb, -- [{ name, role: 'Compositeur', phone, split_percentage: 25 }]
    
    -- Volet C : Droits Voisins (Artistes-Interprètes & Musiciens)
    performers JSONB DEFAULT '[]'::jsonb, -- [{ name, role: 'Chanteur Principal / Guitariste', phone, split_percentage: 25 }]
    
    -- Volet D : Droits Phonographiques (Producteurs & Labels)
    producers JSONB DEFAULT '[]'::jsonb, -- [{ name, role: 'Producteur Master', phone, split_percentage: 25 }]
    
    status VARCHAR(50) DEFAULT 'CERTIFIED_BCDA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Licences & Autorisations pour Établissements (Boîtes de Nuit, Bars, Ngandas, Hôtels)
CREATE TABLE IF NOT EXISTS commercial_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_name VARCHAR(255) NOT NULL,
    venue_type VARCHAR(100) NOT NULL, -- 'Discothèque / Club', 'Bar VIP / Lounge', 'Nganda / Maquis', 'Hôtel / Restaurant'
    owner_name VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL, -- 'Brazzaville (Bacongo, Poto-Poto, etc.)', 'Pointe-Noire'
    address TEXT,
    license_code VARCHAR(100) UNIQUE NOT NULL, -- Ex: LIC-BCDA-2026-BZV-091
    monthly_fee_fcfa DECIMAL(10, 2) NOT NULL, -- Ex: 25 000 FCFA
    payment_status VARCHAR(50) DEFAULT 'ACTIVE_PAID',
    valid_until DATE NOT NULL,
    qr_code_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Historique de Répartition et Retraits des Redevances
CREATE TABLE IF NOT EXISTS royalty_payout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    right_type VARCHAR(100) NOT NULL, -- 'Droit Auteur', 'Droit Voisin', 'Droit Compositeur', 'Droit Producteur'
    source_type VARCHAR(100) NOT NULL, -- 'Radio/TV Airplay', 'Concerts & Billetterie', 'Discothèques & Bars', 'Streaming Digital'
    amount_fcfa DECIMAL(12, 2) NOT NULL,
    momo_transaction_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PAID_TO_MOMO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
