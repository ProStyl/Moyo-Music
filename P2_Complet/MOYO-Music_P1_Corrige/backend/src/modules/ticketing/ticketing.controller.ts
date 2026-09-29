import { Router, Request, Response } from 'express';
import { query, withTransaction } from '../../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../auth/auth.middleware';
import crypto from 'crypto';
import { kibangouPay } from '../payments/kibangoupay.service';
import { finalizeTransactionFailure, finalizeTransactionSuccess } from '../payments/payment-lifecycle.service';
import { serializeTicket } from './ticketing.service';

const router = Router();

// LISTE DE TOUTES LES SALLES ET ESPACES DU CONGO (Brazzaville & Pointe-Noire)
export const CONGO_VENUES = [
  // BRAZZAVILLE
  {
    id: "palais-congres-grande",
    name: "Palais des Congrès - Grande Salle des Congrès",
    city: "Brazzaville",
    address: "Boulevard Denis Sassou Nguesso, Plateau des 15 Ans",
    capacity: 1800,
    type: "Salle de Spectacle & Congrès",
    facilities: "Scène pro, acoustique renforcée, loges VIP, régie lumière"
  },
  {
    id: "palais-congres-banquets",
    name: "Palais des Congrès - Salle des Banquets / Showcases",
    city: "Brazzaville",
    address: "Boulevard Denis Sassou Nguesso",
    capacity: 500,
    type: "Dîner-Concert & Showcase VIP",
    facilities: "Espace cocktail, tables rondes, sono live"
  },
  {
    id: "ifc-brazza-savorgnan",
    name: "Institut Français du Congo (IFC) - Salle Savorgnan de Brazza",
    city: "Brazzaville",
    address: "Rond-Point CCF, Centre-Ville",
    capacity: 480,
    type: "Théâtre & Concert Acoustique",
    facilities: "Insonorisation studio, projection vidéo, éclairage scénique DMX"
  },
  {
    id: "ifc-brazza-exterieur",
    name: "Institut Français du Congo (IFC) - Scène Plein Air",
    city: "Brazzaville",
    address: "Rond-Point CCF, Centre-Ville",
    capacity: 1000,
    type: "Festival & Scène Extérieure",
    facilities: "Grand podium, fosse debout, espace buvette"
  },
  {
    id: "stade-massamba-debat",
    name: "Stade Alphonse Massamba-Débat",
    city: "Brazzaville",
    address: "Bacongo, Brazzaville",
    capacity: 33000,
    type: "Méga-Concert / Festival National",
    facilities: "Pelouse géante, gradins, sonorisation de grande puissance"
  },
  {
    id: "stade-kintele",
    name: "Complexe Sportif de la Concorde (Stade de Kintélé)",
    city: "Brazzaville (Kintélé)",
    address: "Route Nationale 2, Kintélé",
    capacity: 60000,
    type: "Stade International & Festival",
    facilities: "Infrastructures modernes, parkings sécurisés"
  },
  {
    id: "radisson-blu-mbamou",
    name: "Radisson Blu M'Bamou Palace - Salons VIP",
    city: "Brazzaville",
    address: "Bords du Fleuve Congo, Centre-Ville",
    capacity: 300,
    type: "Showcase Ultra-VIP & Soirée SAPE",
    facilities: "Service hôtelier 5 étoiles, sonorisation feutrée"
  },
  {
    id: "centre-culturel-zola",
    name: "Centre Culturel Zola (CCZ)",
    city: "Brazzaville (Bacongo)",
    address: "Bacongo, Rue Mâ-Loango",
    capacity: 350,
    type: "Concert Rumba & Théâtre",
    facilities: "Ambiance intimiste, scène tradi-moderne"
  },

  // POINTE-NOIRE
  {
    id: "ifc-pnr-tchicaya",
    name: "Institut Français de Pointe-Noire - Salle Jean-Baptiste Tchicaya U Tam'si",
    city: "Pointe-Noire",
    address: "Boulevard du Général de Gaulle, Centre-Ville",
    capacity: 350,
    type: "Concert Live & Spectacle",
    facilities: "Scène équipée, acoustique traitée"
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

// OBTENIR LE RÉPERTOIRE DES SALLES DU CONGO
router.get('/venues', (req: Request, res: Response) => {
  return res.json({ venues: CONGO_VENUES });
});

// LISTE DE TOUS LES ÉVÉNEMENTS DISPONIBLES (Public)
router.get('/events', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT e.*, GREATEST(0, e.total_capacity - COALESCE(e.tickets_sold, 0) - COALESCE(e.tickets_reserved, 0)) AS available_tickets, u.full_name as organizer_name, u.artist_name as organizer_brand
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

// DÉTAILS D'UN ÉVÉNEMENT AVEC COLLABORATEURS ET GUESTS
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT e.*, GREATEST(0, e.total_capacity - COALESCE(e.tickets_sold, 0) - COALESCE(e.tickets_reserved, 0)) AS available_tickets, u.full_name as organizer_name, u.artist_name as organizer_brand, u.phone_number as organizer_phone,
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

// CRÉATION D'UN ÉVÉNEMENT & COLLABORATION (Artiste Musicien OU Organisateur/Promoteur)
router.post('/events/create', authenticateToken, requireRole(['artist', 'organizer']), async (req: AuthRequest, res: Response) => {
  try {
    const creatorId = req.user?.id;
    const {
      title,
      description,
      category,
      event_type,
      venue_name,
      city,
      address,
      event_date,
      banner_image_url,
      ticket_price_fcfa,
      vip_ticket_price_fcfa,
      total_capacity,
      invited_guests,
      revenue_splits
    } = req.body;

    if (!title || !venue_name || !event_date || !ticket_price_fcfa || !total_capacity) {
      return res.status(400).json({ error: 'Veuillez renseigner tous les champs requis (Titre, Lieu, Date, Prix, Capacité).' });
    }

    // 1. Insertion de l'événement
    const result = await query(`
      INSERT INTO events (
        organizer_id, title, description, category, event_type, venue_name, city, address,
        event_date, banner_image_url, ticket_price_fcfa, vip_ticket_price_fcfa, total_capacity,
        invited_guests, revenue_splits
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      creatorId,
      title,
      description || '',
      category || 'Concert',
      event_type || 'Concert Live Rumba',
      venue_name,
      city || 'Brazzaville',
      address || '',
      event_date,
      banner_image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
      ticket_price_fcfa,
      vip_ticket_price_fcfa || null,
      total_capacity,
      JSON.stringify(invited_guests || []),
      JSON.stringify(revenue_splits || [])
    ]);

    const createdEvent = result.rows[0];

    // 2. Enregistrement des collaborateurs et % de partages (Revenue Splits)
    if (revenue_splits && Array.isArray(revenue_splits)) {
      for (const split of revenue_splits) {
        if (split.name && split.split_percentage) {
          await query(`
            INSERT INTO event_collaborators (event_id, name, role, phone_number, split_percentage)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            createdEvent.id,
            split.name,
            split.role || 'Collaborateur',
            split.phone_number || '+242060000000',
            parseFloat(split.split_percentage)
          ]);
        }
      }
    }

    return res.status(201).json({
      message: 'Événement et contrat de partage des revenus créés avec succès !',
      event: createdEvent
    });
  } catch (error: any) {
    console.error('Erreur création événement :', error);
    return res.status(500).json({ error: 'Erreur lors de la création de l\'événement', details: error.message });
  }
});

