import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../../database/db';
import { authenticateToken, AuthRequest, requireRole } from '../auth/auth.middleware';
import { kibangouPay } from './kibangoupay.service';
import { finalizeTransactionFailure, finalizeTransactionSuccess } from './payment-lifecycle.service';
import { reconcilePendingTransactions } from './reconciliation.service';

const router = Router();

function safeEqualHex(a: string, b: string): boolean {
  const aa = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function verifyKibangouPaySignature(req: Request): boolean {
  const secret = process.env.KIBANGOUPAY_WEBHOOK_SECRET || '';
  if (!secret) return process.env.NODE_ENV !== 'production' && process.env.KIBANGOUPAY_MOCK_MODE === 'true';

  const signature = String(req.get('x-kibangoupay-signature') || '').trim();
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!signature || !rawBody) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const candidate = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  return safeEqualHex(candidate, expected);
}

function webhookEventKey(req: Request) {
  const body: any = req.body || {};
  const explicit = body.eventId || body.event_id || body.id;
  if (explicit) return `provider:${explicit}`;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  return `hash:${crypto.createHash('sha256').update(rawBody || Buffer.from(JSON.stringify(body))).digest('hex')}`;
}

function extractProviderAmount(body: any): number | undefined {
  const raw = body?.amount ?? body?.data?.amount;
  if (raw == null) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

// INITIALISER UN PAIEMENT CLIENT : transaction locale PENDING -> prestataire -> confirmation réelle.
router.post('/initiate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { amount_fcfa, phone_number, operator, transaction_type, customer_name, metadata } = req.body;

    if (!userId || !amount_fcfa || !phone_number || !operator || !transaction_type) {
      return res.status(400).json({ error: 'Montant, numéro de téléphone, opérateur et type de transaction sont requis.' });
    }

    const amount = Number(amount_fcfa);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Le montant doit être supérieur à 0.' });
    }

    const allowedTypes = new Set([
      'distribution_payment', 'service_payment', 'ticket_purchase',
      'art_purchase', 'royalty_credit', 'wallet_topup'
    ]);
    if (!allowedTypes.has(String(transaction_type))) {
      return res.status(400).json({ error: 'Type de transaction non autorisé.' });
    }

    const idempotencyKey = String(
      req.get('Idempotency-Key') || req.body?.idempotency_key || crypto.randomUUID()
    ).trim();

    const existing = await query(
      'SELECT * FROM transactions WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1',
      [userId, idempotencyKey]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({
        success: existing.rows[0].status !== 'FAILED',
        transaction: existing.rows[0],
        message: 'Cette opération a déjà été enregistrée.'
      });
    }

    const localReference = `PAY-PENDING-${crypto.randomUUID()}`;
    const reconcilableMetadata = {
      ...(metadata || {}),
      reconcilable: true,
      operator: String(operator).toUpperCase().includes('MTN') ? 'MTN' : 'AIRTEL',
      customer_name: customer_name || 'Client Moyo Culture',
      description: `Moyo Culture - Paiement ${transaction_type} (${amount} FCFA)`,
      payment_method: 'MOBILE_MONEY',
    };

    const txRes = await query(`
      INSERT INTO transactions (
        user_id, transaction_type, amount_fcfa, payment_method, phone_used,
        external_reference, idempotency_key, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
      RETURNING *
    `, [
      userId,
      transaction_type,
      amount,
      String(operator).toUpperCase().includes('MTN') ? 'MTN_MOMO' : 'AIRTEL_MONEY',
      phone_number,
      localReference,
      idempotencyKey,
      JSON.stringify(reconcilableMetadata),
    ]);

    const transaction = txRes.rows[0];

    const kbpResult = await kibangouPay.createDeposit({
      amount,
      currency: 'XAF',
      countryCode: 'CG',
      paymentMethod: 'MOBILE_MONEY',
      operator: reconcilableMetadata.operator,
      customerName: reconcilableMetadata.customer_name,
      customerMobile: phone_number,
      description: reconcilableMetadata.description,
      idempotencyKey,
      metadata: { user_id: userId, transaction_id: transaction.id, ...reconcilableMetadata },
    });

    const providerResult: any = kbpResult;
    const providerReference = providerResult.transaction_id || providerResult.transactionId || providerResult.id || null;
    await query(`
      UPDATE transactions
      SET external_reference = COALESCE($1, external_reference),
          metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE id = $3
    `, [providerReference, JSON.stringify({ provider_reference: providerReference, provider_status: kbpResult.status }), transaction.id]);

    const providerStatus = String(kbpResult.status || 'UNKNOWN').toUpperCase();
    if (['SUCCESS', 'COMPLETED'].includes(providerStatus) && kbpResult.success !== false) {
      const successTx = await withTransaction(async client => finalizeTransactionSuccess(
        client,
        transaction.id,
        kbpResult.amount != null ? Number(kbpResult.amount) : amount,
        kbpResult,
      ));
      return res.status(200).json({ success: true, transaction: successTx, kibangoupay: kbpResult });
    }

    if (['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(providerStatus)) {
      const failedTx = await withTransaction(async client => finalizeTransactionFailure(
        client,
        transaction.id,
        kbpResult.message || 'Paiement refusé par le prestataire.',
        kbpResult,
      ));
      return res.status(502).json({ success: false, transaction: failedTx, kibangoupay: kbpResult });
    }

    return res.status(202).json({
      success: true,
      transaction: (await query('SELECT * FROM transactions WHERE id = $1', [transaction.id])).rows[0],
      kibangoupay: kbpResult,
      message: 'Paiement envoyé et en attente de confirmation.'
    });
  } catch (error: any) {
    console.error('Erreur initiation paiement KibangouPay :', error);
    return res.status(500).json({ error: 'Erreur lors de l\'initiation du paiement via KibangouPay', details: error.message });
  }
});

