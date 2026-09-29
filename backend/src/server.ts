import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

// Chargement Bootstrap .env avant que les modules ne lisent les secrets
const dotenvExpand = require('dotenv-expand');
dotenvExpand.expand(dotenv);

const app = express();
const PORT = process.env.PORT || 4000;

// Sécurité headers HTTP
app.use(helmet());

// CORS configurable via CORS_ORIGINS
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map((o: string) => o.trim()).filter(Boolean)
  : [];

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-kibangoupay-signature', 'x-project-id', 'x-api-key'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting par IP
const rateLimit = require('express-rate-limit');

// Apply rate limiting to specific routes
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.' }
});

const strictLimiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // limit each IP to 20 auth attempts per windowMs
  message: { error: 'Trop d\'tentatives d\'authentification, veuillez réessayer dans 15 minutes.' }
});

const strictLimiterPayment = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // limit each IP to 50 payment attempts per windowMs
  message: { error: 'Trop d\'tentatives de paiement, veuillez réessayer dans 15 minutes.' }
});

// Apply rate limiting to all routes
app.use('/api/', strictLimiter);

// Routes API
app.use('/api/auth', strictLimiterAuth, authRoutes);
app.use('/api/releases', releasesRoutes);
app.use('/api/services360', servicesRoutes);
app.use('/api/ticketing', strictLimiterPayment, ticketingRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/payments', strictLimiterPayment, paymentsRoutes);
app.use('/api/wallet', strictLimiterAuth, walletRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/bcda', strictLimiterAuth, bcdaRoutes);
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

// Page 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erreur serveur :', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erreur interne du serveur' });
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