// ACHAT D'UN BILLET : réservation de place + paiement Mobile Money réel.
router.post('/buy-ticket', async (req: Request, res: Response) => {
  const idempotencyKey = String(
    req.get('Idempotency-Key') || req.body?.idempotency_key || crypto.randomUUID()
  ).trim();

  try {
    const { event_id, buyer_name, buyer_phone, ticket_type } = req.body;
    if (!event_id || !buyer_name || !buyer_phone) {
      return res.status(400).json({ error: 'Nom, numéro de téléphone et événement sont obligatoires.' });
    }

    const existing = await query(`
      SELECT t.*, tx.status AS payment_status, tx.id AS transaction_id
      FROM tickets t
      LEFT JOIN transactions tx ON tx.id = t.payment_transaction_id
      WHERE t.purchase_idempotency_key = $1
      LIMIT 1
    `, [idempotencyKey]);

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.status === 'VALID' || row.status === 'USED') {
        const ticket = await withTransaction(async client => serializeTicket(client, row.id));
        return res.status(200).json({
          success: true,
          payment_status: 'SUCCESS',
          ticket,
          instructions: `Billet confirmé pour ${buyer_phone}.`
        });
      }
      if (row.payment_status === 'PENDING' || row.status === 'PENDING_PAYMENT') {
        return res.status(202).json({
          success: true,
          payment_status: 'PENDING',
          transaction_id: row.transaction_id,
          idempotency_key: idempotencyKey,
          message: 'Paiement en attente de confirmation Mobile Money.'
        });
      }
      return res.status(409).json({
        success: false,
        payment_status: row.payment_status || 'FAILED',
        idempotency_key: idempotencyKey,
        error: 'Cette tentative de paiement a échoué. Utilisez une nouvelle clé d’idempotence pour recommencer.'
      });
    }

    const normalizedTicketType = String(ticket_type || 'STANDARD').toUpperCase() === 'VIP' ? 'VIP' : 'STANDARD';
    const normalizedOperator = String(buyer_phone).replace(/\s+/g, '').startsWith('+24205') ? 'AIRTEL' : 'MTN';

    const reservation = await withTransaction(async client => {
      const eventRes = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [event_id]);
      if (eventRes.rows.length === 0) {
        throw Object.assign(new Error('Événement non trouvé.'), { statusCode: 404 });
      }
      const event = eventRes.rows[0];
      const sold = Number(event.tickets_sold || 0);
      const reserved = Number(event.tickets_reserved || 0);
      const capacity = Number(event.total_capacity || 0);

      if (sold + reserved >= capacity) {
        throw Object.assign(new Error('Complet ! Toutes les places sont déjà vendues ou réservées.'), { statusCode: 409 });
      }

      const isVip = normalizedTicketType === 'VIP' && event.vip_ticket_price_fcfa != null;
      const price = Number(isVip ? event.vip_ticket_price_fcfa : event.ticket_price_fcfa);
      if (!Number.isFinite(price) || price <= 0) {
        throw Object.assign(new Error('Tarif de billet invalide.'), { statusCode: 500 });
      }

      const qrCodeHash = `TKT-CG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
      const localReference = `TKT-PENDING-${crypto.randomUUID()}`;

      const ticketRes = await client.query(`
        INSERT INTO tickets (
          event_id, buyer_name, buyer_phone, ticket_type, price_paid_fcfa,
          qr_code_hash, purchase_idempotency_key, payment_expires_at, status, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP + INTERVAL '15 minutes', 'PENDING_PAYMENT', $8)
        RETURNING *
      `, [
        event.id,
        buyer_name,
        buyer_phone,
        normalizedTicketType,
        price,
        qrCodeHash,
        idempotencyKey,
        JSON.stringify({ payment_method: 'MOBILE_MONEY' })
      ]);

      const metadata = {
        reconcilable: true,
        ticket_id: ticketRes.rows[0].id,
        event_id: event.id,
        buyer_name,
        buyer_phone,
        operator: normalizedOperator,
        ticket_type: normalizedTicketType,
        description: `Moyo Culture - Billet ${event.title}`,
        payment_method: 'MOBILE_MONEY',
      };

      const txRes = await client.query(`
        INSERT INTO transactions (
          user_id, transaction_type, amount_fcfa, payment_method, phone_used,
          external_reference, idempotency_key, status, metadata
        )
        VALUES (NULL, 'ticket_purchase', $1, $2, $3, $4, $5, 'PENDING', $6)
        RETURNING *
      `, [
        price,
        normalizedOperator === 'MTN' ? 'MTN_MOMO' : 'AIRTEL_MONEY',
        buyer_phone,
        localReference,
        idempotencyKey,
        JSON.stringify(metadata)
      ]);

      await client.query(`
        UPDATE tickets SET payment_transaction_id = $1 WHERE id = $2
      `, [txRes.rows[0].id, ticketRes.rows[0].id]);

      await client.query(`
        UPDATE events
        SET tickets_reserved = COALESCE(tickets_reserved, 0) + 1
        WHERE id = $1
      `, [event.id]);

      return { event, ticket: ticketRes.rows[0], transaction: txRes.rows[0], price, metadata, localReference };
    });

    const provider = await kibangouPay.createDeposit({
      amount: reservation.price,
      currency: 'XAF',
      countryCode: 'CG',
      paymentMethod: 'MOBILE_MONEY',
      operator: normalizedOperator,
      customerName: buyer_name,
      customerMobile: buyer_phone,
      description: reservation.metadata.description,
      idempotencyKey,
      metadata: {
        ...reservation.metadata,
        transaction_id: reservation.transaction.id,
      },
    });

    const providerResult: any = provider;
    const providerReference = providerResult.transaction_id || providerResult.transactionId || providerResult.id || null;

    await query(`
      UPDATE transactions
      SET external_reference = COALESCE($1, external_reference),
          metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE id = $3
    `, [providerReference, JSON.stringify({ provider_reference: providerReference, provider_status: provider.status }), reservation.transaction.id]);

    const providerStatus = String(provider.status || 'UNKNOWN').toUpperCase();
    if (provider.success === false && ['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(providerStatus)) {
      const tx = await withTransaction(async client => finalizeTransactionFailure(
        client,
        reservation.transaction.id,
        provider.message || 'Paiement refusé par le prestataire.',
        provider,
      ));
      return res.status(502).json({
        success: false,
        payment_status: 'FAILED',
        transaction: tx,
        idempotency_key: idempotencyKey,
        error: 'Le paiement a été refusé. La réservation de place a été libérée.'
      });
    }

    if (['SUCCESS', 'COMPLETED'].includes(providerStatus)) {
      const tx = await withTransaction(async client => finalizeTransactionSuccess(
        client,
        reservation.transaction.id,
        provider.amount != null ? Number(provider.amount) : reservation.price,
        provider,
      ));
      const ticket = await withTransaction(async client => serializeTicket(client, reservation.ticket.id));
      return res.status(201).json({
        success: true,
        payment_status: 'SUCCESS',
        transaction: tx,
        ticket,
        instructions: `Billet confirmé. Présentez le QR Code à l'entrée de ${reservation.event.venue_name}.`
      });
    }

    return res.status(202).json({
      success: true,
      payment_status: 'PENDING',
      transaction_id: reservation.transaction.id,
      idempotency_key: idempotencyKey,
      provider: {
        status: provider.status,
        transaction_id: providerReference,
        message: provider.message,
      },
      message: 'La demande de paiement a été envoyée. Le billet sera émis automatiquement après confirmation.'
    });
  } catch (error: any) {
    console.error('Erreur achat billet :', error);
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).json({
      error: statusCode === 500 ? 'Erreur lors de la préparation du paiement du billet' : error.message,
      details: statusCode === 500 ? error.message : undefined,
    });
  }
});

