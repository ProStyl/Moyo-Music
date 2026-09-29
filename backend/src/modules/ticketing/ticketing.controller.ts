import { Router, Request, Response } from 'express';
import { query } from '../../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../auth/auth.middleware';
import QRCode from 'qrcode';
import crypto from 'crypto';

const router = Router();

export const CONGO_VENUES = [
  {
    id: "palais-congres-grande",
    name: "Palais des Congres - Grande Salle des Congres",
    city: "Brazzaville",
    address: "Boulevard Denis Sassou Nguesso, Plateau des 15 Ans",
    capacity: 1800,
    type: "Salle de Spectacle & Congres",
    facilities: "Scene pro, acoustique renforcee, loges VIP, regie lumiere"
  },
  {
    id: "palais-congres-banquets",
    name: "Palais des Congres - Salle des Banquets / Showcases",
    city: "Brazzaville",
    address: "Boulevard Denis Sassou Nguesso",
    capacity: 500,
    type: "Din-de Concert & Showcase VIP",
    facilities: "Espace cocktail, tables rondes, sono live"
  },
  {
    id: "ifc-brazza-savorgnan",
    name: "Institut Francais du Congo (IFC) - Salle Savorgnan de Brazza",
    city: "Brazzaville",
    address: "Rond-Point CCF, Centre-Ville",
    capacity: 480,
    type: "Theatre & Concert Acoustique",
    facilities: "Insonorisation studio, projection video, eclairage scenique DMX"
  },
  {
    id: "ifc-brazza-exterieur",
    name: "Institut Francais du Congo (IFC) - Scene Plein Air",
    city: "Brazzaville",
    address: "Rond-Point CCF, Centre-Ville",
    capacity: 1000,
    type: "Festival & Scene Exterieure",
    facilities: "Grand podium, fosse debout, espace buvette"
  },
  {
    id: "stade-massamba-debat",
    name: "Stade Alphonse Massamba-Debat",
    city: "Brazzaville",
    address: "Bacongo, Brazzaville",
    capacity: 33000,
    type: "Mega-Concert / Festival National",
    facilities: "Pelouse geante, gradins, sonorisation de grande puissance"
  },
  {
    id: "stade-kintele",
    name: "Complexe Sportif de la Concorde (Stade de Kinteli)",
    city: "Brazzaville (Kinteli)",
    address: "Route Nationale 2, Kinteli",
    capacity: 60000,
    type: "Stade International & Festival",
    facilities: "Infrastructures modernes, parkings securises"
  },
  {
    id: "radisson-blu-mbamou",
    name: "Radisson Blu M'Bamou Palace - Salons VIP",
    city: "Brazzaville",
    address: "Bords du Fleuve Congo, Centre-Ville",
    capacity: 300,
    type: "Showcase Ultra-VIP & Soiree SAPE",
    facilities: "Service hotelier 5 etoiles, sonorisation feutee"
  },
  {
    id: "centre-culturel-zola",
    name: "Centre Culturel Zola (CCZ)",
    city: "Brazzaville (Bacongo)",
    address: "Bacongo, Rue M-a-Loango",
    capacity: 350,
    type: "Concert Rumba & Theatre",
    facilities: "Ambiance intime, scene tradi-moderne"
  },

  {
    id: "ifc-pnr-tchicaya",
    name: "Institut Français de Pointe-Noire - Salle Jean-Baptiste Tchicaya U Tam'si",
    city: "Pointe-Noire",
    address: "Boulevard du Général de Gaulle, Centre-Ville",
    capacity: 350,
    type: "Concert Live & Spectacle",
    facilities: "Scene équippee, acoustique traitée"
  },
  {
    id: "espace-yaro-pnr",
    name: "Espace Culturel Yaro (Côte Sauvage)",
    city: "Pointe-Noire",
    address: "Loandjili / Bords de Mer",
    capacity: 400,
    type: "Festival & Scène Indépendante",
    facilities: "Cadre culturel côtier, scène ouverte"
  },
  {
    id: "stade-municipal-pnr",
    name: "Stade Municipal de Pointe-Noire",
    city: "Pointe-Noire",
    address: "Centre-Ville, Pointe-Noire",
    capacity: 13500,
    type: "Grand Concert Extérieur",
    facilities: "Gradins couverts, espace scène centrale"
  }
];

router.get('/venues', (req: Request, res: Response) => {
  return res.json({ venues: CONGO_VENUES });
});

