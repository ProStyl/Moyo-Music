import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../auth/auth.middleware';

const router = Router();

// LISTE DES PACKS DISPONIBLES ET TARIFS
const CATALOG_SERVICES = [
  {
    type: 'youtube_oac',
    title: 'Chaîne Officielle d\'Artiste YouTube (OAC - Note de Musique 🎵)',
    description: 'Fusion de votre chaîne personnelle avec vos sorties YouTube Music, obtention du badge officiel et accès aux analyses avancées YouTube for Artists.',
    price_fcfa: 25000.00,
    delivery_time: '3 à 7 jours'
  },
  {
    type: 'tiktok_artist_badge',
    title: 'Certification & Hub Artiste TikTok (Badge Musique 🎶)',
    description: 'Liaison de votre compte officiel TikTok avec votre catalogue audio. Ajout de l\'onglet Musique sur votre profil TikTok pour faciliter les challenges et trends virales.',
    price_fcfa: 20000.00,
    delivery_time: '2 à 5 jours'
  },
  {
    type: 'spotify_verification',
    title: 'Vérification Spotify for Artists (Badge Bleu Certifié ✅)',
    description: 'Récupération de vos accès officiels Spotify for Artists, personnalisation de bannière, biographie, dates de concerts et soumission aux playlists éditoriales.',
    price_fcfa: 15000.00,
    delivery_time: '24 à 48 heures'
  },
  {
    type: 'audio_mastering',
    title: 'Mastering Audio Professionnel (Normes DSPs -14 LUFS)',
    description: 'Traitement acoustique et dynamisation de vos pistes audio par nos ingénieurs du son partenaires à Brazzaville/Pointe-Noire pour un rendu optimal sur toutes les enceintes.',
    price_fcfa: 30000.00,
    delivery_time: '48 heures'
  },
  {
    type: 'graphic_design',
    title: 'Création de Pochette Professionnelle (Cover Art 3000x3000px)',
    description: 'Design sur-mesure conforme aux exigences strictes de Spotify et Apple Music, déclinaisons pour stories Instagram/TikTok.',
    price_fcfa: 20000.00,
    delivery_time: '48 heures'
  }
];

// OBTENIR LE CATALOGUE DES SERVICES
router.get('/catalog', (req, res: Response) => {
  return res.json({ services: CATALOG_SERVICES });
});

// OBTENIR LES DEMANDES DE SERVICES DE L'ARTISTE CONNECTÉ
router.get('/my-requests', authenticateToken, requireRole(['artist']), async (req: AuthRequest, res: Response) => {
  try {
    const artistId = req.user?.id;
    const result = await query(`
      SELECT * FROM service_requests
      WHERE artist_id = $1
      ORDER BY created_at DESC
    `, [artistId]);

    return res.json({ requests: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération de vos demandes de services' });
  }
});

// COMMANDER UN PACK DE SERVICE 360° (Artiste Musicien uniquement)
router.post('/order', authenticateToken, requireRole(['artist']), async (req: AuthRequest, res: Response) => {
  try {
    const artistId = req.user?.id;
    const { service_type, external_links, description } = req.body;

    const serviceInfo = CATALOG_SERVICES.find(s => s.type === service_type);
    if (!serviceInfo) {
      return res.status(400).json({ error: 'Type de service invalide' });
    }

    const result = await query(`
      INSERT INTO service_requests (
        artist_id, service_type, title, description, external_links, status, price_fcfa, is_paid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      artistId,
      serviceInfo.type,
      serviceInfo.title,
      description || serviceInfo.description,
      JSON.stringify(external_links || {}),
      'submitted',
      serviceInfo.price_fcfa,
      false
    ]);

    return res.status(201).json({
      message: 'Demande de service enregistrée avec succès. Vous pouvez procéder au paiement MoMo/Airtel.',
      request: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erreur commande service :', error);
    return res.status(500).json({ error: 'Erreur lors de la commande du service', details: error.message });
  }
});

export default router;