// VÉRIFICATION D'UNE COMMANDE DE BILLET EN COURS (clé d'idempotence + téléphone)
router.get('/purchase-status', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = String(req.query.key || '').trim();
    const phone = String(req.query.phone || '').replace(/\s+/g, '');
    if (!idempotencyKey || !phone) {
      return res.status(400).json({ error: 'Clé de commande et numéro de téléphone requis.' });
    }

    const result = await query(`
      SELECT t.id, t.status AS ticket_status, t.buyer_name, t.buyer_phone,
             tx.id AS transaction_id, tx.status AS payment_status, tx.amount_fcfa,
             tx.external_reference, tx.metadata
      FROM tickets t
      LEFT JOIN transactions tx ON tx.id = t.payment_transaction_id
      WHERE t.purchase_idempotency_key = $1
        AND regexp_replace(t.buyer_phone, '\\s+', '', 'g') = $2
      LIMIT 1
    `, [idempotencyKey, phone]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    const row = result.rows[0];
    if (row.ticket_status === 'VALID' || row.ticket_status === 'USED') {
      const ticket = await withTransaction(async client => serializeTicket(client, row.id));
      return res.json({ payment_status: 'SUCCESS', ticket, transaction_id: row.transaction_id });
    }

    return res.json({
      payment_status: row.payment_status || row.ticket_status,
      transaction_id: row.transaction_id,
      amount_fcfa: row.amount_fcfa,
      message: row.payment_status === 'FAILED' ? 'Le paiement a échoué.' : 'Paiement encore en attente.'
    });
  } catch (error: any) {
    console.error('Erreur status billet :', error);
    return res.status(500).json({ error: 'Erreur lors de la vérification du paiement du billet' });
  }
});

