"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Users, 
  PlusCircle, 
  ScanLine, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Share2
} from "lucide-react";
import { ticketingApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function MesEvenementsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await ticketingApi.getEvents().catch(() => ({ events: [] }));
      if (res.events && res.events.length > 0) {
        setEvents(res.events);
      } else {
        // Fallback démo
        setEvents([
          {
            id: "evt-001",
            title: "Festival Rumba & Sape Brazza 2026",
            venue_name: "Institut Français du Congo (IFC), Rond-point CCF",
            city: "Brazzaville",
            event_date: "2026-10-15T20:00:00Z",
            ticket_price_fcfa: 5000,
            vip_price_fcfa: 15000,
            total_capacity: 800,
            tickets_sold: 123,
            revenue_fcfa: 615000,
            splits: [
              { name: user?.artist_name || "Prince Nzassi (Artiste Lead)", role: "Artiste Principal", percentage: 50 },
              { name: "Brazza Live Prod", role: "Promoteur & Régie", percentage: 25 },
              { name: "Influenceurs TikTok (+500k)", role: "Campagne Digitale", percentage: 15 },
              { name: "Orchestre Les Bantous", role: "Guests", percentage: 10 }
            ]
          }
        ]);
      }
    } catch (err) {
      console.error("Erreur chargement mes spectacles", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* 1. EN-TÊTE DE LA PAGE MES SPECTACLES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800 text-xs font-semibold text-congo-red mb-3">
            <Ticket className="w-3.5 h-3.5" />
            <span>Gestion Privée de mes Spectacles & Concerts 🇨🇬</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Mes Spectacles, Concerts & Splits
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Suivez les ventes de billets électroniques MoMo en temps réel, gérez les entrées QR et contrôlez la répartition automatique des recettes avec vos influenceurs et promoteurs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/billetterie/creer"
            className="px-5 py-3.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-xl transition flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Créer un Nouveau Spectacle</span>
          </Link>

          <button
            onClick={loadEvents}
            className="p-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-congo-yellow" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. STATISTIQUES GLOBALES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block font-medium">Spectacles Actifs</span>
          <p className="text-3xl font-black text-white mt-1">{events.length}</p>
          <span className="text-[10px] text-emerald-400">Billetterie ouverte</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block font-medium">Total Billets Vendus</span>
          <p className="text-3xl font-black text-sky-400 mt-1">123 Places</p>
          <span className="text-[10px] text-slate-500">Scannables par QR Code</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block font-medium">Recettes Billetterie Générées</span>
          <p className="text-3xl font-black text-congo-yellow mt-1">615 000 FCFA</p>
          <span className="text-[10px] text-congo-green">Direct sur vos Portefeuilles MoMo</span>
        </div>
      </div>

      {/* 3. LISTE DÉTAILLÉE DE MES ÉVÉNEMENTS */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Ticket className="w-5 h-5 text-congo-green" />
          <span>Liste de Mes Événements ({events.length})</span>
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {events.map((evt) => {
            const fillRate = Math.round(((evt.tickets_sold || 123) / evt.total_capacity) * 100);
            return (
              <div
                key={evt.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 hover:border-slate-700 transition"
              >
                {/* En-tête de l'événement */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                        En Vente Active 🇨🇬
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">Tarif : {evt.ticket_price_fcfa.toLocaleString()} FCFA</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1">{evt.title}</h3>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-congo-green" />
                        <span>{new Date(evt.event_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-congo-red" />
                        <span>{evt.venue_name}</span>
                      </span>
                    </div>
                  </div>

                  {/* Boutons d'action sur l'événement */}
                  <div className="flex items-center gap-2">
                    <Link
                      href="/billetterie/scan"
                      className="px-4 py-2.5 bg-amber-950 text-congo-yellow border border-amber-800 hover:border-congo-yellow rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
                    >
                      <ScanLine className="w-4 h-4" />
                      <span>Scanner les Entrées</span>
                    </Link>

                    <Link
                      href="/bcda"
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
                    >
                      <ShieldCheck className="w-4 h-4 text-congo-yellow" />
                      <span>Tirage Papier BCDA</span>
                    </Link>
                  </div>
                </div>

                {/* Jauge de Remplissage & Chiffres */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Places Vendues :</span>
                    <p className="text-xl font-bold text-white mt-0.5">
                      {evt.tickets_sold || 123} / {evt.total_capacity} places
                    </p>
                    {/* Barre de progression */}
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-congo-green to-congo-yellow h-full rounded-full" style={{ width: `${fillRate}%` }} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Recettes Brutes Actuelles :</span>
                    <p className="text-xl font-bold text-congo-yellow mt-0.5">
                      {(evt.revenue_fcfa || 615000).toLocaleString()} FCFA
                    </p>
                    <span className="text-[10px] text-slate-500">Payé par MTN / Airtel Money</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Taux de Remplissage :</span>
                    <p className="text-xl font-bold text-emerald-400 mt-0.5">
                      {fillRate} %
                    </p>
                    <span className="text-[10px] text-slate-500">Capacité salle conforme</span>
                  </div>
                </div>

                {/* Feuille des Splits et Collaborateurs pour ce spectacle */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-congo-yellow" />
                    <span>Répartition Automatisée des Revenus de Billetterie (Splits Partenaires) :</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-congo-green font-bold block">🎤 Artiste Principal</span>
                      <strong className="text-white block truncate">{user?.artist_name || "Prince Nzassi"}</strong>
                      <span className="text-congo-yellow font-black text-sm">50 %</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-congo-red font-bold block">🏢 Promoteur / Régie</span>
                      <strong className="text-white block truncate">Brazza Live Prod</strong>
                      <span className="text-congo-yellow font-black text-sm">25 %</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-purple-400 font-bold block">📱 Influenceurs TikTok</span>
                      <strong className="text-white block truncate">Ambassadeurs 242</strong>
                      <span className="text-congo-yellow font-black text-sm">15 %</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-sky-400 font-bold block">🎷 Orchestre Invité</span>
                      <strong className="text-white block truncate">Les Bantous</strong>
                      <span className="text-congo-yellow font-black text-sm">10 %</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
