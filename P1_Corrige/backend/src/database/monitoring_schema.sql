-- ==============================================================================
-- PHASE 4 : INFRASTRUCTURE DATA & MONITORING RADIOS/TV CONGO (BCDA TRACKING)
-- ==============================================================================

-- 1. Stations Radios & Chaînes TV Congolaises
CREATE TABLE IF NOT EXISTS media_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'RADIO', 'TV'
    city VARCHAR(100) NOT NULL, -- 'Brazzaville', 'Pointe-Noire', 'Dolisie'
    frequency VARCHAR(50), -- Ex: '98.4 FM', 'Chaine 1 TNT'
    stream_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    total_broadcasts_detected INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Détections de Morceaux en Direct (Airplay Logs)
CREATE TABLE IF NOT EXISTS airplay_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES media_stations(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
    artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    isrc_code VARCHAR(100),
    confidence_score DECIMAL(5, 2) NOT NULL DEFAULT 95.00, -- % de certitude de l'empreinte audio (ex: 98.5%)
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INT DEFAULT 210,
    estimated_royalty_fcfa DECIMAL(10, 2) DEFAULT 250.00, -- Ex: 250 FCFA par passage Radio, 500 FCFA par passage TV
    bcda_status VARCHAR(50) DEFAULT 'PENDING_COLLECTION' -- 'PENDING_COLLECTION', 'INVOICED_TO_STATION', 'PAID_TO_ARTIST'
);

-- 3. Rapports de Répartition BCDA (Bureau Congolais du Droit d'Auteur)
CREATE TABLE IF NOT EXISTS bcda_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period VARCHAR(50) NOT NULL, -- Ex: 'Août 2026', 'T3 2026'
    total_plays INT NOT NULL,
    total_royalties_fcfa DECIMAL(14, 2) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    report_data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_airplay_artist ON airplay_detections(artist_id);
CREATE INDEX IF NOT EXISTS idx_airplay_station ON airplay_detections(station_id);
CREATE INDEX IF NOT EXISTS idx_airplay_date ON airplay_detections(detected_at DESC);
