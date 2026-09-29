import { Router, Response } from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../../database/db';
import { authenticateToken, AuthRequest } from '../auth/auth.middleware';
import { kibangouPay } from '../payments/kibangoupay.service';
import { finalizeTransactionFailure, finalizeTransactionSuccess } from '../payments/payment-lifecycle.service';

const router = Router();

// OBTENIR LE SOLDE ET L'HISTORIQUE DU WALLET
router.get('/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const userRes = await query(
      'SELECT wallet_balance_fcfa, momo_number, airtel_number FROM users WHERE id = $1',
      [userId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const txRes = await query(`
      SELECT * FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId]);

    return res.json({
      balance_fcfa: userRes.rows[0].wallet_balance_fcfa,
      momo_number: userRes.rows[0].momo_number,
      airtel_number: userRes.rows[0].airtel_number,
      recent_transactions: txRes.rows
    });
  } catch (error: any) {
    console.error('Erreur wallet summary:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du portefeuille' });
  }
});

// DEMANDE DE RETRAIT : réservation atomique du solde + paiement externe idempotent.
router.post('/withdraw', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    const { amount_fcfa, phone_number, operator } = req.body;
    const amount = Number(amount_fcfa);
    const normalizedOperator = String(operator || '').toUpperCase().includes('MTN') ? 'MTN' : 'AIRTEL';
    const idempotencyKey = String(
      req.get('Idempotency-Key') || req.body?.idempotency_key || crypto.randomUUID()
    ).trim();

    if (!Number.isFinite(amount) || amount < 2000) {
      return res.status(400).json({ error: 'Le montant minimum de retrait est de 2 000 FCFA.' });
    }

    if (!phone_number) {
      return res.status(400).json({ error: 'Le numéro Mobile Money est obligatoire.' });
    }

    // Rejouer une requête avec la même clé ne doit jamais créer un second retrait.
    const existing = await query(`
      SELECT * FROM transactions
      WHERE user_id = $1 AND idempotency_key = $2
      LIMIT 1
    `, [userId, idempotencyKey]);

    if (existing.rows.length > 0) {
      const tx = existing.rows[0];
      const balanceRes = await query('SELECT wallet_balance_fcfa FROM users WHERE id = $1', [userId]);
      const balance = Number(balanceRes.rows[0]?.wallet_balance_fcfa || 0);
      return res.status(tx.status === 'FAILED' ? 409 : 200).json({
        message: tx.status === 'SUCCESS'
          ? 'Ce retrait a déjà été traité.'
          : tx.status === 'PENDING'
            ? 'Ce retrait est déjà en cours de traitement.'
            : 'Ce retrait a échoué. Utilisez une nouvelle clé d’idempotence pour réessayer.',
        transaction: tx,
        new_balance_fcfa: balance,
        idempotency_key: idempotencyKey
      });
    }

    // Réservation atomique : aucun second retrait concurrent ne peut consommer le même solde.
    const reservation = await withTransaction(async (client) => {
      const userRes = await client.query(`
        SELECT full_name, artist_name, wallet_balance_fcfa
        FROM users
        WHERE id = $1
        FOR UPDATE
      `, [userId]);

      if (userRes.rows.length === 0) {
        throw Object.assign(new Error('Utilisateur introuvable.'), { statusCode: 404 });
      }

      const user = userRes.rows[0];
      const currentBalance = Number(user.wallet_balance_fcfa || 0);
      if (currentBalance < amount) {
        throw Object.assign(
          new Error(`Solde insuffisant. Vous avez actuellement ${currentBalance} FCFA.`),
          { statusCode: 400 }
        );
      }

      const balanceUpdate = await client.query(`
        UPDATE users
        SET wallet_balance_fcfa = wallet_balance_fcfa - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING wallet_balance_fcfa
      `, [amount, userId]);

      const beneficiary = user.artist_name || user.full_name || 'Artiste Moyo Culture';
      const localReference = `WD-PENDING-${crypto.randomUUID()}`;

      const txRes = await client.query(`
        INSERT INTO transactions (
          user_id, transaction_type, amount_fcfa, payment_method,
          phone_used, external_reference, idempotency_key, status, metadata
        ) VALUES ($1, 'payout_withdrawal', $2, $3, $4, $5, $6, 'PENDING', $7)
        RETURNING *
      `, [
        userId,
        amount,
        normalizedOperator === 'MTN' ? 'MTN_MOMO' : 'AIRTEL_MONEY',
        phone_number,
        localReference,
        idempotencyKey,
        JSON.stringify({
          withdrawal_stage: 'FUNDS_RESERVED',
          provider: 'KibangouPay',
          operator: normalizedOperator,
          beneficiary
        })
      ]);

      return {
        transaction: txRes.rows[0],
        beneficiary,
        localReference,
        reservedBalance: Number(balanceUpdate.rows[0].wallet_balance_fcfa)
      };
    });

    // Le réseau externe est appelé après le commit de la réservation pour ne pas garder
    // une transaction PostgreSQL ouverte pendant une requête HTTP.
    let kbpWithdrawal;
    try {
      kbpWithdrawal = await kibangouPay.createWithdrawal({
        amount,
        currency: 'XAF',
        countryCode: 'CG',
        paymentMethod: 'MOBILE_MONEY',
        operator: normalizedOperator,
        beneficiaryName: reservation.beneficiary,
        mobileNo: phone_number,
        remarks: `Retrait Royalties Moyo Culture (${amount} FCFA)`,
        idempotencyKey,
        metadata: { user_id: userId, transaction_id: reservation.transaction.id }
      });
    } catch (providerError: any) {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE users SET wallet_balance_fcfa = wallet_balance_fcfa + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [amount, userId]
        );
        await client.query(`
          UPDATE transactions
          SET status = 'FAILED',
              metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb
          WHERE id = $2 AND status = 'PENDING'
        `, [JSON.stringify({ failure_reason: providerError.message || 'Erreur passerelle' }), reservation.transaction.id]);
      });
      throw providerError;
    }

    const providerStatus = String(kbpWithdrawal.status || 'UNKNOWN').toUpperCase();
    const providerResult: any = kbpWithdrawal;
    const providerReference = providerResult.transaction_id || providerResult.transactionId || providerResult.id || null;

    await query(`
      UPDATE transactions
      SET external_reference = COALESCE($1, external_reference),
          metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE id = $3
    `, [providerReference, JSON.stringify({ provider_reference: providerReference, provider_status: providerStatus }), reservation.transaction.id]);

    if (['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'DECLINED'].includes(providerStatus)) {
      const finalTx = await withTransaction(async client => finalizeTransactionFailure(
        client,
        reservation.transaction.id,
        kbpWithdrawal.message || `Retrait refusé par le prestataire (${providerStatus}).`,
        kbpWithdrawal,
      ));
      return res.status(502).json({
        error: 'Le prestataire de paiement a refusé le retrait. Les fonds ont été recrédités.',
        transaction: finalTx,
        new_balance_fcfa: reservation.reservedBalance + amount,
        kibangoupay: kbpWithdrawal
      });
    }

    if (['SUCCESS', 'COMPLETED', 'PAID', 'DONE'].includes(providerStatus)) {
      const finalTx = await withTransaction(async client => finalizeTransactionSuccess(
        client,
        reservation.transaction.id,
        kbpWithdrawal.amount != null ? Number(kbpWithdrawal.amount) : amount,
        kbpWithdrawal,
      ));
      return res.status(200).json({
        message: kbpWithdrawal.message || `Retrait de ${amount} FCFA effectué avec succès.`,
        transaction: finalTx,
        kibangoupay: kbpWithdrawal,
        new_balance_fcfa: reservation.reservedBalance,
        idempotency_key: idempotencyKey
      });
    }

    const pendingTx = (await query('SELECT * FROM transactions WHERE id = $1', [reservation.transaction.id])).rows[0];
    return res.status(202).json({
      message: 'Retrait enregistré et en attente de confirmation du prestataire. La réconciliation automatique vérifiera son statut.',
      transaction: pendingTx,
      kibangoupay: kbpWithdrawal,
      new_balance_fcfa: reservation.reservedBalance,
      idempotency_key: idempotencyKey
    });
;
  } catch (error: any) {
    console.error('Erreur retrait wallet :', error);
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).json({
      error: statusCode === 500 ? 'Erreur lors du traitement du retrait' : error.message,
      details: statusCode === 500 ? error.message : undefined
    });
  }
});

export default router;
