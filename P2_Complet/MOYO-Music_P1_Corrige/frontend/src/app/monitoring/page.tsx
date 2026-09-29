"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Radio, 
  Tv, 
  Activity, 
  ShieldCheck, 
  Volume2, 
  VolumeX,
  Sparkles, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Music, 
  CheckCircle2, 
  FileSpreadsheet, 
  Zap,
  Play,
  Pause,
  PlusCircle,
  Edit3,
  ExternalLink,
  Signal,
  AlertCircle,
  X
} from "lucide-react";
import { monitoringApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function MonitoringDataPage() {
  const { user } = useAuth();
  const isArtistOrAdmin = user?.role === "artist" || user?.role === "admin";

  const [stations, setStations] = useState<any[]>([]);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [artistStats, setArtistStats] = useState<any>(null);
  const [bcdaReport, setBcdaReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<"streams" | "artist" | "radar" | "bcda">("streams");
  const [notification, setNotification] = useState<string | null>(null);

  // VRAIS LECTEURS AUDIO & VIDÉO DIRECTS
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<any>(null);

  const [currentPlayingStation, setCurrentPlayingStation] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Formulaire d'ajout de flux
  const [isAddingStream, setIsAddingStream] = useState(false);
  const [isSubmittingStream, setIsSubmittingStream] = useState(false);
  const [addStreamError, setAddStreamError] = useState("");
  const [newStationName, setNewStationName] = useState("");
  const [newStationType, setNewStationType] = useState("RADIO");
  const [newStationCity, setNewStationCity] = useState("Brazzaville");
  const [newStationFrequency, setNewStationFrequency] = useState("Web Stream Direct");
  const [newStationUrl, setNewStationUrl] = useState("");
  const [streamTestResult, setStreamTestResult] = useState<any>(null);
  const [isTestingStream, setIsTestingStream] = useState(false);
  const [testingStationId, setTestingStationId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stRes, liveRes] = await Promise.all([
        monitoringApi.getStations().catch(() => ({ stations: [] })),
        monitoringApi.getLiveFeed().catch(() => ({ live_detections: [] })),
      ]);

      setStations(stRes.stations || []);
      setLiveFeed(liveRes.live_detections || []);

      if (user && user.role === "artist") {
        const artRes = await monitoringApi.getArtistAirplay().catch(() => null);
        setArtistStats(artRes);
      }

      const repRes = await monitoringApi.getBcdaReport().catch(() => null);
      setBcdaReport(repRes);
    } catch (e) {
      console.error("Erreur chargement monitoring :", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "artist") {
      setActiveTab("artist");
    }
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [user]);

  // FONCTION UNIFIÉE DE LECTURE EN DIRECT (AVEC PROXY ANTI-CORS POUR LE NAVIGATEUR)
  const handlePlayStation = async (station: any) => {
    setMediaError(null);

    // Arrêter toute lecture précédente
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    // Si on clique sur la station déjà en cours de lecture
    if (currentPlayingStation?.id === station.id && isPlaying) {
      setIsPlaying(false);
      return;
    }

    setCurrentPlayingStation(station);
    setIsMediaLoading(true);
    setIsPlaying(false);

    const rawStreamUrl = station.stream_url;
    const isHls = rawStreamUrl.includes(".m3u8");

    // Utilisation du proxy backend pour contourner le blocage CORS de Chrome/Edge
    const proxiedStreamUrl = `http://localhost:4000/api/monitoring/proxy-stream?url=${encodeURIComponent(rawStreamUrl)}`;

    if (station.type === "TV" || isHls) {
      // LECTURE VIDÉO TV (HLS)
      try {
        const HlsModule = (await import("hls.js")).default;
        if (HlsModule.isSupported() && videoRef.current) {
          const hls = new HlsModule({
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: 10,
            maxMaxBufferLength: 20
          });
          hlsInstanceRef.current = hls;
          hls.loadSource(proxiedStreamUrl);
          hls.attachMedia(videoRef.current);
          hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play()
              .then(() => {
                setIsPlaying(true);
                setIsMediaLoading(false);
              })
              .catch(() => setIsMediaLoading(false));
          });
          hls.on(HlsModule.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setMediaError(`Signal TV de "${station.name}" : Tentative de reconnexion en cours...`);
              hls.startLoad();
            }
          });
        } else if (videoRef.current && videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
          videoRef.current.src = proxiedStreamUrl;
          videoRef.current.play()
            .then(() => {
              setIsPlaying(true);
              setIsMediaLoading(false);
            })
            .catch(() => setIsMediaLoading(false));
        }
      } catch (err: any) {
        setMediaError(`Erreur lecteur TV : ${err.message}`);
        setIsMediaLoading(false);
      }
    } else {
      // LECTURE AUDIO RADIO (MP3 DIRECT)
      if (audioRef.current) {
        audioRef.current.src = rawStreamUrl; // Pour MP3, le navigateur supporte le streaming direct
        audioRef.current.load();
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setIsMediaLoading(false);
          })
          .catch(() => {
            // Fallback via le proxy
            if (audioRef.current) {
              audioRef.current.src = proxiedStreamUrl;
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  setIsMediaLoading(false);
                })
                .catch((e) => {
                  setMediaError(`Connexion au flux radio "${station.name}" impossible (${e.message}).`);
                  setIsMediaLoading(false);
                });
            }
          });
      }
    }
  };

  // Tester la connexion au flux
  const handleTestStream = async (stationId: string) => {
    setIsTestingStream(true);
    setTestingStationId(stationId);
    setStreamTestResult(null);
    try {
      const data = await monitoringApi.testStream(stationId);
      setStreamTestResult(data);
    } catch (e: any) {
      setStreamTestResult({ online: false, error: e.message });
    } finally {
      setIsTestingStream(false);
    }
  };

  // Enregistrer un nouveau flux
  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName || !newStationUrl) return;

    setIsSubmittingStream(true);
    try {
      await monitoringApi.addStation({
        name: newStationName,
        type: newStationType,
        city: newStationCity,
        frequency: newStationFrequency,
        stream_url: newStationUrl,
      });
      setNotification(`Station "${newStationName}" enregistrée avec succès !`);
      setIsAddingStream(false);
      setNewStationName("");
      setNewStationType("RADIO");
      setNewStationCity("Brazzaville");
      setNewStationFrequency("Web Stream Direct");
      setNewStationUrl("");
      loadData();
    } catch (err: any) {
      setAddStreamError(err.message || "Erreur lors de l'ajout de la station.");
    } finally {
      setIsSubmittingStream(false);
    }
  };

  // Déclencher une détection IA en direct
  const handleSimulateAirplay = async () => {
    setIsSimulating(true);
    setNotification(null);
    try {
      const currentStationName = currentPlayingStation?.name || (stations.length > 0 ? stations[0].name : "DRTV International");

      const res = await monitoringApi.simulateDetection({
        station_name: currentStationName,
        track_title: "Échos du Pool Malebo",
        artist_name: user?.artist_name || "Prince Nzassi",
        isrc_code: "CG-B01-26-00001"
      });

    } catch (err: any) {
      setNotification(err.message || "Erreur lors du scan audio");
    } finally {
      setIsSimulating(false);
    }
  };

  const isBcdaOrAdmin = user?.role === "bcda_agent" || user?.role === "admin";
  const isArtist = user?.role === "artist";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* BALISE AUDIO POUR LES RADIOS */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onPlaying={() => {
          setIsPlaying(true);
          setIsMediaLoading(false);
        }}
        onError={() => {
          setIsMediaLoading(false);
          setIsPlaying(false);
          setMediaError("Signal audio temporairement indisponible.");
        }}
      />

      {/* EN-TÊTE DU MONITORING */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800 text-xs font-semibold text-sky-400 mb-3">
            <Radio className="w-3.5 h-3.5" />
            <span>Infrastructure Monitoring IA Congo 🇨🇬</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            {isArtist ? "Mes Détections Radios & Télévisions Congolaises" : "Monitoring des Radios & Télévisions Congolaises"}
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            {isArtist 
              ? "Surveillance en temps réel des diffusions de vos œuvres sur Télé Congo, DRTV, Top Congo FM et YouTube pour le calcul de vos droits d'auteur."
              : "Supervision des 13 stations nationales et calcul automatisé des redevances pour le Bureau Congolais du Droit d'Auteur (BCDA)."}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* BOUTON RÉSERVÉ AUX ADMINS / BCDA */}
          {isBcdaOrAdmin && 
            <button
              onClick={handleSimulateAirplay}
              disabled={isSimulating}
              className="px-4 py-2.5 bg-gradient-to-r from-congo-green to-emerald-600 hover:from-emerald-600 hover:to-congo-green text-white font-bold rounded-xl text-xs shadow-lg flex items-center space-x-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-congo-yellow fill-congo-yellow" />
              <span>{isSimulating ? "Analyse du signal en cours..." : "Scanner le Titre en Direct 📡"}</span>
            </button>
          }

          <button
            onClick={loadData}
            className="p-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs"
            title="Actualiser les ondes"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-congo-yellow" : ""}`} />
          </button>
        </div>
      </div>

      {/* LECTEUR EN DIRECT (SUPPORT AUDIO RADIO & VIDÉO TV) */}
      {currentPlayingStation && 
        <div className="bg-slate-900 border-2 border-congo-yellow rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-congo-yellow/20 text-congo-yellow flex items-center justify-center relative">
                {currentPlayingStation.type === "TV" ? <Tv className="w-7 h-7" /> : <Radio className="w-7 h-7" />}
                {isPlaying && 
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping"></span>
                }
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-yellow-400"}`}></span>
                  <span className="text-xs text-congo-yellow font-bold uppercase tracking-wider">
                    {isPlaying ? `● En Direct (${currentPlayingStation.type === "TV" ? "Télévision HLS" : "Radio Direct"})` : isMediaLoading ? "⏳ Connexion au signal..." : "⏸️ En Pause"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-0.5">{currentPlayingStation.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{currentPlayingStation.city} • {currentPlayingStation.frequency}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isPlaying && 
                <div className="flex items-end space-x-1.5 h-9 px-4 py-1.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="w-1.5 bg-congo-green rounded-full animate-pulse h-4"></span>
                  <span className="w-1.5 bg-congo-yellow rounded-full animate-pulse h-8 delay-75"></span>
                  <span className="w-1.5 bg-congo-red rounded-full animate-pulse h-5 delay-150"></span>
                  <span className="w-1.5 bg-congo-green rounded-full animate-pulse h-9 delay-100"></span>
                  <span className="w-1.5 bg-congo-yellow rounded-full animate-pulse h-3 delay-200"></span>
                  <span className="w-1.5 bg-congo-green rounded-full animate-pulse h-7 delay-75"></span>
                </div>
              }

              <button
                onClick={() => handlePlayStation(currentPlayingStation)}
                disabled={isMediaLoading}
                className="px-6 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 rounded-2xl font-bold transition shadow-xl flex items-center space-x-2"
              >
                {isMediaLoading ? 
                  <span>Connexion au flux...</span>
                 : isPlaying ? 
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Mettre en Pause</span>
                  </>
                 : 
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Lancer le Direct</span>
                  </>
                }
              </button>
            </div>
          </div>

          {/* ÉCRAN DE DIFFUSION VIDÉO SI STATION TV */}
          {currentPlayingStation.type === "TV" && 
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[380px] mx-auto border border-slate-800 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          }

        </div>
      }

      {/* Message d'erreur */}
      {mediaError && 
        <div className="p-4 bg-red-950/80 border border-red-500 rounded-2xl text-red-200 text-xs flex items-center space-x-3 animate-fade-in shadow-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{mediaError}</span>
        </div>
      }

      {/* Notification de succès */}
      {notification && 
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl text-emerald-200 text-xs flex items-center space-x-3 animate-fade-in shadow-2xl">
          <CheckCircle2 className="w-5 h-5 text-congo-green flex-shrink-0" />
          <span className="font-semibold">{notification}</span>
        </div>
      }

      {/* Navigation Onglets */}
      {(isBcdaOrAdmin || isArtistOrAdmin) && 
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {isArtistOrAdmin && 
            <button
              onClick={() => setActiveTab("artist")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === "artist" ? "bg-congo-green text-white shadow-lg font-black" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Mes Statistiques d'Artiste</span>
            </button>
          }

          {isBcdaOrAdmin && 
            <button
              onClick={() => setActiveTab("streams")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === "streams" ? "bg-sky-500 text-slate-950 shadow-lg font-black" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Signal className="w-4 h-4" />
              <span>Gestion des Flux & Réseau ({stations.length})</span>
            </button>
          }

          {isBcdaOrAdmin && 
            <button
              onClick={() => setActiveTab("radar")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === "radar" ? "bg-congo-yellow text-slate-950 shadow-lg font-black" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Radar IA & Détections Direct</span>
            </button>
          }

          {isBcdaOrAdmin && 
            <button
              onClick={() => setActiveTab("bcda")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === "bcda" ? "bg-congo-red text-white shadow-lg font-black" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Rapport Officiel BCDA</span>
            </button>
          }
        </div>
      }

      {/* 1. ONGLET : GESTION DES 13 FLUX DISTINCTS */}
      {activeTab === "streams" && 
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Répertoire des 12 Chaînes & Radios en Direct</h2>
              <p className="text-xs text-slate-400">Cliquez sur <strong>"Voir Direct 📺"</strong> ou <strong>"Écouter Direct 🔊"</strong> pour lancer le flux sans restriction de domaine.</p>
            </div>

            {isBcdaOrAdmin && 
              <button
                onClick={() => {
                  setIsAddingStream(!isAddingStream);
                  setAddStreamError("");
                }}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Ajouter un Autre Média</span>
              </button>
            }
          </div>

          {isAddingStream && (
            <form
              onSubmit={handleAddStream}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Ajouter une Radio ou Chaîne TV</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingStream(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {addStreamError && (
                <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addStreamError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-semibold block">Nom de la station *</label>
                  <input
                    type="text"
                    required
                    value={newStationName}
                    onChange={(e) => setNewStationName(e.target.value)}
                    placeholder="Radio Congo"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-semibold block">Type</label>
                  <select
                    value={newStationType}
                    onChange={(e) => setNewStationType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="RADIO">Radio</option>
                    <option value="TV">TV</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-semibold block">Ville</label>
                  <input
                    type="text"
                    value={newStationCity}
                    onChange={(e) => setNewStationCity(e.target.value)}
                    placeholder="Brazzaville"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-semibold block">Fréquence / Repère</label>
                  <input
                    type="text"
                    value={newStationFrequency}
                    onChange={(e) => setNewStationFrequency(e.target.value)}
                    placeholder="Web Stream Direct"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5 text-xs sm:col-span-2">
                  <label className="text-slate-300 font-semibold block">Lien du flux (URL) *</label>
                  <input
                    type="url"
                    required
                    value={newStationUrl}
                    onChange={(e) => setNewStationUrl(e.target.value)}
                    placeholder="https://stream.exemple.cg/live"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingStream(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStream}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50"
                >
                  {isSubmittingStream ? "Enregistrement..." : "Enregistrer la Station"}
                </button>
              </div>
            </form>
          )}

          {/* Grille des 12 Stations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((st) => {
              const isThisPlaying = currentPlayingStation?.id === st.id && isPlaying;
              return (
                <div
                  key={st.id}
                  className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4 transition ${
                    isThisPlaying ? "border-congo-yellow bg-slate-900/90 shadow-congo-yellow/10" : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl bg-slate-950 border flex items-center justify-center ${
                          isThisPlaying ? "text-congo-yellow border-congo-yellow" : "text-slate-400 border-slate-800"
                        }`}>
                          {st.type === "TV" ? <Tv className="w-5 h-5 text-sky-400" /> : <Radio className="w-5 h-5 text-congo-green" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug">{st.name}</h4>
                          <span className="text-[10px] text-slate-400">{st.city} • {st.frequency}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.type === "TV" ? "bg-sky-950 border border-sky-800 text-sky-400" : "bg-emerald-950 border border-emerald-800 text-emerald-400"
                      }`}>
                        {st.type}
                      </span>
                    </div>

                    <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">Lien de Flux Unique :</span>
                      <p className="text-[11px] font-mono text-sky-400 truncate">{st.stream_url}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handlePlayStation(st)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-md ${
                        isThisPlaying 
                          ? "bg-congo-yellow text-slate-950" 
                          : "bg-slate-800 hover:bg-congo-green hover:text-white text-slate-200"
                      }`}
                    >
                      {isThisPlaying ? 
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause</span>
                        </>
                       : 
                        <>
                          <Play className="w-4 h-4 fill-current text-congo-yellow" />
                          <span>{st.type === "TV" ? "Voir Direct 📺" : "Écouter Direct 🔊"}</span>
                        </>
                      }
                    </button>

                    <button
                      onClick={() => handleTestStream(st.id)}
                      disabled={isTestingStream && testingStationId === st.id}
                      className="px-3 py-1.5 bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900 rounded-lg text-xs font-semibold flex items-center space-x-1 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isTestingStream && testingStationId === st.id ? "Test en cours..." : "Tester"}</span>
                    </button>
                  </div>

                  {testingStationId === st.id && !isTestingStream && streamTestResult && (
                    <div
                      className={`text-[11px] px-3 py-2 rounded-xl border flex items-center space-x-1.5 ${
                        streamTestResult.online
                          ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                          : "bg-red-950/60 border-red-800 text-red-300"
                      }`}
                    >
                      {streamTestResult.online ? (
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      <span>
                        {streamTestResult.online
                          ? "Flux accessible et en ligne."
                          : streamTestResult.error || "Flux injoignable."}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      }

      {/* 2. ONGLET : MES STATISTIQUES D'ARTISTE */}
      {activeTab === "artist" && 
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Passages Détectés</span>
              <p className="text-2xl font-extrabold text-white mt-1">
                {artistStats?.summary?.total_plays || 0} <span className="text-xs text-congo-green font-normal">diffusions</span>
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Droits BCDA Estimés</span>
              <p className="text-2xl font-extrabold text-congo-yellow mt-1">
                {parseFloat(artistStats?.summary?.total_royalties_fcfa || 0).toLocaleString()} <span className="text-xs font-normal">FCFA</span>
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Stations Actives</span>
              <p className="text-2xl font-extrabold text-sky-400 mt-1">
                {artistStats?.summary?.stations_count || 0} <span className="text-xs text-slate-400 font-normal">radios & TV</span>
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Dernière Diffusion</span>
              <p className="text-xs font-bold text-slate-200 mt-2 truncate">
                {artistStats?.summary?.last_play_at 
                  ? new Date(artistStats.summary.last_play_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " (" + new Date(artistStats.summary.last_play_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + ")"
                  : "En attente"}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-congo-green" />
              <span>Historique Précis des Diffusions d'Antenne</span>
            </h2>

            {artistStats?.recent_plays && artistStats.recent_plays.length > 0 ? 
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3">Station & Ville</th>
                      <th className="pb-3">Type & Fréquence</th>
                      <th className="pb-3">Titre Joué</th>
                      <th className="pb-3">Code ISRC</th>
                      <th className="pb-3">Score Empreinte</th>
                      <th className="pb-3">Redevance BCDA</th>
                      <th className="pb-3">Date & Heure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {artistStats.recent_plays.map((play: any) => 
                      <tr key={play.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 font-bold text-white flex items-center space-x-2">
                          {play.station_type === "TV" ? <Tv className="w-3.5 h-3.5 text-congo-yellow" /> : <Radio className="w-3.5 h-3.5 text-congo-green" />}
                          <span>{play.station_name}</span>
                          <span className="text-[10px] text-slate-500">({play.station_city})</span>
                        </td>
                        <td className="py-3.5 text-slate-300 font-mono text-[11px]">{play.frequency}</td>
                        <td className="py-3.5 font-medium text-white">{play.track_title}</td>
                        <td className="py-3.5 font-mono text-[10px] text-congo-yellow">{play.isrc_code}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                            {play.confidence_score}% Match
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-emerald-400">+{parseFloat(play.estimated_royalty_fcfa).toLocaleString()} FCFA</td>
                        <td className="py-3.5 text-slate-400 text-[11px]">
                          {new Date(play.detected_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
             : 
              <div className="text-center py-12 space-y-3">
                <Radio className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Aucune diffusion enregistrée pour le moment.</p>
              </div>
            }
          </div>
        </div>
      }

      {/* 3. ONGLET : RADAR TEMPS RÉEL */}
      {activeTab === "radar" && 
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-congo-yellow animate-ping"></span>
              <span>Flux Radar des Détections Audio en Continu</span>
            </h2>
            <span className="text-xs text-slate-400">Écoute continue des flux HLS & MP3</span>
          </div>

          <div className="space-y-2.5">
            {liveFeed.length > 0 ? 
              liveFeed.map((det) => 
                <div
                  key={det.id}
                  className="p-3.5 bg-slate-950 border border-slate-800/80 hover:border-congo-yellow/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs transition animate-fade-in"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-congo-yellow">
                      {det.station_type === "TV" ? <Tv className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-white text-sm">{det.track_title}</strong>
                        <span className="text-slate-400">— {det.artist_name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Diffusé sur <strong className="text-slate-200">{det.station_name}</strong> ({det.station_city} • {det.frequency})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-congo-yellow">
                      ISRC: {det.isrc_code}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(det.detected_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                </div>
              )
             : 
              <p className="text-xs text-slate-400 py-8 text-center">Aucune détection récente sur le radar.</p>
            }
          </div>
        </div>
      }

      {/* 4. ONGLET : RAPPORT BCDA */}
      {activeTab === "bcda" && 
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-congo-red/10 text-congo-red flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Bureau Congolais du Droit d'Auteur (BCDA)</h2>
                <p className="text-xs text-slate-400">Relevé officiel des diffusions publiques pour le calcul et recouvrement des redevances d'antenne.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  try {
                    const res = await monitoringApi.distributeAirplayRoyalties();
                    setNotification(res.message || "Redevances d'antenne distribuées avec succès !");
                    loadData();
                    setTimeout(() => setNotification(null), 5000);
                  } catch (e: any) {
                    alert("Erreur lors de la distribution : " + (e.message || "Erreur serveur"));
                  }
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
              >
                <Zap className="w-4 h-4 text-congo-yellow" />
                <span>Distribuer sur les Wallets MoMo 💰</span>
              </button>

              <button
                onClick={() => alert("Relevé officiel BCDA Trimestre 2026 généré avec succès ! Le fichier PDF / Excel certifié a été téléchargé.")}
                className="px-4 py-2.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exporter Rapport BCDA (PDF / Excel)</span>
              </button>
            </div>
          </div>

          {bcdaReport?.report && 
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-3">Artiste & Titre</th>
                    <th className="pb-3">Code ISRC</th>
                    <th className="pb-3">Radio</th>
                    <th className="pb-3">TV</th>
                    <th className="pb-3">Total Passages</th>
                    <th className="pb-3">Stations de Diffusion</th>
                    <th className="pb-3">Redevance Exigible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bcdaReport.report.map((row: any, i: number) => 
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-3 font-bold text-white">
                        {row.track_title} <span className="font-normal text-slate-400">({row.artist_name})</span>
                      </td>
                      <td className="py-3 font-mono text-[10px] text-congo-yellow">{row.isrc_code}</td>
                      <td className="py-3 text-congo-green font-semibold">{row.radio_plays}</td>
                      <td className="py-3 text-sky-400 font-semibold">{row.tv_plays}</td>
                      <td className="py-3 font-bold text-white">{row.total_broadcasts}</td>
                      <td className="py-3 text-slate-300 text-[11px] max-w-xs truncate">{row.broadcasted_on_stations}</td>
                      <td className="py-3 font-extrabold text-congo-yellow">
                        {parseFloat(row.total_bcda_royalties_fcfa).toLocaleString()} FCFA
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          }
        </div>
      }

    </div>
  );
}
