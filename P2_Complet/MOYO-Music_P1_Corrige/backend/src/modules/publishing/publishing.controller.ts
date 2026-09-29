import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateToken, AuthRequest } from '../../modules/auth/auth.middleware';
import { getNextISWC, getNextISRC } from '../../database/sequences';

const router = Router();

// Initialisation automatique de la table publishing_catalog
const ensurePublishingTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS publishing_catalog (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      isrc_code VARCHAR(100) NOT NULL,
      iswc_code VARCHAR(100),
      track_title VARCHAR(255) NOT NULL,
      artist_name VARCHAR(255) NOT NULL,
      original_distributor VARCHAR(100) DEFAULT 'DistroKid',
      release_date VARCHAR(50),
      writers JSONB DEFAULT '[]',
      monetization_channels JSONB DEFAULT '{"the_mlc": true, "cisac_sacem": true, "bcda": true, "youtube_content_id": true, "tiktok_sync": true, "soundexchange": true}',
      status VARCHAR(50) DEFAULT 'ACTIVE_COLLECTION',
      total_streams_tracked BIGINT DEFAULT 0,
      mechanical_royalties_fcfa NUMERIC(12, 2) DEFAULT 0,
      performance_royalties_fcfa NUMERIC(12, 2) DEFAULT 0,
      content_id_royalties_fcfa NUMERIC(12, 2) DEFAULT 0,
      neighboring_royalties_fcfa NUMERIC(12, 2) DEFAULT 0,
      total_collected_fcfa NUMERIC(12, 2) DEFAULT 0,
      last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

ensurePublishingTable().catch(console.error);

// 1. OBTENIR LE CATALOGUE DES ŒUVRES ADMINISTRÉES PAR MOYO PUBLISHING
router.get('/catalog', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await ensurePublishingTable();
    const userId = req.user?.id || (req.user as any)?.userId;

    const result = await query(
      `SELECT * FROM publishing_catalog WHERE user_id = $1 OR $2 = 'admin' ORDER BY created_at DESC`,
      [userId, req.user?.role || 'artist']
    );

    return res.json({
      success: true,
      count: result.rows.length,
      catalog: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du catalogue d\'édition', details: error.message });
  }
});

// 2. ANALYTIQUES GLOBALES DES 4 FLUX DE REVENUS D'ÉDITION (360°)
router.get('/analytics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await ensurePublishingTable();
    const userId = req.user?.id || (req.user as any)?.userId;

    const result = await query(
      `SELECT 
        COUNT(*) as total_tracks,
        COALESCE(SUM(total_streams_tracked), 0) as total_streams,
        COALESCE(SUM(mechanical_royalties_fcfa), 0) as total_mechanical,
        COALESCE(SUM(performance_royalties_fcfa), 0) as total_performance,
        COALESCE(SUM(content_id_royalties_fcfa), 0) as total_content_id,
        COALESCE(SUM(neighboring_royalties_fcfa), 0) as total_neighboring,
        COALESCE(SUM(total_collected_fcfa), 0) as grand_total_fcfa
       FROM publishing_catalog 
       WHERE user_id = $1 OR $2 = 'admin'`,
      [userId, req.user?.role || 'artist']
    );

    const stats = result.rows[0];

    return res.json({
      success: true,
      stats: {
        total_tracks: parseInt(stats.total_tracks) || 0,
        total_streams: parseInt(stats.total_streams) || 0,
        streams_revenue_breakdown: {
          mechanical_dSPs_the_mlc: parseFloat(stats.total_mechanical) || 0,
          public_performance_cisac_bcda: parseFloat(stats.total_performance) || 0,
          youtube_content_id_tiktok: parseFloat(stats.total_content_id) || 0,
          neighboring_soundexchange: parseFloat(stats.total_neighboring) || 0,
        },
        grand_total_fcfa: parseFloat(stats.grand_total_fcfa) || 0,
        societies_connected: [
          { name: "The MLC (USA - Mechanical Streaming)", status: "CONNECTED" },
          { name: "BCDA (Congo 🇨🇬 - Direct Airplay & MoMo)", status: "CONNECTED" },
          { name: "SACEM / CISAC (Europe & Monde - ISWC)", status: "CONNECTED" },
          { name: "YouTube Content ID (Global Fingerprint)", status: "CONNECTED" },
          { name: "SoundExchange (USA - Digital Neighboring)", status: "CONNECTED" }
        ]
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du calcul des analytiques d\'édition', details: error.message });
  }
});

