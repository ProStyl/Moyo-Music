import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../../database/db';
import { authenticateToken, AuthRequest } from '../auth/auth.middleware';
import { kibangouPay } from './kibangoupay.service';

const router = Router();

function safeEqualHex(a: string, b: string): boolean {
  const aa = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function verifyKibangouPaySignature(req: Request): boolean {
  const secret = process.env.KIBANGOUPAY_WEBHOOK_SECRET || '';
  if (!secret) {
    return process.env.KIBANGOUPAY_MOCK_MODE === 'true';
  }

  const signature = String(req.get('x-kibangoupay-signature') || '').trim();
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!signature || !rawBody) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const candidate = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  return safeEqualHex(candidate, expected);
}

// 1. INITIALISER UN PAIEMENT MOBILE MONEY VIA KIBANGOUPAY
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

    const kbpResult = await kibangouPay.createDeposit({
      amount,
      currency: 'XAF',
      countryCode: 'CG',
      paymentMethod: 'MOBILE_MONEY',
      operator: operator.toUpperCase().includes('MTN') ? 'MTN' : 'AIRTEL',
      customerName: customer_name || 'Client Moyo Culture',
      customerMobile: phone_number,
      description: `Moyo Culture - Paiement ${transaction_type} (${amount} FCFA)`,
      idempotencyKey,
      metadata: { user_id: userId, transaction_type, ...(metadata || {}) },
    });

    const status = kbpResult.success === false
      ? 'FAILED'
      : (String(kbpResult.status || 'PENDING').toUpperCase() === 'SUCCESS' ? 'SUCCESS' : 'PENDING');

    const txRes = await query(`
      INSERT INTO transactions (
        user_id, transaction_type, amount_fcfa, payment_method, phone_used,
        external_reference, idempotency_key, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      userId,
      transaction_type,
      amount,
      operator.toUpperCase().includes('MTN') ? 'MTN_MOMO' : 'AIRTEL_MONEY',
      phone_number,
      kbpResult.transaction_id || null,
      idempotencyKey,
      status,
      JSON.stringify({ ...(metadata || {}), provider_response: kbpResult })
    ]);

    return res.status(status === 'FAILED' ? 502 : status === 'PENDING' ? 202 : 200).json({
      success: status !== 'FAILED',
      message: kbpResult.message,
      transaction: txRes.rows[0],
      kibangoupay: kbpResult,
    });
  } catch (error: any) {
    console.error('Erreur initiation paiement KibangouPay :', error);
    return res.status(500).json({ error: 'Erreur lors de l\'initiation du paiement via KibangouPay', details: error.message });
  }
});

// 2. WEBHOOK OFFICIEL DE NOTIFICATION KIBANGOUPAY
router.post('/webhook/kibangoupay', async (req: Request, res: Response) => {
  try {
    if (!verifyKibangouPaySignature(req)) {
      return res.status(401).json({ error: 'Signature webhook invalide.' });
    }

    const { transactionId, status, amount, metadata } = req.body;
    if (!transactionId || !status) {
      return res.status(400).json({ error: 'transactionId et status sont requis.' });
    }

    const normalizedStatus = String(status).toUpperCase();
    const successStatus = ['SUCCESS', 'COMPLETED'].includes(normalizedStatus);
    const failureStatus = ['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(normalizedStatus);

    if (successStatus) {
      await withTransaction(async (client) => {
        const txRes = await client.query(`
          SELECT * FROM transactions
          WHERE external_reference = $1
          FOR UPDATE
        `, [transactionId]);

        if (txRes.rows.length === 0) return;
        const tx = txRes.rows[0];
        if (tx.status !== 'PENDING') return;

        await client.query(
          `UPDATE transactions SET status = 'SUCCESS', metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
          [JSON.stringify({ webhook_status: normalizedStatus, webhook_amount: amount, webhook_metadata: metadata || {} }), tx.id]
        );

        // Les crédits de wallet ne sont ajoutés qu'une seule fois après confirmation réelle.
        if (metadata?.credit_wallet && tx.transaction_type !== 'payout_withdrawal') {
          await client.query(
            `UPDATE users SET wallet_balance_fcfa = wallet_balance_fcfa + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [Number(amount), tx.user_id]
          );
        }
      });
    } else if (failureStatus) {
      await withTransaction(async (client) => {
        const txRes = await client.query(`
          SELECT * FROM transactions
          WHERE external_reference = $1
          FOR UPDATE
        `, [transactionId]);

        if (txRes.rows.length === 0) return;
        const tx = txRes.rows[0];
        if (tx.status !== 'PENDING') return;

        if (tx.transaction_type === 'payout_withdrawal') {
          await client.query(
            `UPDATE users SET wallet_balance_fcfa = wallet_balance_fcfa + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [Number(tx.amount_fcfa), tx.user_id]
          );
        }

        await client.query(
          `UPDATE transactions SET status = 'FAILED', metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
          [JSON.stringify({ webhook_status: normalizedStatus, webhook_amount: amount, webhook_metadata: metadata || {} }), tx.id]
        );
      });
    }

    return res.json({ status: 'OK', processed: true });
  } catch (error: any) {
    console.error('Erreur webhook KibangouPay :', error);
    return res.status(500).json({ error: 'Erreur webhook KibangouPay', details: error.message });
  }
});

export default router;
