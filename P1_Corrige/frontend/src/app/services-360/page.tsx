"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Youtube,
  Music2,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { servicesApi } from "@/lib/api";

// Forme exacte renvoyée par GET /api/services360/catalog (voir
// backend/src/modules/services360/services360.controller.ts)
interface CatalogService {
  type: string;
  title: string;
  description: string;
  price_fcfa: number;
  delivery_time: string;
}

export default function Services360Page() {
  const { user } = useAuth();
  const isArtist = user?.role === "artist" || user?.role === "admin";

  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);
  const [channelUrl, setChannelUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderResult, setOrderResult] = useState<{ message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoadingCatalog(true);
      setCatalogError("");
      try {
        const res = await servicesApi.getCatalog();
        if (!cancelled) {
          setCatalog(res.services || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setCatalogError(err.message || "Impossible de charger le catalogue des services.");
        }
      } finally {
        if (!cancelled) setIsLoadingCatalog(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const openOrder = (service: CatalogService) => {
    setSelectedService(service);
    setChannelUrl("");
    setNotes("");
    setOrderError("");
    setOrderResult(null);
  };

  const closeOrder = () => {
    setSelectedService(null);
    setOrderResult(null);
    setOrderError("");
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsOrdering(true);
    setOrderError("");
    try {
      const res = await servicesApi.orderService({
        service_type: selectedService.type,
        external_links: channelUrl ? { url: channelUrl } : {},
        description: notes || undefined,
      });
      setOrderResult({ message: res.message || "Demande enregistrée avec succès." });
    } catch (err: any) {
      setOrderError(err.message || "Erreur lors de la commande du service.");
    } finally {
      setIsOrdering(false);
    }
  };

  // VERROU STRICT : réservé aux artistes musiciens (et admin), comme sur le backend
  // (POST /services360/order et GET /services360/my-requests exigent le rôle 'artist').
  if (!user || !isArtist) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-congo-yellow/10 text-congo-yellow rounded-3xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Espace Réservé aux Artistes Musiciens</h1>
        <p className="text-xs text-slate-400">
          L'attribution de chaînes officielles YouTube (OAC 🎵), de badges de musique TikTok et de vérifications Spotify for Artists est réservée aux artistes musiciens.
        </p>
        <p className="text-[11px] text-congo-yellow">
          Votre rôle actuel : <strong>{user ? user.role : "Visiteur non connecté"}</strong>
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:text-white rounded-xl text-xs inline-block"
          >
            Retourner à l'Accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">

      {/* EN-TÊTE SERVICES 360° */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-xs font-bold text-congo-green">
            <Sparkles className="w-4 h-4 text-congo-yellow" />
            <span>Accompagnement Carrière • Écosystème Moyo Culture 360° 🇨🇬</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Professionnalisez vos profils d'artiste officiels
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Nos équipes techniques s'occupent des démarches auprès de YouTube, TikTok et Spotify pour certifier
            votre statut d'artiste, et du mastering/graphisme pour vos sorties.
          </p>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-right min-w-[220px] shadow-lg">
          <span className="text-[10px] text-slate-400 block font-semibold">Paiement Garanti & Direct :</span>
          <p className="text-xl font-black text-congo-yellow mt-1">Mobile Money</p>
          <span className="text-[11px] text-emerald-400 block">MTN MoMo & Airtel Money 🇨🇬</span>
        </div>
      </div>

      {/* CATALOGUE (chargé depuis /api/services360/catalog) */}
      {isLoadingCatalog && (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Chargement du catalogue des services...</span>
        </div>
      )}

      {!isLoadingCatalog && catalogError && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl text-red-200 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{catalogError}</span>
        </div>
      )}

      {!isLoadingCatalog && !catalogError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map((service) => (
            <div
              key={service.type}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition space-y-6 group"
            >
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-congo-green w-fit group-hover:scale-110 transition-transform">
                  {service.type === "youtube_oac" ? (
                    <Youtube className="w-6 h-6" />
                  ) : service.type === "spotify_verification" ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <Music2 className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-congo-green transition">
                    {service.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{service.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Délai : {service.delivery_time}</span>
                  </span>
                  <strong className="text-lg font-black text-congo-yellow">
                    {service.price_fcfa.toLocaleString()} FCFA
                  </strong>
                </div>

                <button
                  onClick={() => openOrder(service)}
                  className="px-4 py-2.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md"
                >
                  <span>Commander</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE COMMANDE */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            {orderResult ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Demande Enregistrée !</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">{orderResult.message}</p>
                <button
                  onClick={closeOrder}
                  className="px-6 py-2.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg transition"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmOrder} className="space-y-5">
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-congo-green font-bold uppercase tracking-wider">
                      Commande de Service 360°
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">{selectedService.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeOrder}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800"
                  >
                    ✕
                  </button>
                </div>

                {orderError && (
                  <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tarif du Service :</span>
                    <strong className="text-congo-yellow text-sm font-black">
                      {selectedService.price_fcfa.toLocaleString()} FCFA
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Délai estimé :</span>
                    <span className="text-white font-semibold">{selectedService.delivery_time}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-semibold block">
                    Lien de votre chaîne / profil officiel
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@monartiste ou @tiktok"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-green"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-semibold block">Précisions pour notre équipe</label>
                  <textarea
                    rows={3}
                    placeholder="Indiquez vos attentes particulières..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-green"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={closeOrder}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isOrdering}
                    className="px-6 py-2.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition shadow-lg disabled:opacity-50"
                  >
                    {isOrdering ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmer la Commande</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
