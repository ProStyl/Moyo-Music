import { query, withTransaction } from '../../database/db';
import { kibangouPay } from './kibangoupay.service';
import { finalizeTransactionFailure, finalizeTransactionSuccess } from './payment-lifecycle.service';

const LOCK_ID = 83927411;

function isFinalSuccess(status: string) {
  return ['SUCCESS', 'COMPLETED', 'PAID', 'DONE'].includes(status);
}

function isFinalFailure(status: string) {
  return ['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'DECLINED'].includes(status);
}

async function retryProviderRequest(tx: any) {
  const metadata = tx.metadata || {};
  const operator = String(metadata.operator || '').toUpperCase().includes('MTN') ? 'MTN' : 'AIRTEL';

  if (tx.transaction_type === 'payout_withdrawal') {
    return kibangouPay.createWithdrawal({
      amount: Number(tx.amount_fcfa),
      currency: 'XAF',
      countryCode: 'CG',
      paymentMethod: 'MOBILE_MONEY',
      operator,
      beneficiaryName: metadata.beneficiary || metadata.beneficiaryName || 'Artiste Moyo Culture',
      mobileNo: tx.phone_used || metadata.phone_number || '',
      remarks: metadata.remarks || `Retrait Moyo Culture (${tx.amount_fcfa} FCFA)`,
      idempotencyKey: tx.idempotency_key,
      metadata,
    });
  }

  if (tx.transaction_type === 'ticket_purchase') {
    return kibangouPay.createDeposit({
      amount: Number(tx.amount_fcfa),
      currency: 'XAF',
      countryCode: 'CG',
      paymentMethod: 'MOBILE_MONEY',
      operator,
      customerName: metadata.buyer_name || 'Acheteur Moyo Culture',
      customerMobile: tx.phone_used || metadata.buyer_phone || '',
      description: metadata.description || `Moyo Culture - Billet (${tx.amount_fcfa} FCFA)`,
      idempotencyKey: tx.idempotency_key,
      metadata,
    });
  }

  if (metadata.reconcilable === true && tx.phone_used) {
    return kibangouPay.createDeposit({
      amount: Number(tx.amount_fcfa),
      currency: 'XAF',
      countryCode: 'CG',
      paymentMethod: metadata.payment_method === 'CARD' ? 'CARD' : 'MOBILE_MONEY',
      operator,
      customerName: metadata.customer_name || 'Client Moyo Culture',
      customerMobile: tx.phone_used,
      description: metadata.description || `Moyo Culture - ${tx.transaction_type}`,
      idempotencyKey: tx.idempotency_key,
      metadata,
    });
  }

  return null;
}

export async function reconcilePendingTransactions(limit = 50) {
  const lock = await query('SELECT pg_try_advisory_lock($1) AS locked', [LOCK_ID]);
  if (!lock.rows[0]?.locked) {
    return { skipped: true, processed: 0, succeeded: 0, failed: 0, pending: 0 };
  }

  try {
    const pending = await query(`
      SELECT *
      FROM transactions
      WHERE status = 'PENDING'
        AND (transaction_type IN ('payout_withdrawal', 'ticket_purchase') OR COALESCE(metadata->>'reconcilable', 'false') = 'true')
      ORDER BY created_at ASC
      LIMIT $1
    `, [limit]);

    let succeeded = 0;
    let failed = 0;
    let stillPending = 0;

    for (const tx of pending.rows) {
      try {
        const attempts = Number(tx.metadata?.reconciliation_attempts || 0) + 1;
        const checkedAt = new Date().toISOString();

        let provider: any = null;
        const reference = tx.external_reference;
        const localReference = typeof reference === 'string' && (reference.startsWith('WD-PENDING-') || reference.startsWith('TKT-PENDING-') || reference.startsWith('PAY-PENDING-'));

        if (reference && !localReference) {
          provider = await kibangouPay.getTransactionStatus(reference);
        }

        if (!provider || ['UNKNOWN', 'NOT_FOUND'].includes(String(provider.status || '').toUpperCase())) {
          provider = await retryProviderRequest(tx);
        }

        const providerStatus = String(provider?.status || 'UNKNOWN').toUpperCase();
        const providerAmount = provider?.amount != null ? Number(provider.amount) : undefined;
        const providerReference = provider?.transaction_id || provider?.transactionId || provider?.id || reference;

        await query(`
          UPDATE transactions
          SET provider_last_checked_at = CURRENT_TIMESTAMP,
              reconciliation_attempts = $1,
              external_reference = COALESCE($2, external_reference),
              metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb
          WHERE id = $4
        `, [
          attempts,
          providerReference,
          JSON.stringify({ last_reconciliation_at: checkedAt, last_provider_status: providerStatus }),
          tx.id,
        ]);

        if (isFinalSuccess(providerStatus)) {
          await withTransaction(async (client) => {
            await finalizeTransactionSuccess(client, tx.id, providerAmount, provider);
          });
          succeeded++;
        } else if (isFinalFailure(providerStatus)) {
          await withTransaction(async (client) => {
            await finalizeTransactionFailure(client, tx.id, provider?.message || `Statut prestataire : ${providerStatus}`, provider);
          });
          failed++;
        } else {
          stillPending++;
        }
      } catch (error: any) {
        console.error(`[Réconciliation] Transaction ${tx.id}:`, error.message);
        stillPending++;
      }
    }

    return {
      skipped: false,
      processed: pending.rows.length,
      succeeded,
      failed,
      pending: stillPending,
    };
  } finally {
    await query('SELECT pg_advisory_unlock($1)', [LOCK_ID]);
  }
}
