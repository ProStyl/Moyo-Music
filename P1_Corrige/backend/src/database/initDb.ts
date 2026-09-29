import fs from 'fs';
import path from 'path';
import { pool, query } from './db';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  try {
    console.log('🔄 Initialisation des tables de la base de données...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    
    await query(schemaSql);
    // Migrations compatibles avec une base existante déjà initialisée.
    await query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;`);
    await query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS purchase_idempotency_key VARCHAR(255);`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_purchase_idempotency ON tickets(purchase_idempotency_key) WHERE purchase_idempotency_key IS NOT NULL;`);
    console.log('✅ Schéma SQL exécuté avec succès.');

    // Vérifier si des données de démonstration existent déjà
    const userCheck = await query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Insertion des données de test (artistes congolais, événements IFC, peintures Poto-Poto)...');
      
      const passwordHash = await bcrypt.hash('Congo2026!', 10);
      
      // 1. Artiste Musicien
      const artistRes = await query(
        `INSERT INTO users (full_name, artist_name, email, phone_number, password_hash, role, bio, momo_number, wallet_balance_fcfa)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          'Prince Nzassi',
          'Prince Nzassi - La Voix du Fleuve',
          'prince.nzassi@moyo-culture.cg',
          '+242068001122',
          passwordHash,
          'artist',
          'Auteur-compositeur de Rumba Congolaise et Tradi-Moderne originaire de Brazzaville.',
          '+242068001122',
          125000.00
        ]
      );
      const artistId = artistRes.rows[0].id;

      // 2. Artiste Peintre (Poto-Poto)
      const painterRes = await query(
        `INSERT INTO users (full_name, artist_name, email, phone_number, password_hash, role, bio, airtel_number, wallet_balance_fcfa)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          'Michel Mouanga',
          'Maître Mouanga (École de Poto-Poto)',
          'mouanga.art@moyo-culture.cg',
          '+242055003344',
          passwordHash,
          'painter',
          'Maître peintre diplômé de la célèbre École de Peinture de Poto-Poto (EPP).',
          '+242055003344',
          450000.00
        ]
      );
      const painterId = painterRes.rows[0].id;

      // 3. Organisateur d'Événements
      const organizerRes = await query(
        `INSERT INTO users (full_name, artist_name, email, phone_number, password_hash, role, bio, momo_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          'Brazza Live Productions',
          'Brazza Live Prod',
          'events@brazzalive.cg',
          '+242069998877',
          passwordHash,
          'organizer',
          'Promoteur de spectacles, concerts et festivals à Brazzaville et Pointe-Noire.',
          '+242069998877'
        ]
      );
      const organizerId = organizerRes.rows[0].id;

      // 4. Sortie Musicale
      const releaseRes = await query(
        `INSERT INTO releases (artist_id, title, release_type, genre, primary_language, release_date, upc_code, cover_image_url, record_label, status, is_paid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          artistId,
          'Échos du Pool Malebo',
          'single',
          'Rumba Congolaise',
          'Lingala',
          '2026-09-01',
          'UPC-CG-2026-0001',
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
          'Brazza Sound Indé',
          'distributed',
          true
        ]
      );
      const releaseId = releaseRes.rows[0].id;

      // Piste
      await query(
        `INSERT INTO tracks (release_id, track_number, title, isrc_code, audio_file_url, duration_seconds, composer, author_lyricist)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          releaseId,
          1,
          'Nostalgie de Bacongo',
          'CG-B01-26-00001',
          'https://example.com/audio/nostalgie_bacongo.wav',
          245,
          'Prince Nzassi',
          'Prince Nzassi'
        ]
      );

      // 5. Demandes de Services 360°
      await query(
        `INSERT INTO service_requests (artist_id, service_type, title, description, external_links, status, price_fcfa, is_paid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          artistId,
          'youtube_oac',
          'Fusion Chaîne Officielle d\'Artiste YouTube (OAC)',
          'Demande d\'attribution de la note de musique YouTube et fusion avec ma chaîne perso.',
          JSON.stringify({ youtube_channel: 'https://youtube.com/@princenzassi', spotify_link: 'https://spotify.com/artist/sample' }),
          'completed',
          25000.00,
          true
        ]
      );

      // 6. Événement (Concert)
      await query(
        `INSERT INTO events (organizer_id, title, description, category, venue_name, city, event_date, banner_image_url, ticket_price_fcfa, vip_ticket_price_fcfa, total_capacity, tickets_sold)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          organizerId,
          'Festival Rumba & Sape Brazza 2026',
          'Une soirée légendaire célébrant la Rumba congolaise inscrite au patrimoine de l\'UNESCO et l\'élégance des Sapeurs.',
          'Concert',
          'Institut Français du Congo (IFC), Rond-point CCF',
          'Brazzaville',
          '2026-10-15 19:00:00+01',
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
          5000.00,
          15000.00,
          800,
          120
        ]
      );

      // 7. Œuvres d'Art (Peintures Poto-Poto)
      await query(
        `INSERT INTO artworks (artist_id, title, category, dimensions, medium, year_created, description, price_fcfa, price_eur, image_url, certificate_number)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11),
         ($1, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          painterId,
          'Danse des Masques du Chaillu',
          'Peinture Poto-Poto',
          '100 x 120 cm',
          'Acrylique sur toile de lin',
          2026,
          'Style "mika" typique de l\'École de Poto-Poto avec silhouettes élancées et couleurs chaudes.',
          350000.00,
          535.00,
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80',
          'CERT-EPP-2026-089',
          'Les Sapeurs de Bacongo au Crépuscule',
          'Art Contemporain',
          '90 x 90 cm',
          'Huile et collages textiles wax',
          2026,
          'Hommage à l\'art vestimentaire et à la joie de vivre congolaise.',
          280000.00,
          425.00,
          'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80',
          'CERT-EPP-2026-090'
        ]
      );

      console.log('✅ Données de démonstration initialisées avec succès !');
    }
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation de la base :', err);
  }
}

if (require.main === module) {
  initializeDatabase().then(() => pool.end());
}
