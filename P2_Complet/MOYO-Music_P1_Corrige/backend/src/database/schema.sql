-- ==============================================================================
-- PLATEFORME DIGITALE MUSIQUE & ARTS CONGO (BRAZZAVILLE)
-- SCHÉMA DE BASE DE DONNÉES POSTGRESQL COMPLET
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UTILISATEURS & PROFILS ARTISTES / CRÉATEURS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50) UNIQUE NOT NULL, -- Ex: +24206XXXXXXX (MTN) ou +24205XXXXXXX (Airtel)
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'artist', -- 'artist', 'organizer', 'painter', 'fan', 'admin'
    bio TEXT,
    avatar_url TEXT,
    momo_number VARCHAR(50),
    airtel_number VARCHAR(50),
    wallet_balance_fcfa DECIMAL(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SORTIES MUSICALES (RELEASES)
CREATE TABLE IF NOT EXISTS releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    release_type VARCHAR(50) NOT NULL, -- 'single', 'ep', 'album'
    genre VARCHAR(100) NOT NULL, -- 'Rumba Congolaise', 'Afrobeats', 'Hip-Hop/Rap', 'Gospel', 'Tradi-Moderne', 'Folk'
    primary_language VARCHAR(50) DEFAULT 'Lingala', -- 'Lingala', 'Kikongo', 'Français', 'Anglais'
    release_date DATE NOT NULL,
    upc_code VARCHAR(100) UNIQUE,
    cover_image_url TEXT NOT NULL,
    record_label VARCHAR(255) DEFAULT 'Indépendant',
    status VARCHAR(50) DEFAULT 'pending_review', -- 'draft', 'pending_review', 'approved', 'distributed', 'rejected'
    target_platforms JSONB DEFAULT '["spotify", "apple_music", "boomplay", "audiomack", "deezer", "youtube_music", "tiktok", "meta"]'::jsonb,
    is_paid BOOLEAN DEFAULT FALSE,
    distribution_fee_fcfa DECIMAL(10, 2) DEFAULT 5000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PISTES AUDIO (TRACKS)
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    track_number INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    featured_artists VARCHAR(255),
    isrc_code VARCHAR(100) UNIQUE,
    audio_file_url TEXT NOT NULL,
    audio_format VARCHAR(20) DEFAULT 'wav', -- 'wav', 'flac'
    duration_seconds INT,
    composer VARCHAR(255),
    author_lyricist VARCHAR(255),
    explicit_content BOOLEAN DEFAULT FALSE,
    preview_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SERVICES 360° POUR ARTISTES (YouTube OAC, TikTok Sync, Spotify, Mastering)
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL, -- 'youtube_oac', 'tiktok_artist_badge', 'spotify_verification', 'graphic_design', 'audio_mastering'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    external_links JSONB, -- Ex: {"youtube_channel": "https://youtube.com/...", "social_handle": "@artist"}
    status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'in_progress', 'completed', 'rejected'
    price_fcfa DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ÉVÉNEMENTS & BILLETTERIE (TICKETING)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Concert', -- 'Concert', 'Festival', 'Exposition d''Art', 'Théâtre', 'Danse'
    venue_name VARCHAR(255) NOT NULL, -- Ex: 'Institut Français du Congo (IFC), Brazzaville'
    city VARCHAR(100) DEFAULT 'Brazzaville', -- 'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Oyo'
    address TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    banner_image_url TEXT,
    ticket_price_fcfa DECIMAL(10, 2) NOT NULL,
    vip_ticket_price_fcfa DECIMAL(10, 2),
    total_capacity INT NOT NULL,
    tickets_sold INT DEFAULT 0,
    tickets_reserved INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(50) NOT NULL, -- Numéro MoMo/Airtel
    ticket_type VARCHAR(50) DEFAULT 'STANDARD', -- 'STANDARD', 'VIP'
    price_paid_fcfa DECIMAL(10, 2) NOT NULL,
    qr_code_hash VARCHAR(255) UNIQUE NOT NULL,
    purchase_idempotency_key VARCHAR(255) UNIQUE, -- Empêche les doubles achats lors des retries
    payment_transaction_id UUID,
    payment_expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'VALID', -- 'PENDING_PAYMENT', 'VALID', 'USED', 'CANCELLED'
    scanned_at TIMESTAMP WITH TIME ZONE,
    scanned_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. MARCHÉ DE L'ART & GALERIE VIRTUELLE (POTO-POTO, SCULPTURE, ARTISANAT)
CREATE TABLE IF NOT EXISTS artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Peinture Poto-Poto', 'Art Contemporain', 'Sculpture Bois/Bronze', 'Mode & Sape', 'Artisanat'
    dimensions VARCHAR(100), -- Ex: '80 x 100 cm'
    medium VARCHAR(100), -- Ex: 'Acrylique sur toile', 'Bois d''ébène'
    year_created INT DEFAULT 2026,
    description TEXT,
    price_fcfa DECIMAL(12, 2) NOT NULL,
    price_eur DECIMAL(10, 2), -- Pour la diaspora et clients internationaux
    image_url TEXT NOT NULL,
    additional_images JSONB DEFAULT '[]'::jsonb,
    certificate_number VARCHAR(100) UNIQUE,
    is_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TRANSACTIONS FINANCIÈRES & MOBILE MONEY (Congo Brazzaville)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL, -- 'distribution_payment', 'service_payment', 'ticket_purchase', 'art_purchase', 'payout_withdrawal', 'royalty_credit'
    amount_fcfa DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XAF', -- FCFA (XAF) ou EUR/USD
    payment_method VARCHAR(50) NOT NULL, -- 'MTN_MOMO', 'AIRTEL_MONEY', 'CARD_STRIPE', 'INTERNAL_WALLET'
    phone_used VARCHAR(50),
    external_reference VARCHAR(255) UNIQUE, -- ID transaction CinetPay / Flutterwave
    idempotency_key VARCHAR(255) UNIQUE, -- Empêche les doubles opérations financières
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED'
    metadata JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMP WITH TIME ZONE,
    provider_last_checked_at TIMESTAMP WITH TIME ZONE,
    reconciliation_attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_key VARCHAR(255) UNIQUE NOT NULL,
    provider_event_id VARCHAR(255),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    amount_fcfa DECIMAL(14,2),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES POUR HAUTE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_release ON tracks(release_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_hash ON tickets(qr_code_hash);
CREATE INDEX IF NOT EXISTS idx_artworks_artist ON artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_purchase_idempotency ON tickets(purchase_idempotency_key) WHERE purchase_idempotency_key IS NOT NULL;
