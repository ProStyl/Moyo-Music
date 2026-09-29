import { Router, Request, Response } from 'express';
import { query } from '../../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../auth/auth.middleware';
import { getNextArtCertificate } from '../../database/sequences';

const router = Router();

// LISTE DE TOUTES LES ŒUVRES D'ART DISPONIBLES
router.get('/artworks', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let sql = `
      SELECT a.*, u.full_name as artist_name, u.artist_name as artist_brand, u.bio as artist_bio
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE a.is_sold = false
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ` AND a.category = $1`;
    }

    sql += ` ORDER BY a.created_at DESC`;

    const result = await query(sql, params);
    return res.json({ artworks: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des œuvres d\'art', details: error.message });
  }
});

// DÉTAILS D'UNE ŒUVRE
router.get('/artworks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT a.*, u.full_name as artist_name, u.artist_name as artist_brand, u.bio as artist_bio, u.phone_number as artist_phone
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Œuvre non trouvée' });
    }

    return res.json({ artwork: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement de l\'œuvre' });
  }
});

// VÉRIFICATION D'UN CERTIFICAT D'AUTHENTICITÉ (Pour les collectionneurs)
router.get('/verify-certificate/:certNumber', async (req: Request, res: Response) => {
  try {
    const { certNumber } = req.params;
    const result = await query(`
      SELECT a.*, u.full_name as master_artist_name
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE a.certificate_number = $1
    `, [certNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        verified: false,
        error: 'Certificat non reconnu dans le registre officiel des arts du Congo.'
      });
    }

    return res.json({
      verified: true,
      artwork: result.rows[0],
      message: 'Authenticité certifiée par le registre d\'art de la plateforme.'
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la vérification du certificat' });
  }
});

// MES ŒUVRES D'ART (Réservé aux Artistes Peintres / Sculpteurs)
router.get('/my-artworks', authenticateToken, requireRole(['painter']), async (req: AuthRequest, res: Response) => {
  try {
    const artistId = req.user?.id;
    const result = await query(`
      SELECT * FROM artworks
      WHERE artist_id = $1
      ORDER BY created_at DESC
    `, [artistId]);

    return res.json({ artworks: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération de vos œuvres' });
  }
});

// AJOUTER UNE ŒUVRE (Réservé aux Artistes Peintres / Sculpteurs)
router.post('/artworks/create', authenticateToken, requireRole(['painter']), async (req: AuthRequest, res: Response) => {
  try {
    const artistId = req.user?.id;
    const {
      title,
      category,
      dimensions,
      medium,
      year_created,
      description,
      price_fcfa,
      price_eur,
      image_url
    } = req.body;

    if (!title || !category || !price_fcfa || !image_url) {
      return res.status(400).json({ error: 'Titre, catégorie, prix en FCFA et image sont obligatoires.' });
    }

    const certNumber = await getNextArtCertificate();

    const result = await query(`
      INSERT INTO artworks (
        artist_id, title, category, dimensions, medium, year_created,
        description, price_fcfa, price_eur, image_url, certificate_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      artistId,
      title,
      category,
      dimensions || 'Non spécifié',
      medium || 'Acrylique sur toile',
      year_created || new Date().getFullYear(),
      description || '',
      price_fcfa,
      price_eur || (parseFloat(price_fcfa) / 655.957).toFixed(2),
      image_url,
      certNumber
    ]);

    return res.status(201).json({
      message: 'Œuvre mise en ligne avec certificat d\'authenticité généré !',
      artwork: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erreur création œuvre :', error);
    return res.status(500).json({ error: 'Erreur lors de la publication de l\'œuvre', details: error.message });
  }
});

export default router;
