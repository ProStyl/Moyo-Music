import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initializeDatabase } from './database/initDb';
import authRoutes from './modules/auth/auth.controller';
import releasesRoutes from './modules/releases/releases.controller';
import servicesRoutes from './modules/services360/services360.controller';
import ticketingRoutes from './modules/ticketing/ticketing.controller';
import marketplaceRoutes from './modules/marketplace/marketplace.controller';
import paymentsRoutes from './modules/payments/payments.controller';
import walletRoutes from './modules/wallet/wallet.controller';
import monitoringRoutes from './modules/monitoring/monitoring.controller';
import bcdaRoutes from './modules/bcda/bcda.controller';
import publishingRoutes from './modules/publishing/publishing.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json({ verify: (req, _res, buf) => { (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf); } }));
app.use(express.urlencoded({ extended: true }));

// Servir les uploads statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/releases', releasesRoutes);
app.use('/api/services360', servicesRoutes);
app.use('/api/ticketing', ticketingRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/bcda', bcdaRoutes);
app.use('/api/publishing', publishingRoutes);

// Health Check & Documentation
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    platform: 'Plateforme Digitale Musique & Arts Congo-Brazzaville (Moyo Culture)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Distribution Internationale (Spotify, Apple, Boomplay, TikTok, Meta)',
      'Codes ISRC & UPC Congolais Automatisés',
      'Services 360 (YouTube OAC, TikTok Artiste, Spotify Verification)',
      'Billetterie Événements avec QR Code Anti-Fraude & Scan',
      'Galerie d\'Art & Peintures École de Poto-Poto avec Certificats',
      'Paiements & Retraits MTN MoMo / Airtel Money Congo'
    ]
  });
});

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 SERVEUR CONGO ART & MUSIC DÉMARRÉ SUR LE PORT ${PORT}`);
  console.log(`📍 API Health : http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
  
  // Initialiser les tables de la base de données
  await initializeDatabase();
});
