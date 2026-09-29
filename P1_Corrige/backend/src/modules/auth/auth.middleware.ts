import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_congo_art_music_2026_jwt_token_key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    phone_number: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé : Token manquant. Veuillez vous connecter.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
    }
    req.user = user;
    next();
  });
}

// Middleware de contrôle strict des Rôles (RBAC)
export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    // L'administrateur a accès à tout
    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Accès refusé : Cette action est réservée aux profils [${allowedRoles.join(', ')}]. Votre rôle actuel est : [${req.user.role}].`,
      requiredRoles: allowedRoles,
      currentRole: req.user.role
    });
  };
}