router.get('/events', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT e.*, u.full_name as organizer_name, u.artist_name as organizer_brand
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.is_published = true AND e.event_date >= CURRENT_DATE - INTERVAL '1 day'
      ORDER BY e.event_date ASC
    `);
    return res.json({ events: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des événements', details: error.message });
  }
});

router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT e.*, u.full_name as organizer_name, u.artist_name as organizer_brand, u.phone_number as organizer_phone,
        (SELECT json_agg(c.*) FROM event_collaborators c WHERE c.event_id = e.id) as collaborators
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    return res.json({ event: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement de l\'événement' });
  }
});

router.post('/events/create', authenticateToken, requireRole(['artist', 'organizer']), async (req: AuthRequest, res: Response) => {
  try {
    const creatorId = req.user?.id;
    const { title, venue_name, event_date, ticket_price_fcfa, total_capacity } = req.body;
    if (!title || !venue_name || !event_date || !ticket_price_fcfa || !total_capacity) {
      return res.status(400).json({ error: 'Veuillez renseigner tous les champs requis.' });
    }
    const result = await query(`
      INSERT INTO events (organizer_id, title, description, category, event_type, venue_name, city, address,
        event_date, banner_image_url, ticket_price_fcfa, vip_ticket_price_fcfa, total_capacity,
        invited_guests, revenue_splits)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [creatorId, title, '', 'Concert', 'Concert Live Rumba', venue_name, 'Brazzaville', '',
      event_date, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
      ticket_price_fcfa, null, total_capacity, '[]', '[]']);
    return res.status(201).json({ message: 'Événement créé avec succès !', event: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création de l\'événement', details: error.message });
  }
});

router.post('/buy-ticket', async (req: Request, res: Response) => {
  try {
    const { event_id, buyer_name, buyer_phone, ticket_type, purchase_idempotency_key } = req.body;
    if (!event_id || !buyer_name || !buyer_phone) {
      return res.status(400).json({ error: 'Nom, téléphone et événement requis.' });
    }
    const eventRes = await query(`SELECT * FROM events WHERE id = $1 FOR UPDATE`, [event_id]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    const event = eventRes.rows[0];
    if (event.tickets_reserved + 1 > event.total_capacity) {
      return res.status(400).json({ error: 'Complet ! Tous les billets ont été réservés.' });
    }
    const isVip = ticket_type === 'VIP';
    const price = isVip ? 5000 : 2000;
    if (purchase_idempotency_key) {
      const existing = await query(`SELECT * FROM tickets WHERE purchase_idempotency_key = $1`, [purchase_idempotency_key]);
      if (existing.rows.length > 0) {
        return res.json({ message: 'Achat déjà traité (idempotent).', ticket: existing.rows[0] });
      }
    }
    const qrCodeHash = `TKT-CG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await query(`
      INSERT INTO tickets (event_id, buyer_name, buyer_phone, ticket_type, price_paid_fcfa, qr_code_hash, status, purchase_idempotency_key)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_PAYMENT', $7)
    `, [event.id, buyer_name, buyer_phone, isVip ? 'VIP' : 'STANDARD', price, qrCodeHash, purchase_idempotency_key]);
    await query(`UPDATE events SET tickets_reserved = tickets_reserved + 1 WHERE id = $1`, [event.id]);
    return res.status(201).json({ message: 'Billet créé en attente de paiement.', ticket: { event_id, buyer_name, buyer_phone, ticket_type: isVip ? 'VIP' : 'STANDARD', price_paid_fcfa: price, qr_code_hash: qrCodeHash, status: 'PENDING_PAYMENT' } });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de l\'achat du billet', details: error.message });
  }
});

router.post('/scan-ticket', authenticateToken, requireRole(['organizer']), async (req: AuthRequest, res: Response) => {
  try {
    const { qr_code_hash } = req.body;
    if (!qr_code_hash) {
      return res.status(400).json({ error: 'Code manquant' });
    }
    const ticketRes = await query(`SELECT t.*, e.title as event_title, e.venue_name FROM tickets t JOIN events e ON t.event_id = e.id WHERE t.qr_code_hash = $1`, [qr_code_hash]);
    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'BILLET INVALIDE' });
    }
    const ticket = ticketRes.rows[0];
    if (ticket.status === 'USED') {
      return res.status(400).json({ valid: false, warning: 'Billet DÉJÀ UTILISÉ !' });
    }
    await query(`UPDATE tickets SET status = 'USED', scanned_at = CURRENT_TIMESTAMP, scanned_by = $1 WHERE id = $2`, [req.user?.id || null, ticket.id]);
    await query(`UPDATE events SET tickets_reserved = GREATEST(tickets_reserved - 1, 0) WHERE id = $1`, [ticket.event_id]);
    return res.json({ valid: true, message: 'ENTRÉE AUTORISÉE !', ticket: { ...ticket, event_title: ticket.event_title } });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur scan' });
  }
});

router.get('/purchase-status', async (req: Request, res: Response) => {
  try {
    const { purchase_idempotency_key, buyer_phone } = req.query;
    if (!purchase_idempotency_key || !buyer_phone) {
      return res.status(400).json({ error: 'Clé et téléphone requis.' });
    }
    const ticketRes = await query(`SELECT t.*, e.title as event_title FROM tickets t JOIN events e ON t.event_id = e.id WHERE t.purchase_idempotency_key = $1 AND t.buyer_phone = $2`, [purchase_idempotency_key, buyer_phone]);
    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: 'Achat non trouvé.' });
    }
    const ticket = ticketRes.rows[0];
    const canViewQr = ticket.status === 'VALID';
    return res.json({ ticket: canViewQr ? { ...ticket } : { ...ticket, qr_code_image: null }, canViewQr, message: canViewQr ? 'Billet confirmé.' : 'En attente de paiement.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur récupération statut' });
  }
});

export default router;