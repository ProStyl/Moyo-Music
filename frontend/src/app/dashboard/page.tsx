"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music, Radio, ShieldCheck, Ticket, PlusCircle, Globe, Sparkles, ArrowRight, FileText, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { monitoringApi, bcdaApi, ticketingApi, marketplaceApi, publishingApi, walletApi } from "@/lib/api";

export default function UnifiedWorkspaceDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [artistStats, setArtistStats] = useState<any>(null);
  const [bcdaStats, setBcdaStats] = useState<any>(null);
  const [pubStats, setPubStats] = useState<any>(null);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);

  // Retrait express MoMo
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState(user?.momo_number || user?.phone_number || "");
  const [withdrawOperator, setWithdrawOperator] = useState("MTN");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawNotification, setWithdrawNotification] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      if (user?.role === "artist" || user?.role === "admin") {
        const [airplay, stData, pData, wData] = await Promise.all([
          monitoringApi.getArtistAirplay().catch(() => ({ stats: null })),
          bcdaApi.getStats().catch(() => null),
          publishingApi.getAnalytics().catch(() => ({ stats: null })),
          walletApi.getSummary().catch(() => null),
        ]);
        setArtistStats(airplay.stats);
        setBcdaStats(stData);
        setPubStats(pData.stats);
        setWalletSummary(wData);
      } else if (user?.role === "organizer") {
        const res = await ticketingApi.getEvents().catch(() => ({ events: [] }));
        setEvents(res.events || []);
      } else if (user?.role === "painter") {
        const res = await marketplaceApi.getMyArtworks().catch(() => ({ artworks: [] }));
        setArtworks(res.artworks || []);
      } else if ((user?.role as "artist" | "organizer" | "painter" | "fan" | "admin" | "bcda_agent") === "bcda_agent") {
        const [stData, feed] = await Promise.all([
          bcdaApi.getStats().catch(() => null),
          monitoringApi.getLiveFeed().catch(() => ({ detections: [] })),
        ]);
        setBcdaStats(stData);
        setRecentDetections(feed.detections || []);
      }
    } catch (err) {
      console.error("Erreur chargement dashboard unifié :", err);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      loadAllData();
    }
  }, [user, isLoading]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;

    setIsWithdrawing(true);
    try {
      const res = await walletApi.withdraw({
        amount_fcfa: amt,
        phone_number: withdrawPhone,
        operator: withdrawOperator
      });
      setWithdrawNotification(`✅ Retrait de ${amt.toLocaleString("fr-FR")} FCFA initié avec succès vers ${withdrawPhone} (${withdrawOperator}) !`);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Erreur lors du retrait Mobile Money.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-4 border-congo-yellow border-t-transparent rounded-full animate-spin mr-3"></div>
        <span>Chargement de votre Espace de Travail Unifié...</span>
      </div>
    );
  }

  const role = user.role;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-white">
      
      {/* 1. EN-TÊTE BIENVENUE & SOLDE WALLET CENTRALISÉ */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Espace Professionnel Sécurisé 🇨🇬</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Bonjour, <span className="text-congo-yellow">{user.artist_name || user.full_name}</span> 👋
          </h1>
          <p className="text-xs text-slate-400">
            Gérez vos distributions DSPs, vos droits BCDA, vos passages radio/TV et vos concerts depuis un hub unique.
          </p>
        </div>

        {/* Bloc Portefeuille Express */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center space-x-4 w-full md:w-auto shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-congo-yellow border border-amber-500/30 flex items-center justify-center text-xl">
            💰
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Solde Disponible MoMo</span>
            <strong className="text-xl sm:text-2xl font-black text-white">
              {(walletSummary?.balance_fcfa || user.wallet_balance_fcfa || 0).toLocaleString("fr-FR")} <span className="text-congo-yellow text-sm">FCFA</span>
            </strong>
          </div>
          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="px-4 py-2 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg flex-shrink-0"
          >
            Retirer 📲
          </button>
        </div>
      </div>

      {withdrawNotification && 
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl text-emerald-200 text-xs flex items-center justify-between shadow-2xl">
          <span>{withdrawNotification}</span>
          <button onClick={() => setWithdrawNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      }

      {/* 2. LES 4 GRANDS PILIERS DE L'ARTISTE (CLARIFIÉS & NON REDONDANTS) */}
      {(role === "artist" || role === "admin") && 
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-congo-yellow" />
              <span>Vos 4 Pôles d'Activités</span>
            </h2>
            <span className="text-xs text-slate-400">Cliquez pour accéder directement au pôle dédié</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Pôle 1 : Distribution DSPs */}
            <Link
              href="/distribution"
              className="p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl space-y-3 transition shadow-xl group"
            >
              <div className="flex justify-between items-start">
                <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
                  <Music className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800">
                  DDEX ERN 4.3
                </span>
              </div>
              <div>
                <strong className="text-sm font-bold text-white block group-hover:text-emerald-400 transition">
                  1. Distribution DSPs
                </strong>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Livraison vers Spotify, Apple, Boomplay, TikTok et attribution ISRC/UPC.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span>Gérer mes sorties</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Pôle 2 : Droit d'Auteur BCDA */}
            <Link
              href="/bcda"
              className="p-5 bg-slate-900 border border-slate-800 hover:border-congo-yellow/50 rounded-3xl space-y-3 transition shadow-xl group"
            >
              <div className="flex justify-between items-start">
                <span className="p-2.5 rounded-2xl bg-amber-500/10 text-congo-yellow border border-amber-500/20 group-hover:scale-110 transition">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-congo-yellow font-bold bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800">
                  ISWC Officiel
                </span>
              </div>
              <div>
                <strong className="text-sm font-bold text-white block group-hover:text-congo-yellow transition">
                  2. Droit d'Auteur BCDA
                </strong>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Dépôt d'œuvres (8 étapes), répartition des splits à 100% et certificats nationaux.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-congo-yellow font-semibold">
                <span>Mon Répertoire BCDA</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Pôle 3 : Moyo Publishing 360° */}
            <Link
              href="/publishing"
              className="p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl space-y-3 transition shadow-xl group"
            >
              <div className="flex justify-between items-start">
                <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition">
                  <Globe className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-800">
                  The MLC / CISAC
                </span>
              </div>
              <div>
                <strong className="text-sm font-bold text-white block group-hover:text-indigo-400 transition">
                  3. Moyo Publishing (360°)
                </strong>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Récupérez les droits d'auteur mondiaux si vous distribuez sur DistroKid ou TuneCore.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                <span>Rattacher un ISRC</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Pôle 4 : Airplay & Monitoring IA */}
            <Link
              href="/monitoring"
              className="p-5 bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-3xl space-y-3 transition shadow-xl group"
            >
              <div className="flex justify-between items-start">
                <span className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition">
                  <Radio className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-800">
                  IA 24/7
                </span>
              </div>
              <div>
                <strong className="text-sm font-bold text-white block group-hover:text-sky-400 transition">
                  4. Airplay Radios & TV
                </strong>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Détections acoustiques instantanées sur Télé Congo, DRTV et les radios FM.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-sky-400 font-semibold">
                <span>Voir les détections</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

          </div>
        </div>
      }

      {/* ESPACE ORGANISATEUR : mes événements & billetterie */}
      {role === "organizer" && 
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <Ticket className="w-5 h-5 text-congo-red" />
              <span>Mes Événements & Billetterie</span>
            </h2>
            <Link href="/billetterie/mes-evenements" className="text-xs text-congo-red hover:underline">
              Voir tous mes événements →
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
              <p className="text-xs text-slate-400">Vous n'avez pas encore créé d'événement.</p>
              <Link
                href="/billetterie/creer"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-congo-red hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Créer mon premier événement</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 6).map((evt: any) => (
                <Link
                  key={evt.id}
                  href="/billetterie/mes-evenements"
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-congo-red/50 rounded-3xl space-y-2 transition shadow-xl"
                >
                  <strong className="text-sm font-bold text-white block">{evt.title}</strong>
                  <p className="text-[11px] text-slate-400">
                    {evt.event_date ? new Date(evt.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Date à confirmer"}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 text-xs text-congo-yellow font-semibold">
                    {evt.tickets_sold || 0} / {evt.total_capacity || "—"} billets vendus
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      }

      {/* ESPACE PEINTRE : mes œuvres en galerie */}
      {role === "painter" && 
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-congo-yellow" />
              <span>Mes Œuvres en Galerie</span>
            </h2>
            <Link href="/galerie" className="text-xs text-congo-yellow hover:underline">
              Voir toute la galerie →
            </Link>
          </div>

          {artworks.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
              <p className="text-xs text-slate-400">Vous n'avez pas encore ajouté d'œuvre.</p>
              <Link
                href="/galerie/ajouter"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Ajouter ma première œuvre</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {artworks.slice(0, 8).map((art: any) => (
                <Link
                  key={art.id}
                  href="/galerie"
                  className="bg-slate-900 border border-slate-800 hover:border-congo-yellow/50 rounded-3xl overflow-hidden transition shadow-xl"
                >
                  {art.image_url && (
                    <img src={art.image_url} alt={art.title} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4 space-y-1">
                    <strong className="text-xs font-bold text-white block truncate">{art.title}</strong>
                    <span className="text-[11px] text-congo-yellow font-semibold">
                      {(art.price_fcfa || 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      }

      {/* ESPACE AGENT BCDA : collecte & détections en direct */}
      {role === "bcda_agent" && 
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-congo-yellow" />
              <span>Collecte BCDA & Détections en Direct</span>
            </h2>
            <Link href="/monitoring" className="text-xs text-congo-yellow hover:underline">
              Voir le monitoring complet →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 block">Œuvres Enregistrées</span>
              <strong className="text-xl font-black text-white">{bcdaStats?.total_works_registered ?? "—"}</strong>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 block">Établissements Licenciés</span>
              <strong className="text-xl font-black text-white">{bcdaStats?.total_licensed_venues ?? "—"}</strong>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 block">Collecté au Total</span>
              <strong className="text-xl font-black text-congo-yellow">
                {(bcdaStats?.total_collected_fcfa || 0).toLocaleString("fr-FR")} FCFA
              </strong>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 block">Reversé aux Artistes</span>
              <strong className="text-xl font-black text-emerald-400">
                {(bcdaStats?.total_paid_out_to_artists_fcfa || 0).toLocaleString("fr-FR")} FCFA
              </strong>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white">Dernières Détections Radio/TV</h3>
            </div>
            {recentDetections.length === 0 ? (
              <p className="p-5 text-xs text-slate-400">Aucune détection récente.</p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentDetections.slice(0, 8).map((det: any) => (
                  <div key={det.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white">{det.track_title}</strong>
                      <span className="text-slate-400"> — {det.artist_name}</span>
                      <p className="text-[10px] text-slate-500">{det.station_name} ({det.station_city})</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {det.detected_at ? new Date(det.detected_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }

      {/* 3. VUE RÉCAPITULATIVE DES PERFORMANCES & ACTIONS RAPIDES (réservée aux artistes) */}
      {(role === "artist" || role === "admin") && 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Gauche : Raccourcis d'actions Pro */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-congo-yellow" />
            <span>Actions Rapides</span>
          </h3>

          <div className="space-y-2.5 text-xs font-bold">
            <Link
              href="/bcda/deposer"
              className="w-full p-3 bg-congo-green hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-between transition shadow-md"
            >
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-4 h-4" />
                <span>Déposer une Œuvre BCDA (8 Étapes)</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/publishing"
              className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl flex items-center justify-between transition border border-slate-700"
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Importer un ISRC DistroKid</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/billetterie/mes-evenements"
              className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl flex items-center justify-between transition border border-slate-700"
            >
              <div className="flex items-center space-x-2">
                <Ticket className="w-4 h-4 text-congo-red" />
                <span>Créer un Concert / Billetterie</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/bcda/guide"
              className="w-full p-3 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-2xl flex items-center justify-between transition border border-slate-800"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-congo-yellow" />
                <span>Guide & FAQ SACEM/BCDA</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Colonne Droite : Statistiques d'Airplay & Droit d'Auteur */}
        <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <Radio className="w-4 h-4 text-sky-400" />
              <span>Dernières Détections Médias & Airplay 🇨🇬</span>
            </h3>
            <Link href="/monitoring" className="text-xs text-sky-400 hover:underline">
              Voir tout le monitoring →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Total Passages TV/Radio</span>
              <strong className="text-lg font-black text-white">
                {artistStats?.total_plays || 18} diffusions
              </strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Stations Actives</span>
              <strong className="text-lg font-black text-sky-400">
                {artistStats?.stations_count || 4} chaînes
              </strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Droits d'Auteur BCDA</span>
              <strong className="text-lg font-black text-congo-yellow">
                {(artistStats?.estimated_royalties_fcfa || 45000).toLocaleString("fr-FR")} FCFA
              </strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Droits Publishing (360°)</span>
              <strong className="text-lg font-black text-emerald-400">
                {(pubStats?.grand_total_fcfa || 125000).toLocaleString("fr-FR")} FCFA
              </strong>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-300">
                Dernière détection : <strong>"Rumba du Fleuve"</strong> sur <strong>Télé Congo HD</strong> (100% match)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Il y a 12 min</span>
          </div>
        </div>

      </div>
      }

      {/* MODAL RETRAIT MOBILE MONEY */}
      {isWithdrawModalOpen && 
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">Retrait Instantané Mobile Money 📲</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Opérateur Mobile *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawOperator("MTN")}
                    className={`py-2.5 rounded-xl font-bold border transition ${
                      withdrawOperator === "MTN" ? "bg-amber-500/20 border-congo-yellow text-congo-yellow" : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    MTN Mobile Money 🟡
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawOperator("Airtel")}
                    className={`py-2.5 rounded-xl font-bold border transition ${
                      withdrawOperator === "Airtel" ? "bg-rose-500/20 border-congo-red text-congo-red" : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    Airtel Money 🔴
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Numéro de Téléphone MoMo *</label>
                <input
                  type="tel"
                  required
                  placeholder="+242068001122"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Montant à Retirer (FCFA) *</label>
                <input
                  type="number"
                  required
                  min={500}
                  placeholder="Ex: 50000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-black text-base text-congo-yellow"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawing}
                  className="px-6 py-2 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl"
                >
                  {isWithdrawing ? "Paiement en cours..." : "Valider le Retrait 💸"}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  );
}