// SCANNER ANTI-FRAUDE DU BILLET À L'ENTRÉE (Organisateur ou Admin uniquement)
router.post('/scan-ticket', authenticateToken, requireRole(['organizer']), async (req: AuthRequest, res: Response) => {
  try {
    const { qr_code_hash } = req.body;
    const scannerUserId = req.user?.id;

    if (!qr_code_hash) {
      return res.status(400).json({ error: 'Code du billet manquant' });
    }

    // Une seule opération atomique décide qui gagne le droit d'utiliser le billet.
    const updateRes = await query(`
      UPDATE tickets t
      SET status = 'USED', scanned_at = CURRENT_TIMESTAMP, scanned_by = $1
      FROM events e
      WHERE t.event_id = e.id
        AND t.qr_code_hash = $2
        AND t.status = 'VALID'
      RETURNING t.*, e.title as event_title, e.venue_name, e.event_date
    `, [scannerUserId || null, qr_code_hash]);

    if (updateRes.rows.length === 1) {
      return res.json({
        valid: true,
        message: '✅ ENTRÉE AUTORISÉE ! Billet validé avec succès.',
        ticket: updateRes.rows[0]
      });
    }

    const ticketRes = await query(`
      SELECT t.*, e.title as event_title, e.venue_name, e.event_date
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.qr_code_hash = $1
    `, [qr_code_hash]);

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'BILLET INVALIDE / FAUX (Non trouvé dans le système)' });
    }

    const ticket = ticketRes.rows[0];
    if (ticket.status === 'USED') {
      return res.status(409).json({
        valid: false,
        warning: '⚠️ ATTENTION : Billet DÉJÀ UTILISÉ !',
        scanned_at: ticket.scanned_at,
        ticket
      });
    }

    return res.status(409).json({ valid: false, error: 'Le billet ne peut pas être validé dans son état actuel.', ticket });
  } catch (error: any) {
    console.error('Erreur lors du scan du billet :', error);
    return res.status(500).json({ error: 'Erreur lors du scan du billet' });
  }
});

export default router;
