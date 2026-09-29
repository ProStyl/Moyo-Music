"use client";

import { useState } from "react";
import Link from "next/link";
import { ScanLine, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck, QrCode, RefreshCw, Lock } from "lucide-react";
import { ticketingApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ScanTicketPage() {
  const { user } = useAuth();
  const isOrganizer = user?.role === "organizer" || user?.role === "admin";

  const [ticketInput, setTicketInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  // VERROU STRICT : Si l'utilisateur n'est pas organisateur ou admin
  if (!user || !isOrganizer) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-congo-yellow/10 text-congo-yellow rounded-3xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Accès Contrôle Portes Restreint</h1>
        <p className="text-xs text-slate-400">
          Cette application de scan est strictement réservée aux <strong>agents de sécurité, contrôleurs et organisateurs d'événements officiels</strong> pour valider les entrées.
        </p>
        <p className="text-[11px] text-congo-yellow">
          Votre rôle actuel : <strong>{user ? user.role : "Visiteur non connecté"}</strong>
        </p>
        <div className="pt-2">
          <Link
            href="/billetterie"
            className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:text-white rounded-xl text-xs inline-block"
          >
            Retourner à la Billetterie Publique
          </Link>
        </div>
      </div>
    );
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      // Appel direct vers l'API Backend PostgreSQL
      const res = await ticketingApi.scanTicket(ticketInput.trim());

      setScanResult({
        valid: true,
        message: res.message,
        ticket: res.ticket,
      });

      setScanHistory((prev) => [
        {
          code: ticketInput.trim(),
          time: new Date().toLocaleTimeString(),
          valid: true,
          buyer: res.ticket?.buyer_name,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      setScanResult({
        valid: false,
        message: err.message || "Billet Invalide ou déjà utilisé",
      });

      setScanHistory((prev) => [
        {
          code: ticketInput.trim(),
          time: new Date().toLocaleTimeString(),
          valid: false,
          error: err.message,
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      
      <Link href="/billetterie" className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour à la billetterie</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="text-center">
          <div className="w-12 h-12 bg-congo-yellow/10 text-congo-yellow rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ScanLine className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Scanner de Contrôle des Entrées</h1>
          <p className="text-xs text-slate-400 mt-1">
            Agent : <strong>{user.artist_name || user.full_name}</strong> (Promoteur Agréé 🇨🇬)
          </p>
        </div>

        {/* Formulaire de saisie du hash QR code */}
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Code Hash du Billet (Scanné par caméra ou douchette)
            </label>
            <input
              type="text"
              required
              placeholder="Collez ou scannez le hash ex: TKT-CG-..."
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-congo-yellow"
            />
          </div>

          <button
            type="submit"
            disabled={isScanning}
            className="w-full py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg disabled:opacity-50"
          >
            {isScanning ? "Vérification en base de données..." : "Valider l'Entrée du Spectateur"}
          </button>
        </form>

        {/* Résultat du Scan en temps réel */}
        {scanResult && 
          <div
            className={`p-6 rounded-2xl border text-center animate-fade-in ${
              scanResult.valid
                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                : "bg-red-950/50 border-red-500/50 text-red-300"
            }`}
          >
            {scanResult.valid ? 
              <div className="space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-extrabold text-emerald-400">{scanResult.message}</h3>
                
                <div className="bg-slate-950/80 p-3.5 rounded-xl text-xs text-left text-slate-300 space-y-1.5 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Titulaire :</span>
                    <strong className="text-white">{scanResult.ticket?.buyer_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Événement :</span>
                    <span className="text-slate-200">{scanResult.ticket?.event_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type :</span>
                    <span className="font-bold text-congo-yellow">{scanResult.ticket?.ticket_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Statut en DB :</span>
                    <span className="text-emerald-400 font-bold uppercase">{scanResult.ticket?.status}</span>
                  </div>
                </div>
              </div>
             : 
              <div className="space-y-3">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="text-lg font-extrabold text-red-400">ACCÈS REFUSÉ !</h3>
                <p className="text-xs text-slate-300">{scanResult.message}</p>
              </div>
            }
          </div>
        }

        {/* Historique des derniers scans */}
        {scanHistory.length > 0 && 
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Derniers scans effectués à la porte
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {scanHistory.map((h, i) => 
                <div
                  key={i}
                  className={`p-2.5 rounded-lg text-[11px] flex justify-between items-center ${
                    h.valid ? "bg-emerald-950/20 text-emerald-300" : "bg-red-950/20 text-red-300"
                  }`}
                >
                  <span className="font-mono">{h.code.slice(0, 16)}...</span>
                  <span>{h.valid ? `✅ ${h.buyer || "Validé"}` : `❌ ${h.error}`}</span>
                  <span className="text-slate-500">{h.time}</span>
                </div>
              )}
            </div>
          </div>
        }

      </div>
    </div>
  );
}