// 3. IMPORTER UN CODE ISRC EXTERNE (DistroKid, TuneCore, CD Baby, Believe...)
router.post('/import', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await ensurePublishingTable();
    const userId = req.user?.id || (req.user as any)?.userId;
    const { 
      isrc_code, 
      track_title, 
      artist_name, 
      original_distributor, 
      writers, 
      spotify_url 
    } = req.body;

    const cleanedIsrc = (isrc_code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cleanedIsrc && !track_title) {
      return res.status(400).json({ error: 'Le code ISRC ou le titre du morceau est obligatoire.' });
    }

    const finalTitle = (track_title || 'Titre Importé').trim();
    const finalArtist = (artist_name || req.user?.role || 'Artiste').trim();
    const finalDistributor = original_distributor || 'DistroKid';
    const finalIsrc = cleanedIsrc || await getNextISRC();

    // Vérifier si l'ISRC est déjà administré
    const existing = await query(
      `SELECT * FROM publishing_catalog WHERE isrc_code = $1 AND user_id = $2`,
      [finalIsrc, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: `Ce code ISRC (${finalIsrc}) est déjà administré sous votre compte Moyo Publishing.`
      });
    }

    // Attribution automatique d'un code ISWC mondial officiel
    const generatedIswc = await getNextISWC();

    // Initialisation exacte et réelle sans données fictives
    const initialStreams = 0;
    const initialMechanical = 0;
    const initialPerformance = 0;
    const initialContentId = 0;
    const initialNeighboring = 0;
    const grandTotal = 0;

    const writersList = writers || [
      { name: finalArtist, role: "Auteur & Compositeur", split_percentage: 100 }
    ];

    const result = await query(`
      INSERT INTO publishing_catalog (
        user_id, isrc_code, iswc_code, track_title, artist_name, original_distributor,
        writers, status, total_streams_tracked, mechanical_royalties_fcfa,
        performance_royalties_fcfa, content_id_royalties_fcfa, neighboring_royalties_fcfa,
        total_collected_fcfa
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE_COLLECTION', $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      userId,
      finalIsrc,
      generatedIswc,
      finalTitle,
      finalArtist,
      finalDistributor,
      JSON.stringify(writersList),
      initialStreams,
      initialMechanical,
      initialPerformance,
      initialContentId,
      initialNeighboring,
      grandTotal
    ]);

    return res.status(201).json({
      success: true,
      message: `🎉 Morceau "${finalTitle}" rattaché avec succès à Moyo Publishing Administration !`,
      iswc_code: generatedIswc,
      isrc_code: finalIsrc,
      track: result.rows[0]
    });

  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du rattachement d\'édition', details: error.message });
  }
});

// 4. SYNCHRONISER ET TRANSFÉRER LES REVENUS VERS LE WALLET DE L'ARTISTE
router.post('/sync-to-wallet', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || (req.user as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    // Calcul du total des sommes non réclamées
    const result = await query(
      `SELECT COALESCE(SUM(total_collected_fcfa), 0) as total_royalties FROM publishing_catalog WHERE user_id = $1`,
      [userId]
    );

    const total = parseFloat(result.rows[0].total_royalties) || 0;

    if (total <= 0) {
      return res.status(400).json({ error: 'Aucune redevance d\'édition en attente de versement.' });
    }

    // Mettre à jour le solde du portefeuille
    await query(
      `UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2`,
      [total, userId]
    );

    // Enregistrer la transaction
    await query(
      `INSERT INTO transactions (user_id, amount, type, status, description, created_at)
       VALUES ($1, $2, 'PUBLISHING_ROYALTIES_PAYOUT', 'COMPLETED', 'Versement des Droits d Edition & Droits Voisins Mondiaux (The MLC, BCDA, YouTube)', NOW())`,
      [userId, total]
    );

    return res.json({
      success: true,
      amount_transferred_fcfa: total,
      message: `💰 ${total.toLocaleString('fr-FR')} FCFA de droits d'auteur et d'édition ont été transférés avec succès sur votre portefeuille Moyo !`
    });

  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du transfert des royalties', details: error.message });
  }
});

export default router;
