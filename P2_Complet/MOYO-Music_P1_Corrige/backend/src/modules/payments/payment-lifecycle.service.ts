import type { PoolClient } from 'pg';
import { completeTicketPurchase, failTicketPurchase } from '../ticketing/ticketing.service';

function mergeMetadata(current: any, patch: any) {
  return { ...(current || {}), ...(patch || {}) };
}

export async function finalizeTransactionSuccess(
  client: PoolClient,
  transactionId: string,
  providerAmount?: number,
  providerPayload?: any,
) {
  const txRes = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [transactionId]);
  if (txRes.rows.length === 0) throw new Error('Transaction introuvable.');
  const tx = txRes.rows[0];

  if (providerAmount != null && Math.abs(Number(tx.amount_fcfa) - Number(providerAmount)) > 0.01) {
    throw Object.assign(new Error('Montant du paiement différent du montant attendu.'), { statusCode: 409 });
  }

  if (tx.status === 'SUCCESS') return tx;
  if (tx.status === 'FAILED') return tx;

  let metadata = mergeMetadata(tx.metadata, {
    provider_status: providerPayload?.status || 'SUCCESS',
    provider_amount: providerAmount ?? tx.amount_fcfa,
    processed_at: new Date().toISOString(),
  });

  await client.query(`
    UPDATE transactions
    SET status = 'SUCCESS',
        processed_at = CURRENT_TIMESTAMP,
        provider_last_checked_at = CURRENT_TIMESTAMP,
        metadata = $1::jsonb
    WHERE id = $2
  `, [JSON.stringify(metadata), transactionId]);

  if (tx.transaction_type === 'payout_withdrawal') {
    // Le solde a déjà été réservé à l'ouverture du retrait.
  } else if (tx.transaction_type === 'ticket_purchase') {
    await completeTicketPurchase(client, transactionId, providerAmount, providerPayload);
  } else if (metadata.credit_wallet === true && metadata.wallet_credited !== true) {
    await client.query(`
      UPDATE users
      SET wallet_balance_fcfa = wallet_balance_fcfa + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [Number(tx.amount_fcfa), tx.user_id]);

    metadata = { ...metadata, wallet_credited: true };
    await client.query(`
      UPDATE transactions SET metadata = $1::jsonb WHERE id = $2
    `, [JSON.stringify(metadata), transactionId]);
  }

  const fresh = await client.query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
  return fresh.rows[0];
}

export async function finalizeTransactionFailure(
  client: PoolClient,
  transactionId: string,
  reason: string,
  providerPayload?: any,
) {
  const txRes = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [transactionId]);
  if (txRes.rows.length === 0) throw new Error('Transaction introuvable.');
  const tx = txRes.rows[0];

  if (tx.status === 'FAILED') return tx;
  if (tx.status === 'SUCCESS') return tx;

  let metadata = mergeMetadata(tx.metadata, {
    failure_reason: reason,
    provider_status: providerPayload?.status || 'FAILED',
    processed_at: new Date().toISOString(),
  });

  if (tx.transaction_type === 'payout_withdrawal' && metadata.funds_released !== true) {
    await client.query(`
      UPDATE users
      SET wallet_balance_fcfa = wallet_balance_fcfa + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [Number(tx.amount_fcfa), tx.user_id]);
    metadata = { ...metadata, funds_released: true };
  }

  if (tx.transaction_type === 'ticket_purchase') {
    await failTicketPurchase(client, transactionId, reason, providerPayload);
  }

  await client.query(`
    UPDATE transactions
    SET status = 'FAILED',
        processed_at = CURRENT_TIMESTAMP,
        provider_last_checked_at = CURRENT_TIMESTAMP,
        metadata = $1::jsonb
    WHERE id = $2
  `, [JSON.stringify(metadata), transactionId]);

  const fresh = await client.query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
  return fresh.rows[0];
}
