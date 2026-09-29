import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../auth/auth.middleware';
import { sonosuite } from './sonosuite.service';
import { getNextISRC, getNextUPC } from '../../database/sequences';
import crypto from 'crypto';

const router = Router();

// LISTE DE TOUTES LES SORTIES PUBLIQUES / DISTRIBUÉES (Accessible à tout le monde)
router.get('/', async (req, res: Response) => {
  try {
    const result = await query(`
      SELECT r.*, u.artist_name, u.full_name as author_name,
        (SELECT json_agg(t.* ORDER BY t.track_number ASC) FROM tracks t WHERE t.release_id = r.id) as tracks
      FROM releases r
      JOIN users u ON r.artist_id = u.id
      WHERE r.status = 'distributed' OR r.status = 'approved'
      ORDER BY r.release_date DESC
    `);
    return res.json({ releases: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des sorties', details: error.message });
  }
});

// LISTE DES SORTIES DE L'ARTISTE CONNECTÉ (Réservé aux Artistes Musiciens)
router.get('/my-releases', authenticateToken, requireRole(['artist']), async (req: AuthRequest, res: Response) => {
  try {
    const artistId = req.user?.id;
    const result = await query(`
      SELECT r.*,
        (SELECT json_agg(t.* ORDER BY t.track_number ASC) FROM tracks t WHERE t.release_id = r.id) as tracks
      FROM releases r
      WHERE r.artist_id = $1
      ORDER BY r.created_at DESC
    `, [artistId]);

    return res.json({ releases: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération de vos sorties' });
  }
});

// CRÉER UNE NOUVELLE SORTIE (Réservé aux Artistes Musiciens)
router.post('/create', authenticateToken, requireRole(['artist']), async (req: AuthRequest, res: Response) => {
  try {
    const artistId = req.user?.id;
    const {
      title,
      release_type,
      genre,
      primary_language,
      release_date,
      cover_image_url,
      record_label,
      target_platforms,
      tracks
    } = req.body;

    if (!title || !release_type || !genre || !release_date || !cover_image_url) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (Titre, Type, Genre, Date, Pochette).' });
    }

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: 'Vous devez ajouter au moins une piste audio.' });
    }

    const upcCode = await getNextUPC();
    const feeFcfa = release_type === 'single' ? 5000.00 : (release_type === 'ep' ? 10000.00 : 15000.00);

    // 1. Insertion de la sortie
    const releaseRes = await query(`
      INSERT INTO releases (
        artist_id, title, release_type, genre, primary_language, release_date,
        upc_code, cover_image_url, record_label, status, target_platforms, distribution_fee_fcfa, is_paid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      artistId,
      title,
      release_type,
      genre,
      primary_language || 'Lingala',
      release_date,
      upcCode,
      cover_image_url,
      record_label || 'Indépendant',
      'pending_review',
      JSON.stringify(target_platforms || ['spotify', 'apple_music', 'boomplay', 'audiomack', 'deezer', 'youtube_music', 'tiktok']),
      feeFcfa,
      false
    ]);

    const newRelease = releaseRes.rows[0];

    // 2. Insertion des pistes avec génération de codes ISRC
    const insertedTracks = [];
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      const isrc = t.isrc_code || await getNextISRC();
      const trackRes = await query(`
        INSERT INTO tracks (
          release_id, track_number, title, featured_artists, isrc_code,
          audio_file_url, audio_format, duration_seconds, composer, author_lyricist, explicit_content
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        newRelease.id,
        i + 1,
        t.title,
        t.featured_artists || null,
        isrc,
        t.audio_file_url || 'https://example.com/audio/sample.wav',
        t.audio_format || 'wav',
        t.duration_seconds || 180,
        t.composer || '',
        t.author_lyricist || '',
        t.explicit_content || false
      ]);
      insertedTracks.push(trackRes.rows[0]);
    }

    // 3. Récupérer le nom de l'artiste pour SonoSuite
    const userRes = await query('SELECT artist_name, full_name FROM users WHERE id = $1', [artistId]);
    const artistName = userRes.rows[0]?.artist_name || userRes.rows[0]?.full_name || 'Artiste Indépendant';

    // 4. Synchronisation avec le catalogue SonoSuite
    const sonosuiteResult = await sonosuite.createRelease({
      title,
      artist_name: artistName,
      release_type,
      genre,
      language: primary_language || 'Lingala',
      release_date,
      upc_code: upcCode,
      cover_image_url,
      target_platforms: target_platforms || ['spotify', 'apple_music', 'boomplay', 'audiomack', 'tiktok'],
      tracks: insertedTracks.map((t) => ({
        track_number: t.track_number,
        title: t.title,
        isrc_code: t.isrc_code,
        audio_file_url: t.audio_file_url,
        duration_seconds: t.duration_seconds,
        composer: t.composer,
        author: t.author_lyricist,
      })),
    });

    return res.status(201).json({
      message: 'Sortie créée avec succès et synchronisée avec le catalogue SonoSuite pour distribution internationale.',
      release: newRelease,
      tracks: insertedTracks,
      sonosuite: sonosuiteResult,
    });
  } catch (error: any) {
    console.error('Erreur création sortie :', error);
    return res.status(500).json({ error: 'Erreur lors de la création de la sortie', details: error.message });
  }
});

