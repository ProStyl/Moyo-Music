-- ==============================================================================
-- EXTENSION BCDA : DROITS DES RÉALISATEURS DE CLIPS, VIGNETTES TRANSPORTS (TAXIS/BUS) & BILLETS PHYSIQUES
-- ==============================================================================

-- 1. Ajout du Volet Audiovisuel (Réalisateur de Clip) dans le Registre des Œuvres
ALTER TABLE bcda_works_registry 
ADD COLUMN IF NOT EXISTS music_video_directors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS physical_tickets_stamps JSONB DEFAULT '[]'::jsonb;

-- 2. Mise à jour des types de licences pour inclure les Taxis, Bus, Salons et Billetterie Physique
-- Types acceptés : 'Taxi 100-100 / VTC', 'Bus Transport Coaster', 'Bateau / Canot Fleuve Congo', 'Salon de Coiffure / Beauté', 'Boutique / Supermarché', 'Discothèque / Club', 'Bar VIP / Lounge', 'Nganda / Maquis'

-- Insertion d'exemples de licences Transports (Taxis verts/blancs et Bus) et Salons de coiffure
INSERT INTO commercial_licenses (
    venue_name, venue_type, owner_name, owner_phone, city, address,
    license_code, monthly_fee_fcfa, payment_status, valid_until, qr_code_hash
) VALUES
(
    'Taxi 100-100 Brazza (Plaque 452-EZ-06)',
    'Taxi 100-100 / VTC',
    'Bienvenu Malonga',
    '068991122',
    'Brazzaville',
    'Ligne Bacongo - Moungali - Ouenzé',
    'VIG-BCDA-2026-TAXI-012',
    2500.00,
    'ACTIVE_PAID',
    '2026-12-31',
    'QR-BCDA-TAXI-BZV-012'
),
(
    'Bus Coaster Express Brazza-Pointe-Noire',
    'Bus Transport Coaster',
    'Société Océan du Nord',
    '055112233',
    'Brazzaville / Pointe-Noire',
    'Gare Routière Mikalou',
    'VIG-BCDA-2026-BUS-045',
    10000.00,
    'ACTIVE_PAID',
    '2026-12-31',
    'QR-BCDA-BUS-EXP-045'
),
(
    'Salon de Coiffure & Beauté Malebo Style',
    'Salon de Coiffure / Beauté',
    'Grâce Milandou',
    '066884422',
    'Brazzaville',
    'Poto-Poto, Rue Mbakas',
    'LIC-BCDA-2026-SALON-088',
    7500.00,
    'ACTIVE_PAID',
    '2026-12-31',
    'QR-BCDA-SALON-088'
)
ON CONFLICT (license_code) DO NOTHING;

-- Mise à jour de l'œuvre modèle pour inclure le réalisateur du clip vidéo
UPDATE bcda_works_registry
SET music_video_directors = '[{"name": "Director Steven Awuku", "role": "Réalisateur Clip Vidéo Officiel", "phone": "069000010", "tv_split_percentage": 20}]'::jsonb
WHERE isrc_code = 'CG-B01-26-00001';
