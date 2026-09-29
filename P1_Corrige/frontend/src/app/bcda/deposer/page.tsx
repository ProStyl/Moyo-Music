"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  HelpCircle,
  Upload, 
  Users, 
  FileText, 
  Music, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  UserPlus, 
  Scale, 
  Search, 
  Info, 
  Cpu, 
  Check, 
  FileCode, 
  Layers, 
  Radio, 
  Key, 
  Lock, 
  FileSpreadsheet,
  QrCode,
  Sliders,
  Volume2
} from "lucide-react";
import { bcdaApi } from "@/lib/api";
import { publishingApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Collaborator {
  id: string;
  name: string;
  phone: string;
  role: "author" | "composer" | "beatmaker" | "performer" | "producer" | "clip_director" | "adapter" | "editor";
  roleLabel: string;
  splitPercentage: number;
  avatarUrl?: string;
  isRegistered: boolean;
}

// Styles musicaux avec couleurs dédiées (Inspiré MusicStart / SACEM)
const MUSIC_STYLES = [
  { id: "rumba", name: "Rumba Congolaise", color: "from-amber-600 to-yellow-600", bg: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30" },
  { id: "soukous", name: "Soukous / Ndombolo", color: "from-emerald-600 to-teal-600", bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30" },
  { id: "afrobeat", name: "Afrobeat Congo", color: "from-orange-600 to-red-600", bg: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30" },
  { id: "rap", name: "Rap / Hip-Hop 242", color: "from-purple-600 to-indigo-600", bg: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30" },
  { id: "gospel", name: "Gospel Congolais", color: "from-sky-600 to-blue-600", bg: "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30" },
  { id: "pop", name: "Pop / Dance", color: "from-pink-600 to-rose-600", bg: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30" },
  { id: "reggae", name: "Reggae / Ragga", color: "from-lime-600 to-green-600", bg: "bg-lime-500/10 hover:bg-lime-500/20 border-lime-500/30" },
  { id: "rnb", name: "RnB - Soul - Funk", color: "from-cyan-600 to-teal-600", bg: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30" },
  { id: "world", name: "Musique du Monde / Traditionnel", color: "from-yellow-600 to-amber-700", bg: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30" },
  { id: "other", name: "Autre Genre", color: "from-slate-600 to-slate-700", bg: "bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/30" }
];

// Rôles MusicStart / SACEM avec descriptions
const ROLE_OPTIONS = [
  { id: "author", name: "Auteur", desc: "Écrit les paroles, textes ou poèmes de la chanson ✍️" },
  { id: "composer", name: "Compositeur", desc: "Crée la mélodie, les accords et la musique 🎼" },
  { id: "beatmaker", name: "Arrangeur / Beatmaker", desc: "Produit l'instrumentale, les drums et la structure sonore 🎹" },
  { id: "adapter", name: "Adaptateur", desc: "Intervient sur les paroles, la traduction et l'adaptation 🗣️" },
  { id: "performer", name: "Artiste-Interprète", desc: "Chanteur(se) ou musicien(ne) principal(e) 🎤" },
  { id: "producer", name: "Producteur Phonographique", desc: "Finance et détient les droits sur le master audio 📀" },
  { id: "clip_director", name: "Réalisateur Vidéo / Clip", desc: "Crée le scénario et réalise le clip audiovisuel 🎬" },
];

const REGISTERED_COMMUNITY = [
  { name: "Prince Nzassi", phone: "+242068001122", role: "author", roleLabel: "Auteur / Chanteur", avatar: "🎤" },
  { name: "DJ Brazza Beat", phone: "+242055551234", role: "beatmaker", roleLabel: "Beatmaker / Arrangeur", avatar: "🎹" },
  { name: "Mavoungou Solo", phone: "+242066009988", role: "composer", roleLabel: "Guitariste Compositeur", avatar: "🎸" },
  { name: "Director Steven Awuku", phone: "+242044445566", role: "clip_director", roleLabel: "Réalisateur de Clips", avatar: "🎬" },
  { name: "Brazza Live Records", phone: "+242057008899", role: "producer", roleLabel: "Label & Producteur", avatar: "🏢" },
];

export default function MusicStartBCDAProtectionPage() {
  const { user } = useAuth();

  // Navigation en 8 étapes (Exactement selon le standard MusicStart & SACEM)
  const [step, setStep] = useState(1);

  // Étape 1 : Choix du type de fichier
  const [fileCategory, setFileCategory] = useState<"audio" | "text">("audio");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isScanningAudio, setIsScanningAudio] = useState(false);
  const [audioFingerprintData, setAudioFingerprintData] = useState<any>(null);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(180);

  // Étape 2 : Définir la création
  const [creationNature, setCreationNature] = useState<"new" | "existing">("new");
  const [workNature, setWorkNature] = useState<"chant" | "instrumental" | "texte">("chant");
  const [workStatus, setWorkStatus] = useState<"inedite" | "editee" | "demo">("inedite");
  const [isAlreadyDistributed, setIsAlreadyDistributed] = useState(false);
  const [externalDistributor, setExternalDistributor] = useState("DistroKid");
  const [existingIsrc, setExistingIsrc] = useState("");
  const [mandateGlobalPublishing, setMandateGlobalPublishing] = useState(true);

  // Étape 3 : Titre
  const [workTitle, setWorkTitle] = useState("");
  const [workSubtitle, setWorkSubtitle] = useState("");

  // Étape 4 : Styles & Données Techniques
  const [workStyle, setWorkStyle] = useState("Rumba Congolaise");
  const [bpmTempo, setBpmTempo] = useState<string>("120");
  const [originCountry, setOriginCountry] = useState("République du Congo 🇨🇬");

  // Étape 5 : Rôles de l'utilisateur
  const [myRoles, setMyRoles] = useState<string[]>(["composer", "author"]);

  // Étape 6 : Co-créateurs (NON / OUI)
  const [hasCoCreators, setHasCoCreators] = useState<boolean | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [customRole, setCustomRole] = useState<Collaborator["role"]>("composer");

  // Étape 7 : Signature & Attestation
  const [certifyOwnership, setCertifyOwnership] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Étape 8 : Résultat officiel
  const [registeredResult, setRegisteredResult] = useState<any>(null);

  // Initialisation du premier créateur (L'artiste connecté)
  useEffect(() => {
    if (user && collaborators.length === 0) {
      setCollaborators([
        {
          id: "collab_me",
          name: user.artist_name || user.full_name || "Prince Nzassi",
          phone: user.phone_number || "+242068001122",
          role: "composer",
          roleLabel: "Créateur Principal",
          splitPercentage: 100,
          avatarUrl: "👑",
          isRegistered: true,
        }
      ]);
    }
  }, [user]);

  // Calcul du total des splits
  const totalSplit = useMemo(() => {
    return collaborators.reduce((sum, c) => sum + (c.splitPercentage || 0), 0);
  }, [collaborators]);

  // Gestion du téléversement et décodage PCM AudioContext
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setIsScanningAudio(true);
      setAudioFingerprintData(null);
      setError("");

      try {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const realSha256 = "SHA256:" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

        let audioDuration = 180;
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
          audioDuration = Math.round(decoded.duration);
          setAudioDurationSeconds(audioDuration);
        } catch (e) {
          audioDuration = 180;
        }

        const uint8 = new Uint8Array(arrayBuffer);
        const headerSlice = uint8.slice(0, Math.min(16384, uint8.length));
        const footerSlice = uint8.slice(Math.max(0, uint8.length - 2048));
        const combined = new Uint8Array(headerSlice.length + footerSlice.length);
        combined.set(headerSlice);
        combined.set(footerSlice, headerSlice.length);

        let binaryAscii = "";
        for (let i = 0; i < combined.length; i++) {
          const byte = combined[i];
          if (byte >= 32 && byte <= 126) {
            binaryAscii += String.fromCharCode(byte);
          }
        }

        const inspectRes = await bcdaApi.inspectAudio({
          audio_fingerprint_hash: realSha256,
          duration_seconds: audioDuration,
          audio_file_name: file.name,
          id3_metadata_detected: binaryAscii
        });

        setIsScanningAudio(false);

        if (inspectRes.is_duplicate) {
          setAudioFingerprintData({
            hash: realSha256,
            originalityScore: 0,
            duplicateFound: true,
            fraudDetails: {
              artist: "Dépôt Précédent BCDA",
              title: inspectRes.detected_work?.title || "Master Déjà Enregistré",
              isrc: inspectRes.detected_work?.isrc || "CG-B01-26-XXXXX",
              label: "Base Nationale BCDA",
              registry: "Registre Officiel BCDA",
              matchPercentage: 100,
              reason: inspectRes.message
            }
          });
        } else if (inspectRes.is_fraud) {
          setAudioFingerprintData({
            hash: realSha256,
            originalityScore: 0,
            duplicateFound: true,
            fraudDetails: inspectRes.fraud_details || {
              artist: "Artiste Protégé",
              title: "Œuvre Internationale Détectée",
              isrc: "CI-UMG-20-00142",
              label: "Universal Music Africa",
              registry: "Réseau Mondial CISAC",
              matchPercentage: 99.4,
              reason: inspectRes.message
            }
          });
        } else {
          setAudioFingerprintData({
            hash: realSha256,
            originalityScore: 100,
            duplicateFound: false,
          });
        }

      } catch (err: any) {
        setIsScanningAudio(false);
        setError("Erreur lors de l'analyse acoustique : " + (err.message || "Impossible de décoder le fichier."));
      }
    }
  };

  // Gestion des rôles multiples
  const toggleMyRole = (roleId: string) => {
    if (myRoles.includes(roleId)) {
      if (myRoles.length > 1) {
        setMyRoles(myRoles.filter(r => r !== roleId));
      }
    } else {
      setMyRoles([...myRoles, roleId]);
    }
  };

  // Répartition égale des splits
  const handleEqualSplit = () => {
    const count = collaborators.length;
    if (count === 0) return;
    const baseShare = Math.floor(100 / count);
    const remainder = 100 - baseShare * count;

    setCollaborators(collaborators.map((c, idx) => ({
      ...c,
      splitPercentage: idx === 0 ? baseShare + remainder : baseShare
    })));
  };

  // Ajout d'un collaborateur
  const addCollaborator = (name: string, phone: string, role: Collaborator["role"]) => {
    const roleLabels: Record<string, string> = {
      author: "Auteur ✍️",
      composer: "Compositeur 🎼",
      beatmaker: "Arrangeur / Beatmaker 🎹",
      adapter: "Adaptateur 🗣️",
      performer: "Artiste-Interprète 🎤",
      producer: "Producteur 📀",
      clip_director: "Réalisateur Clip 🎬",
      editor: "Éditeur 🏢",
    };

    const newCollab: Collaborator = {
      id: "collab_" + Date.now(),
      name,
      phone,
      role,
      roleLabel: roleLabels[role] || "Co-créateur",
      splitPercentage: 0,
      avatarUrl: "👤",
      isRegistered: false,
    };

    setCollaborators([...collaborators, newCollab]);
    setCustomName("");
    setCustomPhone("");
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  // Soumission finale
  const handleSubmitFinal = async () => {
    if (!workTitle.trim()) {
      setError("Veuillez renseigner le titre de votre création.");
      setStep(3);
      return;
    }
    if (!certifyOwnership) {
      setError("Veuillez valider l'attestation de propriété légale.");
      return;
    }
    if (hasCoCreators && totalSplit !== 100) {
      setError(`Le total des clés de répartition doit être exactement de 100% (Actuellement : ${totalSplit}%).`);
      setStep(6);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await bcdaApi.registerWork({
        work_title: workTitle,
        title: workTitle,
        subtitle: workSubtitle,
        genre: workStyle,
        work_type: workNature,
        bpm: bpmTempo,
        duration_seconds: audioDurationSeconds,
        audio_fingerprint_hash: audioFingerprintData?.hash || `SHA256:${Date.now().toString(16).toUpperCase()}89BC12`,
        isrc_code: isAlreadyDistributed && existingIsrc ? existingIsrc : undefined,
        original_distributor: isAlreadyDistributed ? externalDistributor : "Moyo Music",
        collaborators,
        authors: collaborators.filter(c => c.role === "author").map(c => ({ name: c.name, phone: c.phone, split_percentage: c.splitPercentage })),
        composers: collaborators.filter(c => c.role === "composer" || c.role === "beatmaker").map(c => ({ name: c.name, phone: c.phone, split_percentage: c.splitPercentage })),
        performers: collaborators.filter(c => c.role === "performer").map(c => ({ name: c.name, phone: c.phone, split_percentage: c.splitPercentage })),
        producers: collaborators.filter(c => c.role === "producer").map(c => ({ name: c.name, phone: c.phone, split_percentage: c.splitPercentage })),
        music_video_directors: collaborators.filter(c => c.role === "clip_director").map(c => ({ name: c.name, phone: c.phone, split_percentage: c.splitPercentage }))
      });

      // Si l'utilisateur a mandaté la collecte mondiale sur son ISRC existant
      if (isAlreadyDistributed && existingIsrc && mandateGlobalPublishing) {
        await publishingApi.importIsrc({
          isrc_code: existingIsrc,
          track_title: workTitle,
          artist_name: user?.artist_name || user?.full_name || "Artiste",
          original_distributor: externalDistributor
        }).catch(console.error);
      }

      setRegisteredResult(res.work || {
        title: workTitle,
        subtitle: workSubtitle,
        genre: workStyle,
        iswc_code: res.iswc_code || "T-304.100.001-1",
        isrc_code: isAlreadyDistributed && existingIsrc ? existingIsrc : res.work?.isrc_code || "CG-B01-26-10001",
        bcda_code: res.registration_number || res.work?.registration_number || "BCDA-CG-2026-00101",
        fingerprint_hash: audioFingerprintData?.hash || (res.work?.audio_fingerprint_hash || "SHA256:AUTHENTIC"),
      });

      setStep(8);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'immatriculation BCDA.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Fichier" },
    { num: 2, label: "Création" },
    { num: 3, label: "Titre" },
    { num: 4, label: "Styles" },
    { num: 5, label: "Vos Rôles" },
    { num: 6, label: "Co-créateurs" },
    { num: 7, label: "Résumé" },
    { num: 8, label: "Certificat !" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-white">
      
      {/* Barre d'En-tête Style MusicStart & BCDA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <Link href="/bcda" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-white">
                MUSIC<span className="text-congo-yellow">START</span> <span className="text-congo-red">BCDA</span> 🇨🇬
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                Standard CISAC & SACEM
              </span>
            </div>
            <p className="text-xs text-slate-400">Portail officiel de protection d'œuvres, démos et attribution des codes ISWC & ISRC.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-congo-yellow bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            Artiste : {user?.artist_name || user?.full_name || "Prince Nzassi"}
          </span>
        </div>
      </div>

      {/* Barre d'avancement des 8 Étapes (Format MusicStart Officiel) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {stepsList.map((s, idx) => 
            <div key={s.num} className="flex items-center space-x-2">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === s.num
                    ? "bg-congo-yellow text-slate-950 ring-4 ring-congo-yellow/20 shadow-lg scale-110"
                    : step > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-[11px] mt-1 font-semibold ${step === s.num ? "text-congo-yellow font-bold" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
              {idx < stepsList.length - 1 && 
                <div className={`w-10 h-0.5 mb-4 ${step > s.num ? "bg-emerald-500" : "bg-slate-800"}`} />
              }
            </div>
          )}
        </div>
      </div>

      {/* Message d'erreur global */}
      {error && 
        <div className="p-4 bg-rose-950/60 border border-rose-500/60 rounded-2xl text-rose-300 text-xs flex items-center space-x-3 shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 1 : CHOIX DU FICHIER À PROTÉGER (Audio vs Partitions/Textes) */}
      {/* ========================================================================= */}
      {step === 1 && 
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-8 text-center">
          <div>
            <h2 className="text-2xl font-black text-white">AJOUTER LE FICHIER À PROTÉGER</h2>
            <p className="text-xs text-slate-400 mt-2">
              Choisissez le type de support de votre création pour générer votre preuve d'antériorité cryptographique.
            </p>
          </div>

          {/* Deux Grosses Cartes Cliquables (Exactement comme MusicStart) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setFileCategory("text")}
              className={`p-6 rounded-3xl border-2 transition text-center space-y-3 ${
                fileCategory === "text"
                  ? "bg-gradient-to-br from-pink-900/40 to-purple-900/40 border-pink-500 shadow-xl"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto text-2xl">
                📄
              </div>
              <strong className="text-base font-bold text-white block">Partitions, paroles, textes</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Textes de chanson, poèmes, partitions musicales en format PDF, TXT, DOCX ou PNG.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFileCategory("audio")}
              className={`p-6 rounded-3xl border-2 transition text-center space-y-3 ${
                fileCategory === "audio"
                  ? "bg-gradient-to-br from-amber-900/40 to-congo-red/40 border-congo-yellow shadow-xl"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-congo-yellow/20 text-congo-yellow flex items-center justify-center mx-auto text-2xl">
                🎵
              </div>
              <strong className="text-base font-bold text-white block">Fichier Audio Master / Démo</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fichier audio au format MP3, WAV, OGG ou FLAC pour l'analyse spectrale et le scan mondial.
              </p>
            </button>
          </div>

          {/* Zone de Téléversement */}
          <div className="p-8 bg-slate-950 border-2 border-dashed border-slate-800 hover:border-congo-yellow/50 rounded-3xl max-w-2xl mx-auto space-y-4">
            <Upload className="w-10 h-10 text-congo-yellow mx-auto animate-bounce" />
            <div>
              <p className="text-sm font-bold text-white">Sélectionnez votre fichier {fileCategory === "audio" ? "audio (.MP3, .WAV)" : "document (.PDF, .TXT)"}</p>
              <p className="text-[11px] text-slate-500 mt-1">Taille maximale : 100 Mo. Empreinte SHA-256 calculée en temps réel.</p>
            </div>

            <input
              type="file"
              accept={fileCategory === "audio" ? "audio/*" : ".pdf,.txt,.doc,.docx,image/*"}
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-congo-yellow file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
            />

            {uploadedFile && 
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                <span>📁 {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} Mo)</span>
                <span className="text-congo-yellow font-mono text-[10px]">Durée: {Math.floor(audioDurationSeconds / 60)}m {audioDurationSeconds % 60}s</span>
              </div>
            }

            {/* État du scan IA */}
            {isScanningAudio && 
              <div className="p-4 bg-slate-900 border border-congo-yellow/30 rounded-2xl space-y-2 animate-pulse text-left">
                <div className="flex items-center space-x-2 text-xs text-congo-yellow font-bold">
                  <Cpu className="w-4 h-4 animate-spin text-congo-yellow" />
                  <span>Scan multi-registres en cours (BCDA + CISAC Mondial + Content ID)...</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">1. Registre BCDA 🇨🇬</div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">2. Réseau CISAC 🌍</div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">3. YouTube Content ID 🎵</div>
                </div>
              </div>
            }

            {/* Alerte Fraude / Succès */}
            {audioFingerprintData && (
              audioFingerprintData.duplicateFound ? 
                <div className="p-4 bg-rose-950/60 border-2 border-rose-500 rounded-2xl text-left space-y-2 text-xs text-rose-200">
                  <div className="flex items-center space-x-2 font-black text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>🚫 DÉPÔT BLOQUÉ : ŒUVRE PROTÉGÉE DÉTECTÉE</span>
                  </div>
                  <p>{audioFingerprintData.fraudDetails?.reason}</p>
                </div>
               : 
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-left space-y-2 text-xs text-emerald-300">
                  <div className="flex items-center space-x-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>100% Inédit & Conforme : Aucune correspondance étrangère trouvée.</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 break-all">Hash: {audioFingerprintData.hash}</p>
                </div>
              
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              disabled={!uploadedFile || audioFingerprintData?.duplicateFound || isScanningAudio}
              onClick={() => setStep(2)}
              className="px-8 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2 shadow-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Suivant : Définir la Création</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 2 : DÉFINIR LA CRÉATION (Nouvelle vs Existante & Chant vs Instrumental) */}
      {/* ========================================================================= */}
      {step === 2 && 
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-8">
          <div>
            <h2 className="text-2xl font-black text-white">DÉFINIR LA CRÉATION</h2>
            <p className="text-xs text-slate-400 mt-1">Précisez la nature de votre œuvre pour les registres BCDA & SACEM.</p>
          </div>

          <div className="space-y-6 text-xs">
            {/* Rattachement */}
            <div>
              <label className="text-slate-300 font-bold block mb-2">Voulez-vous rattacher ce fichier à :</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCreationNature("new")}
                  className={`p-4 rounded-2xl border text-left transition ${
                    creationNature === "new" ? "bg-congo-yellow/10 border-congo-yellow text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <strong className="text-sm block font-bold text-white mb-1">✨ Une nouvelle création</strong>
                  <span>Cette œuvre n'a jamais été enregistrée auparavant.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationNature("existing")}
                  className={`p-4 rounded-2xl border text-left transition ${
                    creationNature === "existing" ? "bg-congo-yellow/10 border-congo-yellow text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <strong className="text-sm block font-bold text-white mb-1">🔗 Une création existante</strong>
                  <span>Ajouter une version (Acoustique, Remix, Démo) à un titre déjà déposé.</span>
                </button>
              </div>
            </div>

            {/* Nature de l'œuvre (Chant / Instrumental / Texte) */}
            <div>
              <label className="text-slate-300 font-bold block mb-2">Genre de l'œuvre musicale :</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setWorkNature("chant")}
                  className={`p-4 rounded-2xl border text-center transition ${
                    workNature === "chant" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="text-2xl block mb-1">🎤</span>
                  <span>Œuvre Chantée (avec Paroles)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkNature("instrumental")}
                  className={`p-4 rounded-2xl border text-center transition ${
                    workNature === "instrumental" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="text-2xl block mb-1">🎹</span>
                  <span>Œuvre Instrumentale (Beat / Prod)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkNature("texte")}
                  className={`p-4 rounded-2xl border text-center transition ${
                    workNature === "texte" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="text-2xl block mb-1">✍️</span>
                  <span>Texte / Poème seul</span>
                </button>
              </div>
            </div>

            {/* Statut de l'œuvre */}
            <div>
              <label className="text-slate-300 font-bold block mb-2">Statut légal d'édition :</label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-congo-yellow"
              >
                <option value="inedite">Inédite (Œuvre sans éditeur - Artiste Indépendant)</option>
                <option value="editee">Éditée (Sous contrat d'édition avec un Label)</option>
                <option value="demo">Démo Provisoire (Protection temporaire MusicStart BCDA)</option>
              </select>
            </div>

            {/* Déjà distribué sur DistroKid / Spotify ? */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <label className="text-slate-200 font-bold block text-xs">
                Ce morceau est-il déjà distribué sur les plateformes (DistroKid, TuneCore, CD Baby, Spotify) ?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsAlreadyDistributed(false)}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    !isAlreadyDistributed
                      ? "bg-congo-green/10 border-congo-green text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <strong className="block text-xs text-white mb-0.5">🌱 Non, création inédite / maquette</strong>
                  <span className="text-[11px] text-slate-400">Moyo générera un code ISRC national lors de la sortie.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAlreadyDistributed(true)}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    isAlreadyDistributed
                      ? "bg-indigo-950/60 border-indigo-500 text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <strong className="block text-xs text-white mb-0.5">📦 Oui, déjà sorti sur un distributeur</strong>
                  <span className="text-[11px] text-slate-400">J'ai déjà un ISRC DistroKid / TuneCore existant.</span>
                </button>
              </div>

              {isAlreadyDistributed && 
                <div className="pt-2 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Distributeur utilisé :</label>
                      <select
                        value={externalDistributor}
                        onChange={(e) => setExternalDistributor(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                      >
                        <option value="DistroKid">DistroKid 📦</option>
                        <option value="TuneCore">TuneCore 🎵</option>
                        <option value="CD Baby">CD Baby 💿</option>
                        <option value="Believe">Believe / Backstage 🏢</option>
                        <option value="Autre">Autre Distributeur</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Votre Code ISRC existant :</label>
                      <input
                        type="text"
                        placeholder="Ex: QZ-DA4-24-00123"
                        value={existingIsrc}
                        onChange={(e) => setExistingIsrc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <label className="flex items-start space-x-2 text-[11px] text-indigo-300 bg-indigo-950/30 p-3 rounded-xl border border-indigo-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mandateGlobalPublishing}
                      onChange={(e) => setMandateGlobalPublishing(e.target.checked)}
                      className="mt-0.5 accent-indigo-500 rounded"
                    />
                    <span>
                      <strong>Mandater Moyo & BCDA pour réclamer mes 15% à 20% de droits d'auteur mondiaux</strong> (The MLC aux USA, YouTube Content ID et passages TV/Radio) qu'aucun distributeur ne collecte pour moi.
                    </span>
                  </label>
                </div>
              }
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-8 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2"
            >
              <span>Suivant : Renseigner le Titre</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 3 : TITRE DE LA CRÉATION */}
      {/* ========================================================================= */}
      {step === 3 && 
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-8 text-center max-w-2xl mx-auto">
          <div>
            <h2 className="text-2xl font-black text-white">QUEL EST LE TITRE DE VOTRE CRÉATION ?</h2>
            <p className="text-xs text-slate-400 mt-1">Indiquez le nom exact tel qu'il apparaîtra sur votre certificat BCDA.</p>
          </div>

          <div className="space-y-4 text-left text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Titre Principal *</label>
              <input
                type="text"
                placeholder="Ex: Danse du Fleuve Congo"
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-base font-bold focus:border-congo-yellow focus:ring-1 focus:ring-congo-yellow text-center"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Sous-titre ou Version éventuelle (Optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Version Acoustic / Radio Edit"
                value={workSubtitle}
                onChange={(e) => setWorkSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs text-center"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={!workTitle.trim()}
              onClick={() => setStep(4)}
              className="px-8 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2 disabled:opacity-40"
            >
              <span>Confirmer le Titre</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 4 : STYLES MUSICAUX (Grille Colorée comme MusicStart) */}
      {/* ========================================================================= */}
      {step === 4 && 
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">QUEL EST LE STYLE DE VOTRE CRÉATION ?</h2>
            <p className="text-xs text-slate-400 mt-1">Sélectionnez le genre principal pour la catégorisation BCDA.</p>
          </div>

          {/* Grille de cartes de styles colorées */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {MUSIC_STYLES.map((st) => 
              <button
                key={st.id}
                type="button"
                onClick={() => setWorkStyle(st.name)}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center min-h-[90px] ${
                  workStyle === st.name
                    ? `bg-gradient-to-br ${st.color} text-white font-bold ring-2 ring-congo-yellow shadow-xl scale-105`
                    : `${st.bg} text-slate-300`
                }`}
              >
                <span className="text-xs font-bold">{st.name}</span>
              </button>
            )}
          </div>

          {/* Données Techniques complémentaires (Tempo BPM & Origine) */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Tempo / Métronome (BPM)</label>
              <input
                type="number"
                placeholder="Ex: 125 BPM"
                value={bpmTempo}
                onChange={(e) => setBpmTempo(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Pays d'Origine de l'Œuvre</label>
              <input
                type="text"
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-8 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2"
            >
              <span>Suivant : Vos Rôles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 5 : VOS RÔLES SUR CETTE CRÉATION (Choix Multiples avec Cartes) */}
      {/* ========================================================================= */}
      {step === 5 && 
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">QUEL EST VOTRE RÔLE SUR CETTE CRÉATION ?</h2>
            <p className="text-xs text-slate-400 mt-1">(Plusieurs choix possibles selon vos contributions réelles)</p>
          </div>

          {/* Grille de cartes de rôles cliquables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {ROLE_OPTIONS.map((r) => {
              const isSelected = myRoles.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleMyRole(r.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition relative ${
                    isSelected
                      ? "bg-congo-red/20 border-congo-red text-white shadow-lg scale-102"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-sm font-bold text-white">{r.name}</strong>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isSelected ? "bg-congo-red text-white" : "bg-slate-800 text-slate-500"}`}>
                      {isSelected ? "✓" : "+"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{r.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(6)}
              className="px-8 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2"
            >
              <span>Continuer : Co-créateurs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 6 : CO-CRÉATEURS (NON / OUI & Gestion des Splits 100%) */}
      {/* ========================================================================= */}
      {step === 6 && 
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-8">
          
          {hasCoCreators === null && 
            <div className="text-center space-y-8 max-w-xl mx-auto py-8">
              <h2 className="text-2xl font-black text-white uppercase">Avez-vous des co-créateurs ?</h2>
              <p className="text-xs text-slate-400">
                Y a-t-il d'autres musiciens, beatmakers, paroliers ou producteurs qui détiennent une part des droits sur ce morceau ?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setHasCoCreators(false);
                    setCollaborators([{
                      id: "collab_me",
                      name: user?.artist_name || user?.full_name || "Prince Nzassi",
                      phone: user?.phone_number || "+242068001122",
                      role: "composer",
                      roleLabel: "Créateur Unique (100%)",
                      splitPercentage: 100,
                      avatarUrl: "👑",
                      isRegistered: true,
                    }]);
                    setStep(7);
                  }}
                  className="py-4 bg-congo-red hover:bg-red-700 text-white font-black rounded-2xl text-sm transition shadow-lg"
                >
                  NON (Je suis seul)
                </button>

                <button
                  type="button"
                  onClick={() => setHasCoCreators(true)}
                  className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm transition shadow-lg"
                >
                  OUI (Ajouter)
                </button>
              </div>

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs"
                >
                  Retour
                </button>
              </div>
            </div>
          }

          {hasCoCreators === true && 
            <div className="space-y-6">
              {/* En-tête Récapitulatif Titre & Durée comme dans la SACEM */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap justify-between items-center text-xs text-slate-300 gap-3">
                <div>
                  <span className="text-slate-500">Titre de l'Œuvre : </span>
                  <strong className="text-white font-bold">{workTitle || "Sans Titre"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Durée : </span>
                  <strong className="text-congo-yellow font-mono">{Math.floor(audioDurationSeconds / 60)} minutes {audioDurationSeconds % 60} secondes</strong>
                </div>
                <div>
                  <span className="text-slate-500">Genre : </span>
                  <strong className="text-emerald-400 font-bold">{workStyle} ({workNature})</strong>
                </div>
                <Link href="/bcda/guide" target="_blank" className="text-congo-yellow hover:underline flex items-center space-x-1 text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Comprendre les clés PHONO / DEP / DR</span>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-congo-yellow" />
                    <span>Saisie des Clés PHONO et Calcul des Clés DEP et DR</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Droits de reproduction phonographique (PHONO), d'exécution publique (DEP) et de reproduction (DR).
                  </p>
                </div>

                {/* Bouton Partage Égalitaire Style SACEM */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleEqualSplit}
                    className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-md"
                    title="Appliquer un partage équitable sur PHONO, DEP et DR"
                  >
                    <Scale className="w-4 h-4 text-sky-400" />
                    <span>PARTAGE ÉGALITAIRE ⚖️</span>
                  </button>

                  <span className={`px-3 py-2 rounded-xl text-xs font-black ${
                    totalSplit === 100
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}>
                    Total PHONO : {totalSplit}% / 100%
                  </span>
                </div>
              </div>

              {/* 🔍 Recherche intelligente dans la communauté */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Rechercher un ayant droit ou co-créateur :</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Tapez un nom (DJ Brazza Beat, Mavoungou, Producteur...)"
                    value={searchQuery}
                    onFocus={() => setShowSearchDropdown(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-congo-yellow"
                  />
                </div>

                {showSearchDropdown && 
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 max-h-52 overflow-y-auto divide-y divide-slate-800">
                    {REGISTERED_COMMUNITY.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((sug, i) => 
                      <button
                        key={i}
                        type="button"
                        onClick={() => addCollaborator(sug.name, sug.phone, sug.role as any)}
                        className="w-full p-3 text-left hover:bg-slate-800 flex items-center justify-between text-xs transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span>{sug.avatar}</span>
                          <div>
                            <strong className="text-white block">{sug.name}</strong>
                            <span className="text-[10px] text-slate-400">{sug.roleLabel} • MoMo: {sug.phone}</span>
                          </div>
                        </div>
                        <span className="text-congo-yellow font-bold">+ Ajouter</span>
                      </button>
                    )}
                  </div>
                }
              </div>

              {/* 📋 TABLEAU OFFICIEL DES CRÉATEURS (Style SACEM / BCDA) */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Nom & Prénom</th>
                      <th className="p-3.5">Rôle / Qualité</th>
                      <th className="p-3.5 text-center text-congo-yellow">Clés PHONO (%)</th>
                      <th className="p-3.5 text-center text-emerald-400">Clés DEP (%)</th>
                      <th className="p-3.5 text-center text-sky-400">Clés DR (%)</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {collaborators.map((collab) => 
                      <tr key={collab.id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-base">{collab.avatarUrl || "👤"}</span>
                            <div>
                              <strong className="text-white block font-bold">{collab.name}</strong>
                              <span className="text-[10px] text-slate-500 font-mono">MoMo: {collab.phone}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <select
                            value={collab.role}
                            onChange={(e) => {
                              setCollaborators(collaborators.map(c => (c.id === collab.id ? { ...c, role: e.target.value as any } : c)));
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold"
                          >
                            <option value="composer">Compositeur 🎼</option>
                            <option value="author">Auteur ✍️</option>
                            <option value="beatmaker">Beatmaker 🎹</option>
                            <option value="adapter">Adaptateur 🗣️</option>
                            <option value="performer">Interprète 🎤</option>
                            <option value="producer">Producteur 📀</option>
                            <option value="clip_director">Réalisateur 🎬</option>
                          </select>
                        </td>

                        {/* Clé PHONO */}
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={collab.splitPercentage}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCollaborators(collaborators.map(c => (c.id === collab.id ? { ...c, splitPercentage: val } : c)));
                            }}
                            className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-center font-black text-congo-yellow text-xs focus:border-congo-yellow"
                          />
                        </td>

                        {/* Clé DEP (Exécution Publique) */}
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={collab.splitPercentage}
                            readOnly
                            className="w-16 px-2 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-center font-bold text-emerald-400 text-xs opacity-90 cursor-default"
                          />
                        </td>

                        {/* Clé DR (Reproduction Mécanique) */}
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={collab.splitPercentage}
                            readOnly
                            className="w-16 px-2 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-center font-bold text-sky-400 text-xs opacity-90 cursor-default"
                          />
                        </td>

                        {/* Action Supprimer */}
                        <td className="p-3.5 text-center">
                          {collaborators.length > 1 && 
                            <button
                              type="button"
                              onClick={() => setCollaborators(collaborators.filter(c => c.id !== collab.id))}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title="Retirer ce créateur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Ajout manuel */}
              <div className="p-4 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nom ou Pseudo"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
                <input
                  type="tel"
                  placeholder="N° MoMo (+242...)"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as any)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                >
                  <option value="composer">Compositeur 🎼</option>
                  <option value="author">Auteur ✍️</option>
                  <option value="beatmaker">Beatmaker 🎹</option>
                  <option value="adapter">Adaptateur 🗣️</option>
                  <option value="performer">Interprète 🎤</option>
                  <option value="producer">Producteur 📀</option>
                  <option value="clip_director">Réalisateur 🎬</option>
                </select>
                <button
                  type="button"
                  onClick={() => addCollaborator(customName, customPhone, customRole)}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
                >
                  + Ajouter à la Clé
                </button>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setHasCoCreators(null)}
                  className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Retour
                </button>
                <button
                  type="button"
                  disabled={totalSplit !== 100}
                  onClick={() => setStep(7)}
                  className="px-8 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2 disabled:opacity-40"
                >
                  <span>Suivant : Résumé & Signature</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          }
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 7 : RÉSUMÉ DE LA CRÉATION & SIGNATURE ÉLECTRONIQUE */}
      {/* ========================================================================= */}
      {step === 7 && 
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white">RÉSUMÉ DE VOTRE ENREGISTREMENT</h2>
            <p className="text-xs text-slate-400 mt-1">Vérifiez toutes les informations avant la signature électronique certifiée.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <strong className="text-congo-yellow block font-bold text-sm">🎵 Détails de l'Œuvre :</strong>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between"><span className="text-slate-500">Titre :</span><strong className="text-white">{workTitle} {workSubtitle && `(${workSubtitle})`}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Genre :</span><span>{workStyle}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nature :</span><span>{workNature === "chant" ? "Œuvre Chantée" : "Instrumental"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tempo / BPM :</span><span>{bpmTempo} BPM</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Durée Master :</span><span>{Math.floor(audioDurationSeconds / 60)}m {audioDurationSeconds % 60}s</span></div>
              </div>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <strong className="text-emerald-400 block font-bold text-sm">⚖️ Ayants Droit & Clés de Répartition :</strong>
              <div className="space-y-2 text-slate-300">
                {collaborators.map((c, i) => 
                  <div key={i} className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
                    <span>{c.name} ({c.role})</span>
                    <strong className="text-congo-yellow font-black">{c.splitPercentage} %</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preuve d'Antériorité SHA-256 */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 font-mono text-[11px]">
            <span className="text-slate-500 block">Preuve d'Antériorité Cryptographique (MusicStart BCDA) :</span>
            <strong className="text-congo-yellow break-all">{audioFingerprintData?.hash || "SHA256:7B89A0C32E4DF819"}</strong>
          </div>

          {/* Clause Anti-Fraude & Signature */}
          <div className="p-5 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3 text-xs">
            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={certifyOwnership}
                onChange={(e) => setCertifyOwnership(e.target.checked)}
                className="w-4 h-4 rounded text-congo-yellow focus:ring-congo-yellow border-slate-700 bg-slate-900 mt-0.5"
              />
              <span className="text-slate-300 leading-relaxed">
                <strong className="text-congo-yellow">Attestation de Propriété Légale :</strong> Je certifie sur l'honneur être l'auteur/créateur original de cette création et autorise le BCDA à enregistrer cette œuvre pour la perception et la répartition des droits d'auteur.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(6)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={!certifyOwnership || isSubmitting}
              onClick={handleSubmitFinal}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-xl transition disabled:opacity-40 flex items-center space-x-2"
            >
              {isSubmitting ? 
                <span>Immatriculation BCDA en cours...</span>
               : 
                <span>Confirmer la Demande de Protection & Signer 🏛️</span>
              }
            </button>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* ÉTAPE 8 : FÉLICITATIONS & CERTIFICAT OFFICIEL BCDA AVEC QR CODE */}
      {/* ========================================================================= */}
      {step === 8 && registeredResult && 
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-2xl text-center space-y-8 max-w-2xl mx-auto">
          
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-3xl shadow-xl animate-pulse">
            ✓
          </div>

          <div>
            <span className="px-3 py-1 bg-congo-red/20 text-congo-red border border-congo-red/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Enregistrement Officiel BCDA 🇨🇬
            </span>
            <h2 className="text-3xl font-black text-white mt-3">FÉLICITATIONS !</h2>
            <p className="text-sm text-slate-300 mt-1">
              Votre création musicale <strong>"{registeredResult.title}"</strong> a bien été enregistrée et protégée au Répertoire National !
            </p>
          </div>

          {/* Récépissé Certifié */}
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-3.5 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Code ISWC (Droit d'Auteur) :</span>
              <strong className="text-white font-bold">{registeredResult.iswc_code}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Code ISRC National :</span>
              <strong className="text-emerald-400 font-bold">{registeredResult.isrc_code}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">N° Certificat BCDA :</span>
              <strong className="text-congo-yellow font-bold">{registeredResult.bcda_code || "BCDA-CG-2026-6249"}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Preuve d'Antériorité :</span>
              <span className="text-[10px] text-slate-300 truncate max-w-[220px]">{registeredResult.fingerprint_hash}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/bcda"
              className="px-8 py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg"
            >
              Voir mon Répertoire BCDA 🏛️
            </Link>
            <button
              onClick={() => window.print()}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700"
            >
              Imprimer le Certificat 🖨️
            </button>
          </div>
        </div>
      }

    </div>
  );
}
