-- CRÉATION DES COMPTES OFFICIELS AVEC GESTION DES RÔLES BCDA & ADMIN
DO $$
DECLARE
    pwd_hash TEXT := '$2a$10$7Z8bU7E7iIqUqvL4lF0xueYg6E6O0z8.6w2.g4c7B0mK9q5e0n6W6'; -- Hash pour 'Congo2026!'
BEGIN
    -- 1. Compte Agent BCDA / Inspecteur des Droits
    IF NOT EXISTS (SELECT 1 FROM users WHERE phone_number = '+242065554433') THEN
        INSERT INTO users (full_name, artist_name, email, phone_number, password_hash, role, bio, momo_number)
        VALUES (
            'Inspecteur BCDA Brazzaville',
            'Agent BCDA - Contrôle & Répartition',
            'inspecteur@bcda.cg',
            '+242065554433',
            pwd_hash,
            'bcda_agent',
            'Agent assermenté du Bureau Congolais du Droit d''Auteur (BCDA).',
            '+242065554433'
        );
    END IF;

    -- 2. Compte Administrateur Général Plateforme
    IF NOT EXISTS (SELECT 1 FROM users WHERE phone_number = '+242060000000') THEN
        INSERT INTO users (full_name, artist_name, email, phone_number, password_hash, role, bio, momo_number)
        VALUES (
            'Administrateur Général Moyo',
            'Admin Superviseur',
            'admin@moyo-culture.cg',
            '+242060000000',
            pwd_hash,
            'admin',
            'Superviseur technique et financier de la plateforme.',
            '+242060000000'
        );
    END IF;
END $$;