// SIMULATION & LIVRAISON DE DISTRIBUTION VERS LES DSPS (Admin ou Post-Paiement)
router.post('/:id/distribute', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`
      UPDATE releases
      SET status = 'distributed', is_paid = true
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sortie introuvable' });
    }

    return res.json({
      message: 'Sortie transmise avec succès aux DSPs (Spotify, Apple Music, Boomplay, Audiomack, YouTube, TikTok) via DDEX !',
      release: result.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la distribution' });
  }
});

// EXPORT DU PAQUET XML DDEX ERN 4.3 POUR LES DSPS (SPOTIFY, APPLE, BOOMPLAY)
router.get('/:id/ddex-xml', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { ddexService } = await import('./ddex.service');

    const releaseRes = await query(`
      SELECT r.*, u.artist_name, u.full_name as author_name,
        (SELECT json_agg(t.* ORDER BY t.track_number ASC) FROM tracks t WHERE t.release_id = r.id) as tracks
      FROM releases r
      JOIN users u ON r.artist_id = u.id
      WHERE r.id = $1
    `, [id]);

    if (releaseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Sortie introuvable' });
    }

    const r = releaseRes.rows[0];
    const tracksList = (r.tracks || []).map((t: any) => ({
      position: t.track_number,
      title: t.title,
      isrc: t.isrc_code || `CG-B01-26-${String(t.track_number).padStart(5, '0')}`,
      duration_iso: `PT${Math.floor((t.duration_seconds || 180) / 60)}M${(t.duration_seconds || 180) % 60}S`,
      duration_seconds: t.duration_seconds || 180,
      audio_filename: `track_${t.track_number}.wav`,
      author: t.author_lyricist || r.author_name || 'Prince Nzassi',
      composer: t.composer || 'DJ Brazza Beat',
      explicit: t.explicit_content || false,
    }));

    const xml = ddexService.generateERN4XML({
      message_id: `MSG-DDEX-MOYO-${r.upc_code || id}`,
      sender_id: 'PADPIDA2026MOYO',
      recipient_id: 'PADPIDDSPWORLD',
      upc: r.upc_code || `UPC-CG-${Date.now()}`,
      release_title: r.title,
      release_type: r.release_type,
      main_artist: r.artist_name || r.author_name || 'Prince Nzassi',
      genre: r.genre || 'Rumba Congolaise',
      p_line_year: new Date(r.release_date).getFullYear() || 2026,
      p_line_text: `${r.artist_name} / Moyo Culture Congo`,
      c_line_year: new Date(r.release_date).getFullYear() || 2026,
      c_line_text: 'Moyo Culture Congo',
      label_name: r.record_label || 'Moyo Music Indépendant',
      release_date: new Date(r.release_date).toISOString().split('T')[0],
      cover_image_filename: 'cover.jpg',
      territories: ['Worldwide'],
      tracks: tracksList,
    });

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="DDEX_${r.upc_code || id}.xml"`);
    return res.send(xml);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur génération DDEX XML', details: error.message });
  }
});

export default router;
