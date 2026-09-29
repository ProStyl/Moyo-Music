import QRCode from 'qrcode';
import type { PoolClient } from 'pg';

export async function completeTicketPurchase(
  client: PoolClient,
  transactionId: string,
  providerAmount?: number,
  providerPayload?: any,
) {
  const txRes = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [transactionId]);
  if (txRes.rows.length === 0) throw new Error('Transaction de billet introuvable.');
  const tx = txRes.rows[0];

  if (providerAmount != null && Math.abs(Number(tx.amount_fcfa) - Number(providerAmount)) > 0.01) {
    throw Object.assign(new Error('Montant du paiement différent du montant attendu.'), { statusCode: 409 });
  }

  const ticketRes = await client.query(`
    SELECT t.*, e.title AS event_title, e.venue_name, e.event_date
    FROM tickets t
    JOIN events e ON e.id = t.event_id
    WHERE t.payment_transaction_id = $1
    FOR UPDATE OF t, e
  `, [transactionId]);

  if (ticketRes.rows.length === 0) {
    throw new Error('Billet associé à la transaction introuvable.');
  }

  const ticket = ticketRes.rows[0];
  if (ticket.status === 'VALID' || ticket.status === 'USED') {
    return ticket;
  }
  if (ticket.status !== 'PENDING_PAYMENT') {
    throw Object.assign(new Error(`Billet dans un état incompatible : ${ticket.status}.`), { statusCode: 409 });
  }

  await client.query(`
    UPDATE events
    SET tickets_reserved = GREATEST(0, COALESCE(tickets_reserved, 0) - 1),
        tickets_sold = COALESCE(tickets_sold, 0) + 1
    WHERE id = $1
  `, [ticket.event_id]);

  const updated = await client.query(`
    UPDATE tickets
    SET status = 'VALID',
        paid_at = CURRENT_TIMESTAMP,
        payment_expires_at = NULL,
        metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
    WHERE id = $1
    RETURNING *
  `, [ticket.id, JSON.stringify({ payment_confirmed: true, provider: providerPayload || {} })]);

  return { ...ticket, ...updated.rows[0] };
}

export async function failTicketPurchase(
  client: PoolClient,
  transactionId: string,
  reason: string,
  providerPayload?: any,
) {
  const ticketRes = await client.query(`
    SELECT * FROM tickets
    WHERE payment_transaction_id = $1
    FOR UPDATE
  `, [transactionId]);

  if (ticketRes.rows.length === 0) return null;
  const ticket = ticketRes.rows[0];

  if (ticket.status === 'PENDING_PAYMENT') {
    await client.query(`
      UPDATE events
      SET tickets_reserved = GREATEST(0, COALESCE(tickets_reserved, 0) - 1)
      WHERE id = $1
    `, [ticket.event_id]);

    const updated = await client.query(`
      UPDATE tickets
      SET status = 'CANCELLED',
          payment_expires_at = NULL,
          metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE id = $1
      RETURNING *
    `, [ticket.id, JSON.stringify({ payment_failed: true, failure_reason: reason, provider: providerPayload || {} })]);

    return updated.rows[0];
  }

  return ticket;
}

export async function serializeTicket(client: PoolClient, ticketId: string) {
  const result = await client.query(`
    SELECT t.*, e.title AS event_title, e.venue_name, e.event_date
    FROM tickets t
    JOIN events e ON e.id = t.event_id
    WHERE t.id = $1
  `, [ticketId]);

  if (result.rows.length === 0) return null;
  const ticket = result.rows[0];
  const qrPayload = JSON.stringify({
    t: ticket.qr_code_hash,
    e: ticket.event_id,
    b: ticket.buyer_phone,
    n: ticket.buyer_name,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#1e1b4b', light: '#ffffff' },
  });

  return {
    ...ticket,
    venue: ticket.venue_name,
    date: ticket.event_date,
    qr_code_image: qrCodeDataUrl,
  };
}
