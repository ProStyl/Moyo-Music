"use client";

import { useState } from "react";
import Link from "next/link";
import { Music, Upload, CheckCircle, ArrowLeft, ArrowRight, Globe, Check, Layers } from "lucide-react";
import { releasesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Fonction de formatage déterministe pour éviter tout problème d'hydratation SSR / Client
const formatPrice = (val: number | string) => {
  if (!val) return "0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export default function NouvelleDistributionPage() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [releaseType, setReleaseType] = useState<"single" | "ep" | "album">("single");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Rumba Congolaise");
  const [primaryLanguage, setPrimaryLanguage] = useState("Lingala");
  const [releaseDate, setReleaseDate] = useState("2026-10-15");
  const [trackTitle, setTrackTitle] = useState("");
  const [composer, setComposer] = useState(user?.artist_name || user?.full_name || "Prince Nzassi");
  const [authorLyricist, setAuthorLyricist] = useState(user?.artist_name || user?.full_name || "Prince Nzassi");
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "spotify", "apple_music", "boomplay", "audiomack", "deezer", "youtube_music", "tiktok", "meta"
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<any>(null);

  const priceMap = {
    single: 5000,
    ep: 10000,
    album: 15000,
  };

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Veuillez saisir le titre de votre projet.");
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await releasesApi.create({
        title,
        release_type: releaseType,
        genre,
        primary_language: primaryLanguage,
        release_date: releaseDate,
        cover_image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
        record_label: user?.artist_name ? `${user.artist_name} Records` : "Indépendant",
        target_platforms: selectedPlatforms,
        tracks: [
          {
            title: trackTitle || title,
            composer: composer || user?.full_name,
            author_lyricist: authorLyricist || user?.full_name,
            duration_seconds: 230,
            audio_file_url: "https://example.com/audio/master.wav",
            audio_format: "wav",
          },
        ],
      });

      setSuccessData({
        upc: res.release?.upc_code || "607474900101",
        isrc: res.tracks?.[0]?.isrc_code || "CG-B01-26-10001",
        title,
        amount: priceMap[releaseType],
      });
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la distribution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Bouton Retour */}
      <div>
        <Link
          href="/distribution"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à mes Sorties Distribuées</span>
        </Link>
      </div>

      {/* Titre de la page */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex justify-between items-center">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-xs font-semibold text-congo-green mb-2">
            <Music className="w-3.5 h-3.5" />
            <span>Distribution Internationale • Standard TuneCore & SonoSuite 🇨🇬</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Distribuer une Nouvelle Musique
          </h1>
        </div>

        <div className="text-right">
          <span className="text-slate-400 text-xs block">Tarif Forfaitaire :</span>
          <strong className="text-xl font-black text-congo-yellow">{formatPrice(priceMap[releaseType])} FCFA</strong>
        </div>
      </div>

      {/* Indicateur d'étapes */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: "Format & Titre" },
          { num: 2, label: "Fichiers & Métadonnées" },
          { num: 3, label: "DSPs & Répartition" },
          { num: 4, label: "Confirmation & ISRC" },
        ].map((s) => 
          <div
            key={s.num}
            className={`p-3 rounded-2xl border text-center transition ${
              step === s.num
                ? "bg-congo-green/10 border-congo-green text-congo-green font-bold"
                : step > s.num
                ? "bg-slate-900 border-slate-700 text-slate-300"
                : "bg-slate-950 border-slate-800 text-slate-600"
            }`}
          >
            <span className="text-[10px] block uppercase font-mono">Étape {s.num}</span>
            <span className="text-xs font-semibold">{s.label}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ÉTAPE 1 : FORMAT & TITRE */}
      {/* ========================================================================= */}
      {step === 1 && 
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-congo-green" />
            <span>1. Choisissez le format de votre sortie</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setReleaseType("single")}
              className={`p-5 rounded-2xl border text-left transition space-y-2 ${
                releaseType === "single"
                  ? "bg-congo-green/10 border-congo-green text-white shadow-lg"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-congo-green">Single (1 Titre)</span>
                {releaseType === "single" && <Check className="w-4 h-4 text-congo-green" />}
              </div>
              <strong className="text-xl font-black block text-white">5 000 FCFA</strong>
              <p className="text-[11px] text-slate-400">Idéal pour lancer un nouveau single radio ou clip.</p>
            </button>

            <button
              type="button"
              onClick={() => setReleaseType("ep")}
              className={`p-5 rounded-2xl border text-left transition space-y-2 ${
                releaseType === "ep"
                  ? "bg-congo-green/10 border-congo-green text-white shadow-lg"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-congo-yellow">EP (2 à 6 Titres)</span>
                {releaseType === "ep" && <Check className="w-4 h-4 text-congo-yellow" />}
              </div>
              <strong className="text-xl font-black block text-white">10 000 FCFA</strong>
              <p className="text-[11px] text-slate-400">Format tremplin pour mini-album ou collaboration.</p>
            </button>

            <button
              type="button"
              onClick={() => setReleaseType("album")}
              className={`p-5 rounded-2xl border text-left transition space-y-2 ${
                releaseType === "album"
                  ? "bg-congo-green/10 border-congo-green text-white shadow-lg"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-congo-red">Album (7+ Titres)</span>
                {releaseType === "album" && <Check className="w-4 h-4 text-congo-red" />}
              </div>
              <strong className="text-xl font-black block text-white">15 000 FCFA</strong>
              <p className="text-[11px] text-slate-400">Sortie d'album complète avec distribution mondiale.</p>
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Titre du Projet / Morceau *</label>
              <input
                type="text"
                required
                placeholder="Ex: Rumba Na Couleurs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-congo-green"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Genre Musical Principal</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value="Rumba Congolaise">Rumba Congolaise</option>
                  <option value="Soukous / Ndombolo">Soukous / Ndombolo</option>
                  <option value="Afrobeat Congo">Afrobeat Congo</option>
                  <option value="Gospel Congolais">Gospel Congolais</option>
                  <option value="Rap / Hip-Hop 242">Rap / Hip-Hop 242</option>
                  <option value="Folklore & Traditionnel">Folklore & Traditionnel</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Langue Principale</label>
                <select
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value="Lingala">Lingala 🇨🇬</option>
                  <option value="Kituba / Munukutuba">Kituba / Munukutuba 🇨🇬</option>
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              disabled={!title.trim()}
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition disabled:opacity-50"
            >
              <span>Suivant : Fichiers Audio & Pochette</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 2 : FICHIERS & MÉTADONNÉES */}
      {/* ========================================================================= */}
      {step === 2 && 
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Upload className="w-5 h-5 text-sky-400" />
            <span>2. Téléversement Audio Master & Pochette</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Audio Master */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <label className="text-emerald-400 font-bold flex items-center space-x-2">
                <Music className="w-4 h-4" />
                <span>Fichier Audio Master (.WAV / .FLAC) *</span>
              </label>
              <p className="text-[11px] text-slate-400">Format non compressé 24-bit 44.1kHz requis par Spotify & Apple Music.</p>
              <input
                type="file"
                accept="audio/*"
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-congo-green file:text-white hover:file:bg-emerald-600 cursor-pointer"
              />
            </div>

            {/* Pochette */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <label className="text-congo-yellow font-bold flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Pochette HD (3000 x 3000 px) *</span>
              </label>
              <p className="text-[11px] text-slate-400">Image carrée haute résolution JPG ou PNG sans logo de réseaux sociaux.</p>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Titre de la Piste</label>
              <input
                type="text"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder={title || "Reprend le titre du projet si vide"}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Date de Sortie Prévue</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Auteur des Paroles</label>
              <input
                type="text"
                value={authorLyricist}
                onChange={(e) => setAuthorLyricist(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Compositeur de la Musique</label>
              <input
                type="text"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center space-x-2"
            >
              <span>Suivant : Plateformes DSPs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 3 : DSPS & VALIDATION */}
      {/* ========================================================================= */}
      {step === 3 && 
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Globe className="w-5 h-5 text-purple-400" />
            <span>3. Plateformes de Streaming & Paiement MoMo</span>
          </h2>

          <div className="space-y-3">
            <label className="text-xs text-slate-400 font-semibold block">Sélectionnez les DSPs :</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: "spotify", name: "Spotify" },
                { id: "apple_music", name: "Apple Music" },
                { id: "boomplay", name: "Boomplay" },
                { id: "tiktok", name: "TikTok / Meta" },
                { id: "audiomack", name: "Audiomack" },
                { id: "deezer", name: "Deezer" },
                { id: "youtube_music", name: "YouTube Music" },
                { id: "amazon", name: "Amazon Music" },
              ].map((dsp) => {
                const isChecked = selectedPlatforms.includes(dsp.id);
                return (
                  <button
                    key={dsp.id}
                    type="button"
                    onClick={() => togglePlatform(dsp.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      isChecked
                        ? "bg-slate-950 border-congo-green text-white font-bold"
                        : "bg-slate-950/60 border-slate-800 text-slate-500"
                    }`}
                  >
                    <span>{dsp.name}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 text-congo-green" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 block">Total à régler pour la distribution :</span>
              <strong className="text-xl font-black text-congo-yellow">{formatPrice(priceMap[releaseType])} FCFA</strong>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              Déduit automatiquement de votre <strong>Portefeuille MoMo</strong>
            </div>
          </div>

          {error && 
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs">
              {error}
            </div>
          }

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-3.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xl transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? 
                <span>Transmission SonoSuite en cours...</span>
               : 
                <span>Valider & Distribuer ({formatPrice(priceMap[releaseType])} FCFA) 🚀</span>
              }
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 4 : CONFIRMATION & ISRC */}
      {/* ========================================================================= */}
      {step === 4 && successData && 
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Sortie Validée & Transmise !</h2>
            <p className="text-xs text-slate-400 mt-1">
              Votre projet <strong>"{successData.title}"</strong> a été encodé et envoyé à SonoSuite DDEX.
            </p>
          </div>

          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-3 text-xs font-mono max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-500">Code UPC :</span>
              <strong className="text-white">{successData.upc}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Code ISRC National :</span>
              <strong className="text-congo-green">{successData.isrc}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Frais Réglés :</span>
              <strong className="text-congo-yellow">{formatPrice(successData.amount)} FCFA</strong>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Link
              href="/distribution"
              className="px-6 py-3.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-lg"
            >
              Voir mon Catalogue de Sorties
            </Link>
          </div>
        </div>
      }

    </div>
  );
}
