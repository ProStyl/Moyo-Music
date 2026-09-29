"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, ArrowLeft, PlusCircle, CheckCircle2, AlertCircle, Coins, Radio, Youtube, FileText, Wallet, Building2 } from "lucide-react";
import { publishingApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function MoyoPublishingAdministrationPage() {
  const { user } = useAuth();
  
  const [catalog, setCatalog] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSyncingWallet, setIsSyncingWallet] = useState(false);

  // Formulaire d'Importation ISRC
  const [isrcInput, setIsrcInput] = useState("");
  const [trackTitleInput, setTrackTitleInput] = useState("");
  const [artistNameInput, setArtistNameInput] = useState(user?.artist_name || user?.full_name || "");
  const [distributorInput, setDistributorInput] = useState("DistroKid");
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [importError, setImportError] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [catRes, anaRes] = await Promise.all([
        publishingApi.getCatalog(),
        publishingApi.getAnalytics()
      ]);
      setCatalog(catRes.catalog || []);
      setAnalytics(anaRes.stats || null);
    } catch (err: any) {
      console.error("Erreur chargement publishing :", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Soumission de l'import ISRC
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isrcInput && !trackTitleInput) {
      setImportError("Veuillez renseigner le code ISRC ou le titre du morceau.");
      return;
    }

    setIsSubmittingImport(true);
    setImportError("");

    try {
      const res = await publishingApi.importIsrc({
        isrc_code: isrcInput,
        track_title: trackTitleInput,
        artist_name: artistNameInput,
        original_distributor: distributorInput
      });

      setNotification(`Morceau "${trackTitleInput || isrcInput}" rattaché avec succès ! Code ISWC : ${res.iswc_code}`);
      setIsImportModalOpen(false);
      setIsrcInput("");
      setTrackTitleInput("");
      loadData();
    } catch (err: any) {
      setImportError(err.message || "Erreur lors de l'importation de l'ISRC.");
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // Transférer les royalties vers le portefeuille Mobile Money
  const handleSyncToWallet = async () => {
    setIsSyncingWallet(true);
    try {
      const res = await publishingApi.syncToWallet();
      setNotification(res.message || "Transfert vers le portefeuille effectué avec succès.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Erreur lors du transfert vers le portefeuille.");
    } finally {
      setIsSyncingWallet(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-white">
      
      {/* Navigation Retour */}
      <div className="flex justify-between items-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Tableau de Bord</span>
        </Link>

        <div className="flex items-center space-x-2">
          <Link
            href="/bcda/guide"
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center space-x-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5 text-congo-yellow" />
            <span>Guide Droits d'Auteur & FAQ</span>
          </Link>
        </div>
      </div>

      {/* Header Banner - Vision 360° Publishing */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-congo-yellow/10 border border-congo-yellow/30 text-xs font-bold text-congo-yellow">
              <Globe className="w-4 h-4 text-congo-yellow" />
              <span>Moyo Publishing Administration 🌐 • Récupération Mondiale 360°</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Récupérez 100% de Vos Droits d'Auteur & Droits Voisins Mondiaux
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Vous distribuez avec <strong>DistroKid, TuneCore, CD Baby ou Believe</strong> ? Récupérez les <strong>15% à 20% de droits d'auteur</strong> sur Spotify, The MLC (USA), YouTube Content ID et les passages TV/Radios qu'aucun distributeur ne collecte pour vous.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-6 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-xl transition flex items-center justify-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Importer un ISRC (DistroKid / TuneCore)</span>
            </button>
          </div>
        </div>

        {/* 5 Réseaux Mondiaux Connectés */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
          <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>The MLC (USA 🇺🇸)</span>
          </div>
          <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>BCDA (Congo 🇨🇬)</span>
          </div>
          <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>CISAC / SACEM (🌍)</span>
          </div>
          <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Content ID (YouTube 🎵)</span>
          </div>
          <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>SoundExchange (🎙️)</span>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && 
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl text-emerald-200 text-xs flex items-center justify-between shadow-2xl">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      }

      {/* 4 Grandes Cartes de Flux de Revenus d'Édition (360°) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Droits Mécaniques Numériques (DSPs & The MLC) */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Globe className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Streaming Mondial</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold">Droits Mécaniques (The MLC / DSPs)</span>
            <strong className="text-xl sm:text-2xl font-black text-white block mt-1">
              {(analytics?.streams_revenue_breakdown?.mechanical_dSPs_the_mlc || 0).toLocaleString("fr-FR")} FCFA
            </strong>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Les 15% de droits d'auteur sur Spotify & Apple Music prélevés à la source aux USA et dans le monde.
          </p>
        </div>

        {/* 2. Exécution Publique (CISAC / SACEM / BCDA) */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="p-2.5 rounded-2xl bg-amber-500/10 text-congo-yellow border border-amber-500/20">
              <Radio className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Airplay & Médias</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold">Exécution Publique (DEP / BCDA)</span>
            <strong className="text-xl sm:text-2xl font-black text-congo-yellow block mt-1">
              {(analytics?.streams_revenue_breakdown?.public_performance_cisac_bcda || 0).toLocaleString("fr-FR")} FCFA
            </strong>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Redevances de diffusion sur les télévisions, radios FM, discothèques, bars et concerts.
          </p>
        </div>

        {/* 3. YouTube Content ID & TikTok */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Youtube className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Réseaux Sociaux</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold">YouTube Content ID & TikTok</span>
            <strong className="text-xl sm:text-2xl font-black text-rose-400 block mt-1">
              {(analytics?.streams_revenue_breakdown?.youtube_content_id_tiktok || 0).toLocaleString("fr-FR")} FCFA
            </strong>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Monétisation automatique de toutes les vidéos créées par les utilisateurs contenant votre musique.
          </p>
        </div>

        {/* 4. Droits Voisins Numériques (SoundExchange) */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Coins className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Droits Voisins</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold">Web-Radios (SoundExchange)</span>
            <strong className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1">
              {(analytics?.streams_revenue_breakdown?.neighboring_soundexchange || 0).toLocaleString("fr-FR")} FCFA
            </strong>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Rémunération équitable des web-radios et flux numériques non interactifs (Pandora, SiriusXM).
          </p>
        </div>

      </div>

      {/* Barre de Versement Total vers le Portefeuille */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs text-slate-400 font-semibold">Total Global des Droits d'Édition Collectés :</span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {(analytics?.grand_total_fcfa || 0).toLocaleString("fr-FR")} <span className="text-congo-yellow">FCFA</span>
          </div>
        </div>

        <button
          disabled={isSyncingWallet || (analytics?.grand_total_fcfa || 0) <= 0}
          onClick={handleSyncToWallet}
          className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs shadow-xl transition disabled:opacity-40 flex items-center justify-center space-x-2"
        >
          <Wallet className="w-4 h-4" />
          <span>{isSyncingWallet ? "Versement en cours..." : "Transférer vers mon Wallet Mobile Money 📲"}</span>
        </button>
      </div>

      {/* Catalogue des Œuvres Administrées */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-congo-yellow" />
              <span>Catalogue d'Édition Administré ({catalog.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Œuvres enregistrées au réseau mondial CISAC & The MLC via Moyo Publishing.
            </p>
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition border border-slate-700"
          >
            <PlusCircle className="w-4 h-4 text-congo-yellow" />
            <span>+ Rattacher un ISRC</span>
          </button>
        </div>

        {isLoading ? 
          <div className="p-12 text-center text-xs text-slate-400">Chargement du catalogue...</div>
         : catalog.length === 0 ? 
          <div className="p-12 text-center space-y-4">
            <Globe className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white">Aucun morceau administré pour le moment</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Importez vos codes ISRC DistroKid ou TuneCore pour commencer à collecter vos droits d'auteur dans plus de 215 pays.
              </p>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-6 py-3 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition"
            >
              Importer mon Premier ISRC 🚀
            </button>
          </div>
         : 
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Titre & Artiste</th>
                  <th className="p-3.5">Distributeur d'Origine</th>
                  <th className="p-3.5">Codes Internationaux</th>
                  <th className="p-3.5 text-center">Streams Trackés</th>
                  <th className="p-3.5 text-center">Droits Collectés</th>
                  <th className="p-3.5 text-center">Statut de Collecte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {catalog.map((track) => 
                  <tr key={track.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <strong className="text-white text-sm block font-bold">{track.track_title}</strong>
                      <span className="text-[11px] text-slate-400">{track.artist_name}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {track.original_distributor || "DistroKid"}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] space-y-0.5">
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">ISRC:</span>
                        <strong className="text-slate-300">{track.isrc_code}</strong>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">ISWC:</span>
                        <strong className="text-congo-yellow font-bold">{track.iswc_code || "T-304.891.188-K"}</strong>
                      </div>
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-slate-300">
                      {(track.total_streams_tracked || 0).toLocaleString("fr-FR")}
                    </td>

                    <td className="p-3.5 text-center">
                      <strong className="text-congo-yellow font-bold text-sm">
                        {parseFloat(track.total_collected_fcfa || 0).toLocaleString("fr-FR")} FCFA
                      </strong>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ● Collecte Active (The MLC / BCDA)
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* MODAL POPUP : IMPORTER UN CODE ISRC EXTERNE */}
      {isImportModalOpen && 
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in text-white">
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-congo-yellow/10 text-congo-yellow border border-congo-yellow/30">
                  Mandat d'Administration d'Édition
                </span>
                <h3 className="text-xl font-black text-white mt-1">Rattacher un Code ISRC</h3>
                <p className="text-xs text-slate-400">Réclamez vos droits d'auteur mondiaux non collectés par votre distributeur.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            {importError && 
              <div className="p-3 bg-rose-950/60 border border-rose-500 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            }

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Distributeur Digital d'Origine *</label>
                <select
                  value={distributorInput}
                  onChange={(e) => setDistributorInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:border-congo-yellow"
                >
                  <option value="DistroKid">DistroKid 📦</option>
                  <option value="TuneCore">TuneCore 🎵</option>
                  <option value="CD Baby">CD Baby 💿</option>
                  <option value="Believe">Believe / Backstage 🏢</option>
                  <option value="Amuse">Amuse 📱</option>
                  <option value="Autre">Autre Distributeur</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Code ISRC du Morceau *</label>
                <input
                  type="text"
                  placeholder="Ex: QZ-DA4-24-00123"
                  value={isrcInput}
                  onChange={(e) => setIsrcInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-congo-yellow"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Trouvez votre ISRC sur votre dashboard DistroKid / TuneCore ou dans les crédits Spotify.</span>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Titre du Morceau *</label>
                <input
                  type="text"
                  placeholder="Ex: Rumba du Fleuve"
                  value={trackTitleInput}
                  onChange={(e) => setTrackTitleInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-congo-yellow"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Nom d'Artiste / Auteur *</label>
                <input
                  type="text"
                  value={artistNameInput}
                  onChange={(e) => setArtistNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-congo-yellow"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-400 space-y-1">
                <span className="text-congo-yellow font-bold block">✨ Ce que Moyo Publishing va faire automatiquement :</span>
                <p>1. Attribuer un code ISWC international officiel.</p>
                <p>2. Déposer la réclamation de droits mécaniques auprès de The MLC (USA) et du BCDA.</p>
                <p>3. Activer la protection YouTube Content ID sur votre son.</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingImport}
                  className="px-6 py-2 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl"
                >
                  {isSubmittingImport ? "Rattachement..." : "Activer la Collecte Mondiale 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  );
}
