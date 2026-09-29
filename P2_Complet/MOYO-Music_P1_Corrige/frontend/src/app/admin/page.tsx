"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Music, Ticket, RefreshCw, ExternalLink } from "lucide-react";
import { releasesApi, ticketingApi } from "@/lib/api";

export default function AdminDashboardPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [relRes, evtRes] = await Promise.all([
        releasesApi.getAll(),
        ticketingApi.getEvents(),
      ]);
      setReleases(relRes.releases || []);
      setEvents(evtRes.events || []);
    } catch (e) {
      console.error("Erreur chargement admin :", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* En-tête Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-congo-yellow/10 border border-congo-yellow/30 text-xs font-semibold text-congo-yellow mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Superviseur & Back-Office Plateforme 🇨🇬</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Tableau de Bord & Données Réelles</h1>
          <p className="text-xs text-slate-400">Contrôle en direct des sorties SonoSuite, billetterie et base PostgreSQL</p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-900 border border-slate-700 hover:text-white rounded-xl text-xs flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Actualisation..." : "Actualiser les Données"}</span>
        </button>
      </div>

      {/* Statistiques Clés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Sorties Musicales DSPs</span>
            <Music className="w-5 h-5 text-congo-green" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{releases.length}</p>
          <p className="text-[11px] text-emerald-400 mt-1">Codes ISRC/UPC Congolais</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Événements & Concerts</span>
            <Ticket className="w-5 h-5 text-congo-red" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{events.length}</p>
          <p className="text-[11px] text-congo-yellow mt-1">IFC Brazzaville & Pointe-Noire</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">SonoSuite Pipeline</span>
            <ExternalLink className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">Actif</p>
          <p className="text-[11px] text-sky-400 mt-1">Livraison DDEX Spotify / Apple / TikTok</p>
        </div>
      </div>

      {/* Table des Sorties Musicales */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Music className="w-5 h-5 text-congo-green" />
          <span>Sorties Musicales Enregistrées (Base de Données)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Titre</th>
                <th className="py-3 px-4">Artiste</th>
                <th className="py-3 px-4">Genre</th>
                <th className="py-3 px-4">Code UPC</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Date de Sortie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Chargement des sorties...</td>
                </tr>
              ) : releases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Aucune sortie enregistrée pour le moment.</td>
                </tr>
              ) : releases.map((r) => 
                <tr key={r.id} className="hover:bg-slate-950/40">
                  <td className="py-3 px-4 font-bold text-white">{r.title}</td>
                  <td className="py-3 px-4 text-congo-yellow font-medium">{r.artist_name || r.author_name}</td>
                  <td className="py-3 px-4">{r.genre}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">{r.upc_code}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-md text-[10px] font-bold uppercase">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{r.release_date}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
