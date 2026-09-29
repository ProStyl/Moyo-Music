import { Router, Request, Response } from 'express';
import { query } from '../../database/db';
import { authenticateToken, AuthRequest } from '../auth/auth.middleware';

const router = Router();

// Initiation paiement
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { amount_fcfa, phone_number, operator } = req.body;
    const amount = parseFloat(amount_fcfa);
    return res.json({ success: true, message: 'Initiation de paiement', amount, status: 'PENDING' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Webhook
router.post('/webhook/kibangoupay', async (req: Request, res: Response) => {
  try {
    return res.json({ status: 'OK', processed: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Reconciliation
router.post('/payments/reconcile', authenticateToken, (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Reconciliation effectuée' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Status achat billet
router.get('/ticketing/purchase-status', async (req: Request, res: Response) => {
  try {
    return res.json({ canViewQr: false, message: 'En attente de confirmation' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;