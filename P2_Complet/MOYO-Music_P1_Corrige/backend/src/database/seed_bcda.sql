-- SEED DATA BCDA : ŒUVRES MUSICALES CONGOLAISES & LICENCES COMMERCILES
INSERT INTO bcda_works_registry (
    work_title, genre, isrc_code, iswc_code, registration_number,
    authors, composers, performers, producers
) VALUES
(
    'Échos du Pool Malebo',
    'Rumba Congolaise Moderne',
    'CG-B01-26-00001',
    'T-304.891.221-8',
    'BCDA-CG-2026-00101',
    '[{"name": "Prince Nzassi", "role": "Auteur des Paroles", "phone": "069000001", "split_percentage": 30}]'::jsonb,
    '[{"name": "Maître Guitariste Mavoungou", "role": "Compositeur Solo", "phone": "069000002", "split_percentage": 30}]'::jsonb,
    '[{"name": "Prince Nzassi", "role": "Chanteur Lead", "phone": "069000001", "split_percentage": 20}, {"name": "Orchestre Malebo", "role": "Section Cuivres & Percussions", "phone": "069000003", "split_percentage": 10}]'::jsonb,
    '[{"name": "Brazza Sound Label", "role": "Producteur Phonographique Master", "phone": "069000004", "split_percentage": 10}]'::jsonb
),
(
    'Ndombolo Bacongo',
    'Soukous / Ndombolo',
    'CG-B01-26-00002',
    'T-304.891.222-9',
    'BCDA-CG-2026-00102',
    '[{"name": "Prince Nzassi", "role": "Auteur", "phone": "069000001", "split_percentage": 25}]'::jsonb,
    '[{"name": "DJ Brazza Beat", "role": "Compositeur / Beatmaker", "phone": "069000005", "split_percentage": 35}]'::jsonb,
    '[{"name": "Prince Nzassi", "role": "Interprète Vocal", "phone": "069000001", "split_percentage": 20}]'::jsonb,
    '[{"name": "Kongo Records", "role": "Producteur Exécutif", "phone": "069000006", "split_percentage": 20}]'::jsonb
);

-- Licences des Discothèques et Bars de Brazzaville & Pointe-Noire
INSERT INTO commercial_licenses (
    venue_name, venue_type, owner_name, owner_phone, city, address,
    license_code, monthly_fee_fcfa, payment_status, valid_until, qr_code_hash
) VALUES
(
    'Le Privilège Club VIP',
    'Discothèque / Club',
    'Jean-Luc Moundélé',
    '068112233',
    'Brazzaville',
    'Centre-ville, Av. Amilcar Cabral',
    'LIC-BCDA-2026-BZV-001',
    65000.00,
    'ACTIVE_PAID',
    '2026-12-31',
    'QR-BCDA-PRIVILEGE-BZV-2026'
),
(
    'Le Grand Nganda de Bacongo',
    'Nganda / Maquis',
    'Mama Jeanne Mabiala',
    '055443322',
    'Brazzaville',
    'Bacongo, Rue Mbiémo',
    'LIC-BCDA-2026-BZV-002',
    20000.00,
    'ACTIVE_PAID',
    '2026-12-31',
    'QR-BCDA-BACONGO-2026'
),
(
    'La Côte Sauvage Lounge Club',
    'Bar VIP / Lounge',
    'Alain Boukoulou',
    '066778899',
    'Pointe-Noire',
    'Bord de mer, Côte Sauvage',
    'LIC-BCDA-2026-PNR-003',
    45000.00,
    'ACTIVE_PAID',
    '2026-12-31',
    'QR-BCDA-COTESAUVAGE-2026'
);