// WEBHOOK KIBANGOUPAY : signature + anti-rejeu + contrôle du montant + application idempotente.
router.post('/webhook/kibangoupay', async (req: Request, res: Response) => {
  try {
    if (!verifyKibangouPaySignature(req)) {
      return res.status(401).json({ error: 'Signature webhook invalide.' });
    }

    const body = req.body || {};
    const transactionId = body.transactionId || body.transaction_id || body.data?.transactionId || body.data?.transaction_id;
    const normalizedStatus = String(body.status || body.data?.status || '').toUpperCase();
    const amount = extractProviderAmount(body);
    const metadata = body.metadata || body.data?.metadata || {};

    if (!transactionId || !normalizedStatus) {
      return res.status(400).json({ error: 'transactionId et status sont requis.' });
    }

    const txLookup = await query(`
      SELECT * FROM transactions
      WHERE external_reference = $1
         OR metadata->>'provider_reference' = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [transactionId]);

    if (txLookup.rows.length === 0) {
      // Ne pas déclarer le webhook traité : le prestataire peut réessayer après que
      // l'initiation locale ait enregistré sa référence externe.
      return res.status(202).json({ status: 'RETRY', processed: false, message: 'Transaction locale pas encore visible.' });
    }

    const eventKey = webhookEventKey(req);
    const outcome = await withTransaction(async client => {
      const eventInsert = await client.query(`
        INSERT INTO payment_webhook_events (event_key, provider_event_id, transaction_id, status, amount_fcfa, payload)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (event_key) DO NOTHING
        RETURNING id
      `, [eventKey, body.eventId || body.event_id || null, txLookup.rows[0].id, normalizedStatus, amount ?? null, JSON.stringify(body)]);

      if (eventInsert.rows.length === 0) return { duplicate: true };

      if (['SUCCESS', 'COMPLETED', 'PAID', 'DONE'].includes(normalizedStatus)) {
        await finalizeTransactionSuccess(client, txLookup.rows[0].id, amount, { status: normalizedStatus, amount, metadata, transactionId, raw: body });
      } else if (['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'DECLINED'].includes(normalizedStatus)) {
        await finalizeTransactionFailure(client, txLookup.rows[0].id, body.message || `Statut prestataire : ${normalizedStatus}`, { status: normalizedStatus, amount, metadata, transactionId, raw: body });
      } else {
        await client.query(`
          UPDATE transactions
          SET provider_last_checked_at = CURRENT_TIMESTAMP,
              metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb
          WHERE id = $2 AND status = 'PENDING'
        `, [JSON.stringify({ last_provider_status: normalizedStatus, webhook_status_at: new Date().toISOString() }), txLookup.rows[0].id]);
      }

      return { duplicate: false };
    });

    if (outcome.duplicate) {
      return res.json({ status: 'OK', processed: true, duplicate: true });
    }

    return res.json({ status: 'OK', processed: true });
  } catch (error: any) {
    console.error('Erreur webhook KibangouPay :', error);
    return res.status(500).json({ error: 'Erreur webhook KibangouPay', details: error.message });
  }
});

// RÉCONCILIATION MANUELLE — réservée aux administrateurs.
router.post('/reconcile', authenticateToken, requireRole(['admin']), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await reconcilePendingTransactions(100);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Erreur réconciliation manuelle:', error);
    return res.status(500).json({ error: 'Erreur lors de la réconciliation des paiements', details: error.message });
  }
});

export default router;
