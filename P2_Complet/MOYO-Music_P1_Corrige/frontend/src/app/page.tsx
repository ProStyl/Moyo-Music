"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music, Ticket, Sparkles, Wallet, CheckCircle2, ArrowRight, ShieldCheck, Globe, Smartphone, QrCode, Palette } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/AuthModal";

export default function HomePage() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-24 pb-20">
        
        {/* 1. SECTION HÉROS : HUB DE BIENVENUE CULTUREL DU CONGO */}
        <section className="relative pt-12 pb-20 overflow-hidden">
          {/* Effets de halo lumineux aux couleurs du drapeau congolais */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-congo-green/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[250px] bg-congo-yellow/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[200px] bg-congo-red/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-congo-yellow mb-6 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-congo-green animate-ping"></span>
              <span>Plateforme Nationale des Industries Culturelles & Créatives 🇨🇬</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
              L'Écosystème Digital de la <span className="bg-gradient-to-r from-congo-yellow via-amber-300 to-congo-green bg-clip-text text-transparent">Musique</span>, de la <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">Peinture</span> & des <span className="bg-gradient-to-r from-congo-red to-amber-500 bg-clip-text text-transparent">Spectacles</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Une infrastructure complète et sécurisée pour les <strong>Artistes Musiciens</strong> (distribution SonoSuite & OAC), les <strong>Artistes Peintres</strong> (École de Poto-Poto & certificats d'authenticité), les <strong>Organisateurs d'Événements</strong> et le <strong>Grand Public</strong>.
            </p>

            {/* Boutons d'Accès Rapide selon les Métiers */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {!user ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-congo-green via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-congo-green text-white font-bold text-base shadow-xl flex items-center justify-center space-x-2 transition"
                >
                  <Sparkles className="w-5 h-5 text-congo-yellow" />
                  <span>Accéder à mon Espace Métier (Connexion)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="px-6 py-3 bg-slate-900 border border-slate-700 rounded-2xl flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-sm font-bold text-white">
                    Connecté en tant que {user.artist_name || user.full_name} ({user.role})
                  </span>
                </div>
              )}

              <Link
                href="/billetterie"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-base flex items-center justify-center space-x-2 transition"
              >
                <Ticket className="w-5 h-5 text-congo-red" />
                <span>Voir les Concerts & Billetterie</span>
              </Link>
            </div>

            {/* Badges de Réassurance Locale */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-yellow-400" />
                <span>Paiements MTN MoMo & Airtel Money</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>SonoSuite White-Label DDEX</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-congo-green" />
                <span>Certificats École de Peinture de Poto-Poto</span>
              </div>
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-congo-red" />
                <span>Billetterie QR Code Anti-Fraude</span>
              </div>
            </div>

          </div>
        </section>

        {/* 2. ESPACES DÉDIÉS SELON LES 3 GRANDS PROFILS MÉTIERS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs uppercase font-bold tracking-widest text-congo-yellow mb-2">
              Une Plateforme Découpée par Rôle
            </h2>
            <p className="text-3xl font-extrabold text-white">
              Des Espaces de Travail Sur-Mesure et Protégés
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Espace Musique */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-congo-green/50 rounded-3xl p-8 flex flex-col justify-between shadow-xl transition">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-congo-green/10 text-congo-green flex items-center justify-center mb-5">
                  <Music className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-congo-green/10 text-congo-green rounded-full text-[10px] font-bold uppercase">
                  Pour les Artistes Musiciens
                </span>
                <h3 className="text-xl font-bold text-white mt-3 mb-2">Distribution DSPs & Chaîne OAC</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Uploadez vos masters WAV, générez automatiquement vos codes ISRC Congolais et livrez vos titres sur Spotify, Apple Music, Boomplay et TikTok via SonoSuite.
                </p>
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-congo-green flex-shrink-0" />
                    <span>Codes ISRC & UPC Congolais officiels</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-congo-green flex-shrink-0" />
                    <span>Fusion Chaîne d'Artiste YouTube (OAC 🎵)</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-congo-green flex-shrink-0" />
                    <span>Reversement des Royalties par Mobile Money</span>
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800">
                <Link
                  href="/distribution"
                  className="w-full py-3 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                >
                  <span>Accéder à l'Espace Musique</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Espace Peinture & Arts Plastiques */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-sky-400/50 rounded-3xl p-8 flex flex-col justify-between shadow-xl transition">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-5">
                  <Palette className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 rounded-full text-[10px] font-bold uppercase">
                  Pour les Peintres & Sculpteurs
                </span>
                <h3 className="text-xl font-bold text-white mt-3 mb-2">École de Poto-Poto & Certificats</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Digitalisez vos toiles, obtenez un certificat d'authenticité numérique infalsifiable et vendez vos créations aux collectionneurs et à la diaspora en devises (€ / $).
                </p>
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <span>Registre de Certificats d'Authenticité EPP</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <span>Exposition internationale de toiles et sculptures</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <span>Paiements sécurisés MoMo & Virements</span>
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800">
                <Link
                  href="/galerie"
                  className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                >
                  <span>Explorer la Galerie & Certificats</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Espace Billetterie & Promoteurs */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-congo-red/50 rounded-3xl p-8 flex flex-col justify-between shadow-xl transition">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-congo-red/10 text-congo-red flex items-center justify-center mb-5">
                  <Ticket className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-congo-red/10 text-congo-red rounded-full text-[10px] font-bold uppercase">
                  Pour les Promoteurs de Spectacles
                </span>
                <h3 className="text-xl font-bold text-white mt-3 mb-2">Billetterie & Scan Anti-Fraude</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Créez vos concerts (IFC, Palais des Congrès), vendez vos billets par Mobile Money et contrôlez les entrées avec l'application scanner connectée en direct à la base de données.
                </p>
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-congo-red flex-shrink-0" />
                    <span>Émission de billets avec QR Code cryptographique</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-congo-red flex-shrink-0" />
                    <span>Application de contrôle à la porte anti-doublon</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-congo-red flex-shrink-0" />
                    <span>Recettes versées directement sur compte MoMo</span>
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800">
                <Link
                  href="/billetterie"
                  className="w-full py-3 bg-congo-red hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                >
                  <span>Accéder à la Billetterie</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </section>

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
