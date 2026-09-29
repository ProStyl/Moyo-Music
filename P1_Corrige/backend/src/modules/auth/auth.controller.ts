import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../database/db';
import { authenticateToken, AuthRequest } from './auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_congo_art_music_2026_jwt_token_key';

// INSCRIPTION (Artiste, Organisateur, Peintre, Fan)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { full_name, artist_name, email, phone_number, password, role, bio, momo_number, airtel_number } = req.body;

    if (!full_name || !phone_number || !password) {
      return res.status(400).json({ error: 'Le nom complet, le numéro de téléphone et le mot de passe sont obligatoires.' });
    }

    // Vérifier si le numéro existe déjà
    const userCheck = await query('SELECT id FROM users WHERE phone_number = $1 OR (email = $2 AND $2 IS NOT NULL)', [phone_number, email || null]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte avec ce numéro de téléphone ou cet email existe déjà.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role || 'artist';

    const insertResult = await query(
      `INSERT INTO users (full_name, artist_name, email, phone_number, password_hash, role, bio, momo_number, airtel_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, full_name, artist_name, email, phone_number, role, wallet_balance_fcfa, created_at`,
      [full_name, artist_name || full_name, email || null, phone_number, passwordHash, userRole, bio || '', momo_number || phone_number, airtel_number || phone_number]
    );

    const newUser = insertResult.rows[0];
    const token = jwt.sign({ id: newUser.id, role: newUser.role, phone_number: newUser.phone_number }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(201).json({
      message: 'Compte créé avec succès',
      user: newUser,
      token
    });
  } catch (error: any) {
    console.error('Erreur inscription :', error);
    return res.status(500).json({ error: 'Erreur lors de la création du compte', details: error.message });
  }
});

// CONNEXION (Par Téléphone ou Email + Mot de passe)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // identifier = phone_number ou email

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Veuillez renseigner votre numéro de téléphone (ou email) et votre mot de passe.' });
    }

    const userRes = await query(
      `SELECT id, full_name, artist_name, email, phone_number, password_hash, role, wallet_balance_fcfa, avatar_url, bio
       FROM users
       WHERE phone_number = $1 OR email = $1`,
      [identifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects (compte introuvable)' });
    }

    const user = userRes.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, phone_number: user.phone_number }, JWT_SECRET, { expiresIn: '30d' });
    
    // Supprimer le hash de mot de passe de la réponse
    delete user.password_hash;

    return res.json({
      message: 'Connexion réussie',
      user,
      token
    });
  } catch (error: any) {
    console.error('Erreur login :', error);
    return res.status(500).json({ error: 'Erreur lors de la connexion', details: error.message });
  }
});

// PROFIL COURANT
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRes = await query(
      `SELECT id, full_name, artist_name, email, phone_number, role, wallet_balance_fcfa, avatar_url, bio, momo_number, airtel_number, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    return res.json({ user: userRes.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

export default router;
