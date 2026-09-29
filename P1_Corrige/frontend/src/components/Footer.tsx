"use client";

import Link from "next/link";
import { Disc3, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Footer() {
  const { user } = useAuth();

  // Dans l'espace compte (connecté), on masque totalement le footer pour un affichage plein écran propre
  if (user) return null;

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1 : Intro */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Disc3 className="w-6 h-6 text-congo-yellow" />
              <span className="text-lg font-bold text-white tracking-wide">MOYO CULTURE</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              La première infrastructure digitale dédiée à la musique, aux arts visuels (École de Poto-Poto) et au spectacle vivant en République du Congo.
            </p>
            <div className="flex items-center space-x-2 text-xs text-congo-green font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Conforme BCDA & Intégré MTN / Airtel</span>
            </div>
          </div>

          {/* Col 2 : Musique & Distribution */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Musique & DSPs</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/distribution" className="hover:text-congo-yellow transition">Distribution Spotify / Apple / Boomplay</Link></li>
              <li><Link href="/services-360" className="hover:text-congo-yellow transition">Chaîne Artiste YouTube (OAC)</Link></li>
              <li><Link href="/services-360" className="hover:text-congo-yellow transition">Badge Musique TikTok & Meta</Link></li>
              <li><Link href="/wallet" className="hover:text-congo-yellow transition">Reversement Royalties par Mobile Money</Link></li>
            </ul>
          </div>

          {/* Col 3 : Événements & Art */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Événements & Art</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/billetterie" className="hover:text-congo-yellow transition">Billetterie Concerts & Festivals</Link></li>
              <li><Link href="/billetterie/scan" className="hover:text-congo-yellow transition">Scanner Anti-Fraude Billetterie</Link></li>
              <li><Link href="/galerie" className="hover:text-congo-yellow transition">Galerie Peinture Poto-Poto</Link></li>
              <li><Link href="/galerie" className="hover:text-congo-yellow transition">Certificats d'Authenticité Numériques</Link></li>
            </ul>
          </div>

          {/* Col 4 : Villes & Paiements */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Couverture Locale</h3>
            <p className="text-xs text-slate-400 mb-2">
              Opérationnel à Brazzaville, Pointe-Noire, Dolisie et accessible à toute la Diaspora mondiale.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-semibold text-yellow-400">MTN MoMo</span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-semibold text-red-400">Airtel Money</span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-semibold text-sky-400">Visa / Mastercard</span>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Moyo Culture Congo. Tous droits réservés.</p>
          <p className="flex items-center space-x-1">
            <span>Conçu avec passion pour la culture du Congo ❤️</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
