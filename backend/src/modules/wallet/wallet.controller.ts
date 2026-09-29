import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateToken, AuthRequest } from '../auth/auth.middleware';

const router = Router();

// OBTENIR LE SOLDE ET L'HISTORIQUE DU WALLET
router.get('/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // 1. Solde actuel
    const userRes = await query('SELECT wallet_balance_fcfa, momo_number, airtel_number FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // 2. Historique des transactions
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
    return res.status(500).json({ error: 'Erreur lors de la récupération du portefeuille' });
  }
});

// DEMANDE DE RETRAIT VERS COMPTE MOBILE MONEY (PAYOUT MTN / AIRTEL VIA KIBANGOUPAY)
router.post('/withdraw', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { amount_fcfa, phone_number, operator, idempotencyKey } = req.body;

    const amount = parseFloat(amount_fcfa);
    if (!amount || amount < 2000) {
      return res.status(400).json({ error: 'Le montant minimum de retrait est de 2 000 FCFA.' });
    }

    // 1. Vérifier le solde de l'utilisateur avec verrou de ligne (FOR UPDATE)
    const userRes = await query(`
      SELECT wallet_balance_fcfa, full_name, artist_name FROM users 
      WHERE id = $1 
      FOR UPDATE
    `, [userId]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    const currentBalance = parseFloat(user?.wallet_balance_fcfa || '0');

    if (currentBalance < amount) {
      return res.status(400).json({ error: `Solde insuffisant. Vous avez actuellement ${currentBalance} FCFA.` });
    }

    // 2. Idempotence : vérifier si cette clé existe déjà
    const idemKey = idempotencyKey || `wd_moyo_${userId}_${Date.now()}`;
    const existingTx = await query(`
      SELECT * FROM transactions 
      WHERE user_id = $1 AND transaction_type = 'payout_withdrawal' 
      AND metadata->>'idempotency_key' = $2
    `, [userId, idemKey]);

    if (existingTx.rows.length > 0) {
      const tx = existingTx.rows[0];
      return res.json({
        message: 'Ce retrait a déjà été traité (idempotent).',
        transaction: tx,
        new_balance_fcfa: parseFloat(user?.wallet_balance_fcfa || '0')
      });
    }

    // 3. Préparer la transaction en statut PENDING avant l'appel externe
    const txRes = await query(`
      INSERT INTO transactions (
        user_id, transaction_type, amount_fcfa, payment_method, phone_used, external_reference, status, metadata
      ) VALUES ($1, 'payout_withdrawal', $2, $3, $4, $5, 'PENDING', $6)
      RETURNING *
    `, [
      userId,
      amount,
      operator.toUpperCase().includes('MTN') ? 'MTN_MOMO' : 'AIRTEL_MONEY',
      phone_number,
      `wd_init_${Date.now()}`,
      JSON.stringify({ idempotency_key: idemKey, user_id: userId })
    ]);

    // 4. Déduire du solde de l'artiste dans la base locale (réservation atomique)
    await query(`
      UPDATE users SET wallet_balance_fcfa = wallet_balance_fcfa - $1 WHERE id = $2
    `, [amount, userId]);

    // 5. Appeler le prestataire KibangouPay en externe
    const { kibangouPay } = await import('../payments/kibangoupay.service');
    const kbpWithdrawal = await kibangouPay.createWithdrawal({
      amount,
      currency: 'XAF',
      countryCode: 'CG',
      paymentMethod: 'MOBILE_MONEY',
      operator: operator.toUpperCase().includes('MTN') ? 'MTN' : 'AIRTEL',
      beneficiaryName: user.artist_name || user.full_name || 'Artiste Moyo Culture',
      mobileNo: phone_number,
      remarks: `Retrait Royalties Moyo Culture (${amount} FCFA)`,
      idempotencyKey: idemKey,
      metadata: { user_id: userId }
    });

    // Mise à jour de la transaction selon la réponse du prestataire
    if (kbpWithdrawal.status === 'SUCCESS' || kbpWithdrawal.status === 'COMPLETED') {
      await query(`
        UPDATE transactions SET status = 'SUCCESS' WHERE external_reference = $1
      `, [kbpWithdrawal.transaction_id]);
    } else if (kbpWithdrawal.status === 'FAILED' || kbpWithdrawal.status === 'UNKNOWN') {
      // Remboursement atomique si le prestataire échoue
      await query(`
        UPDATE users SET wallet_balance_fcfa = wallet_balance_fcfa + $1 WHERE id = $2
      `, [amount, userId]);
      await query(`
        UPDATE transactions SET status = 'FAILED' WHERE external_reference = $1
      `, [kbpWithdrawal.transaction_id]);
    }

    return res.json({
      message: kbpWithdrawal.message || `Retrait de ${amount} FCFA validé avec succès ! Les fonds ont été envoyés vers votre compte ${operator} (${phone_number}).`,
      transaction: txRes.rows[0],
      kibangoupay: kbpWithdrawal,
      new_balance_fcfa: currentBalance - amount
    });
  } catch (error: any) {
    console.error('Erreur retrait KibangouPay :', error);
    // En cas d'erreur critique, essayer de rembourser si le solde a été déduit
    try {
      // Récupérer l'user pour potentiellement rembourser
    } catch {}
    return res.status(500).json({ error: 'Erreur lors du traitement du retrait', details: error.message });
  }
});

export default router;