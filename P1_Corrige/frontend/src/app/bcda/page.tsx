"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Music, 
  DollarSign, 
  Send, 
  CheckCircle2, 
  QrCode, 
  FileText, 
  PlusCircle, 
  RefreshCw,
  Wallet,
  Car,
  Video,
  Ticket,
  Printer,
  Search,
  X,
  LogIn,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCw,
  Calendar,
  Users,
  UserPlus,
  Trash2,
  Check,
  Globe,
  ArrowRight,
  AlertCircle,
  Coins,
  Radio,
  Youtube,
  Building2
} from "lucide-react";
import { bcdaApi, publishingApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/AuthModal";

export default function BcdaPortalPage() {
  const { user } = useAuth();
  const isAuth = Boolean(user);
  const isArtist = user?.role === "artist" || user?.role === "admin";
  const isBcdaAgent = user?.role === "bcda_agent" || user?.role === "admin";
  const isOrganizer = user?.role === "organizer" || user?.role === "admin";

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [works, setWorks] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [pubCatalog, setPubCatalog] = useState<any[]>([]);
  const [pubAnalytics, setPubAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"works" | "licenses" | "publishing">("works");
  const [notification, setNotification] = useState<string | null>(null);

  // Formulaire d'Importation ISRC Publishing
  const [isPubImportOpen, setIsPubImportOpen] = useState(false);
  const [pubIsrc, setPubIsrc] = useState("");
  const [pubTitle, setPubTitle] = useState("");
  const [pubArtist, setPubArtist] = useState(user?.artist_name || user?.full_name || "");
  const [pubDistributor, setPubDistributor] = useState("DistroKid");
  const [isSubmittingPub, setIsSubmittingPub] = useState(false);
  const [pubError, setPubError] = useState("");

  // Moteurs de recherche
  const [searchWorks, setSearchWorks] = useState("");
  const [searchLicenses, setSearchLicenses] = useState("");

  // Accordéon de détails (Ligne dépliée style SACEM)
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);

  // Modales Popups
  const [isRegisterWorkOpen, setIsRegisterWorkOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [licenseModalMode, setLicenseModalMode] = useState<"new" | "renew">("new");
  const [isPhysicalTicketOpen, setIsPhysicalTicketOpen] = useState(false);
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  // Formulaire d'enregistrement d'œuvre & Clip (5 Volets Vierge)
  const [workTitle, setWorkTitle] = useState("");
  const [workGenre, setWorkGenre] = useState("Rumba Congolaise");
  
  const [authorName, setAuthorName] = useState(user?.artist_name || user?.full_name || "");
  const [authorPhone, setAuthorPhone] = useState(user?.phone_number || "");
  const [authorSplit, setAuthorSplit] = useState(50);

  const [composerName, setComposerName] = useState("");
  const [composerPhone, setComposerPhone] = useState("");
  const [composerSplit, setComposerSplit] = useState(50);

  const [performerName, setPerformerName] = useState("");
  const [performerPhone, setPerformerPhone] = useState("");
  const [performerSplit, setPerformerSplit] = useState(0);

  const [producerName, setProducerName] = useState("");
  const [producerPhone, setProducerPhone] = useState("");
  const [producerSplit, setProducerSplit] = useState(0);

  const [directorName, setDirectorName] = useState("");
  const [directorPhone, setDirectorPhone] = useState("");
  const [directorSplit, setDirectorSplit] = useState(0);

  // Formulaire de souscription de licence / vignette
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("Taxi 100-100 / VTC");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [venueCity, setVenueCity] = useState("Brazzaville");
  const [venueAddress, setVenueAddress] = useState("");
  const [monthlyFee, setMonthlyFee] = useState(2500);

  // Formulaire de renouvellement de licence
  const [renewLicenseCode, setRenewLicenseCode] = useState("");
  const [renewPhone, setRenewPhone] = useState("");

  // Formulaire de billetterie physique
  const [eventName, setEventName] = useState("");
  const [ticketsPrinted, setTicketsPrinted] = useState(500);
  const [unitTicketPrice, setUnitTicketPrice] = useState(5000);
  const [ticketBatchResult, setTicketBatchResult] = useState<any>(null);

  const [reconcileBatchCode, setReconcileBatchCode] = useState("");
  const [actualSold, setActualSold] = useState(380);
  const [unsoldReturned, setUnsoldReturned] = useState(120);
  const [isCancelledEvent, setIsCancelledEvent] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState<any>(null);

  // Formulaire de distribution vers le Wallet
  const [selectedWorkId, setSelectedWorkId] = useState("");
  const [distributeAmount, setDistributeAmount] = useState(200000);
  const [sourceChannel, setSourceChannel] = useState("Télévisions, Discothèques & Taxis 100-100");
  const [distributionResult, setDistributionResult] = useState<any>(null);
  const [isDistributing, setIsDistributing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stData, wkData, licData, pCat, pAna] = await Promise.all([
        bcdaApi.getStats().catch(() => null),
        bcdaApi.getWorks().catch(() => ({ works: [] })),
        bcdaApi.getLicenses().catch(() => ({ licenses: [] })),
        publishingApi.getCatalog().catch(() => ({ catalog: [] })),
        publishingApi.getAnalytics().catch(() => ({ stats: null })),
      ]);

      setStats(stData);
      setWorks(wkData.works || []);
      setLicenses(licData.licenses || []);
      setPubCatalog(pCat.catalog || []);
      setPubAnalytics(pAna.stats || null);
      if (wkData.works && wkData.works.length > 0 && !selectedWorkId) {
        setSelectedWorkId(wkData.works[0].id);
      }
    } catch (e) {
      console.error("Erreur chargement BCDA:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // FILTRAGE INSTANTANÉ SANS LATENCE (CLIENT-SIDE)
  const filteredWorks = useMemo(() => {
    if (!searchWorks.trim()) return works;
    const q = searchWorks.toLowerCase().trim();
    return works.filter((w) => {
      const matchTitle = (w.work_title || "").toLowerCase().includes(q);
      const matchGenre = (w.genre || "").toLowerCase().includes(q);
      const matchIswc = (w.iswc_code || "").toLowerCase().includes(q);
      const matchIsrc = (w.isrc_code || "").toLowerCase().includes(q);
      const matchReg = (w.registration_number || "").toLowerCase().includes(q);
      const matchAuthors = JSON.stringify(w.authors || []).toLowerCase().includes(q);
      const matchComposers = JSON.stringify(w.composers || []).toLowerCase().includes(q);
      const matchPerformers = JSON.stringify(w.performers || []).toLowerCase().includes(q);
      const matchDirectors = JSON.stringify(w.music_video_directors || []).toLowerCase().includes(q);
      return matchTitle || matchGenre || matchIswc || matchIsrc || matchReg || matchAuthors || matchComposers || matchPerformers || matchDirectors;
    });
  }, [works, searchWorks]);

  const filteredLicenses = useMemo(() => {
    if (!searchLicenses.trim()) return licenses;
    const q = searchLicenses.toLowerCase().trim();
    return licenses.filter((l) => {
      const matchName = (l.venue_name || "").toLowerCase().includes(q);
      const matchCode = (l.license_code || "").toLowerCase().includes(q);
      const matchCity = (l.city || "").toLowerCase().includes(q);
      const matchAddress = (l.address || "").toLowerCase().includes(q);
      const matchOwner = (l.owner_name || "").toLowerCase().includes(q);
      const matchType = (l.venue_type || "").toLowerCase().includes(q);
      return matchName || matchCode || matchCity || matchAddress || matchOwner || matchType;
    });
  }, [licenses, searchLicenses]);

  // 1. Enregistrer une nouvelle œuvre (5 volets)
  const handleRegisterWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle) return;

    try {
      const payload = {
        work_title: workTitle,
        genre: workGenre,
        authors: [{ name: authorName, role: "Auteur des Paroles", phone: authorPhone, split_percentage: authorSplit }],
        composers: [{ name: composerName, role: "Compositeur / Beatmaker", phone: composerPhone, split_percentage: composerSplit }],
        performers: [{ name: performerName, role: "Artiste-Interprète (Droits Voisins)", phone: performerPhone, split_percentage: performerSplit }],
        producers: [{ name: producerName, role: "Producteur Phonographique Master", phone: producerPhone, split_percentage: producerSplit }],
        music_video_directors: [{ name: directorName, role: "Réalisateur Clip Vidéo (Droits Audiovisuels)", phone: directorPhone, tv_split_percentage: directorSplit }],
      };

      const res = await bcdaApi.registerWork(payload);
      setNotification(`✅ ${res.message} (Immatriculation : ${res.registration_number})`);
      setWorkTitle("");
      setIsRegisterWorkOpen(false);
      loadData();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement de l'œuvre");
    }
  };

  // 2. Activer une nouvelle vignette transport / pass bar
  const handlePayLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName || !ownerPhone) return;

    try {
      const res = await bcdaApi.payLicense({
        venue_name: venueName,
        venue_type: venueType,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        city: venueCity,
        address: venueAddress,
        monthly_fee_fcfa: monthlyFee
      });

      setNotification(`✅ ${res.message}`);
      setVenueName("");
      setOwnerPhone("");
      setIsLicenseModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Erreur lors du paiement");
    }
  };

  // 3. Renouveler une vignette ou un pass existant (Prolongation d'un an)
  const handleRenewLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewLicenseCode) return;

    try {
      const res = await bcdaApi.renewLicense({
        license_code: renewLicenseCode.trim(),
        payer_phone: renewPhone || "069000001"
      });

      setNotification(`✅ ${res.message}`);
      setRenewLicenseCode("");
      setIsLicenseModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Erreur lors du renouvellement : vérifiez le code de licence / vignette.");
    }
  };

  // 4. Timbrer un lot de billets papier
  const handleStampPhysicalTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !ticketsPrinted) return;

    try {
      const res = await fetch("http://localhost:4000/api/bcda/physical-tickets/stamp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("moyo_auth_token")}`
        },
        body: JSON.stringify({
          event_name: eventName,
          total_tickets_printed: ticketsPrinted,
          unit_price_fcfa: unitTicketPrice,
          organizer_phone: user?.phone_number || "068112233"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTicketBatchResult(data);
        setReconcileBatchCode(data.batch_code);
        setNotification(data.message);
      }
    } catch (err: any) {
      alert("Erreur lors du timbrage");
    }
  };

  // Rapprochement guichet
  const handleReconcileTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileBatchCode) return;

    try {
      const res = await fetch("http://localhost:4000/api/bcda/physical-tickets/reconcile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("moyo_auth_token")}`
        },
        body: JSON.stringify({
          batch_code: reconcileBatchCode,
          actual_tickets_sold: actualSold,
          unsold_tickets_returned: unsoldReturned,
          is_cancelled: isCancelledEvent
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReconciliationResult(data);
        setNotification(data.message);
        loadData();
      }
    } catch (err: any) {
      alert("Erreur lors du rapprochement");
    }
  };

  // 5. Répartition vers les portefeuilles
  const handleDistributeRoyalties = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBcdaAgent) return;
    if (!selectedWorkId) return;

    setIsDistributing(true);
    setDistributionResult(null);
    try {
      const res = await bcdaApi.distributeRoyalties({
        work_id: selectedWorkId,
        total_amount_fcfa: distributeAmount,
        source_channel: sourceChannel
      });

      setDistributionResult(res);
      setNotification(res.message);
      loadData();
    } catch (err: any) {
      alert("Erreur lors de la répartition");
    } finally {
      setIsDistributing(false);
    }
  };

  const toggleExpandWork = (id: string) => {
    setExpandedWorkId(expandedWorkId === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Modal Auth */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* En-tête BCDA Moderne sans boutons doublons */}
      <div className="bg-slate-900/95 border-2 border-congo-yellow/40 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-congo-green/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-congo-yellow/10 border border-congo-yellow/30 text-xs font-bold text-congo-yellow">
                <ShieldCheck className="w-4 h-4" />
                <span>République du Congo • Bureau Congolais du Droit d'Auteur (BCDA)</span>
              </div>

              {user ? 
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{user.artist_name || user.full_name} ({user.role})</span>
                </span>
               : 
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-400">
                  Répertoire Public des Œuvres
                </span>
              }
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Portail National <span className="text-congo-yellow">BCDA</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Répertoire officiel des créations, droits voisins, licences des <strong>Taxis 100-100, Bus, Discothèques</strong> et sécurisation de billetterie.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Lien Guide & FAQ Officielle SACEM/BCDA */}
            <Link
              href="/bcda/guide"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs shadow-lg flex items-center space-x-2 transition border border-slate-700"
            >
              <FileText className="w-4 h-4 text-congo-yellow" />
              <span>Guide & FAQ Droit d'Auteur 🇨🇬</span>
            </Link>

            {/* Actions selon le rôle */}
            {isArtist && 
              <Link
                href="/bcda/deposer"
                className="px-4 py-2.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg flex items-center space-x-2 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Déposer une Œuvre (8 Étapes)</span>
              </Link>
            }

            {(isOrganizer || isBcdaAgent) && 
              <button
                onClick={() => setIsPhysicalTicketOpen(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center space-x-2 transition"
              >
                <Ticket className="w-4 h-4" />
                <span>Sécuriser Billets Papier</span>
              </button>
            }

            {isBcdaAgent && 
              <button
                onClick={() => setIsDistributeOpen(true)}
                className="px-4 py-2.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center space-x-2 transition"
              >
                <Wallet className="w-4 h-4" />
                <span>Répartir Redevances</span>
              </button>
            }

            {!isAuth && 
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center space-x-2 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Espace Artiste / Connexion</span>
              </button>
            }
          </div>
        </div>
      </div>

      {/* Chiffres Clés du Registre National BCDA */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">Œuvres Enregistrées</span>
            <strong className="text-xl font-black text-white">{stats.total_works_registered ?? 0}</strong>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">Établissements Licenciés</span>
            <strong className="text-xl font-black text-white">{stats.total_licensed_venues ?? 0}</strong>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">Collecté au Total</span>
            <strong className="text-xl font-black text-congo-yellow">
              {Number(stats.total_collected_fcfa || 0).toLocaleString("fr-FR")} FCFA
            </strong>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">Reversé aux Artistes</span>
            <strong className="text-xl font-black text-emerald-400">
              {Number(stats.total_paid_out_to_artists_fcfa || 0).toLocaleString("fr-FR")} FCFA
            </strong>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && 
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl text-emerald-200 text-xs flex items-center justify-between animate-fade-in shadow-2xl">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-congo-green flex-shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      }

      {/* Navigation Onglets Unifiée BCDA */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("works")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === "works" ? "bg-congo-green text-white shadow-lg font-black" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Music className="w-4 h-4" />
          <span>{isArtist && !isBcdaAgent ? `Mes Œuvres Déposées (${filteredWorks.length})` : `Répertoire National des Œuvres (${filteredWorks.length})`}</span>
        </button>

        {isBcdaAgent && 
          <button
            onClick={() => setActiveTab("licenses")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === "licenses" ? "bg-sky-500 text-slate-950 shadow-lg font-black" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Vignettes Taxis, Bus & Salons ({licenses.length})</span>
          </button>
        }
      </div>

      {/* 1. ONGLET : RÉPERTOIRE DES ŒUVRES POPULAIRES & RECHERCHE INSTANTANÉE (STYLE SACEM) */}
      {activeTab === "works" && 
        <div className="space-y-4">
          
          {/* Barre de Recherche SACEM */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-xl">
              <input
                type="text"
                placeholder="Rechercher par titre de chanson, nom d'artiste, compositeur, ISRC, ISWC ou N° BCDA..."
                value={searchWorks}
                onChange={(e) => setSearchWorks(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-congo-green"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              {searchWorks && 
                <button onClick={() => setSearchWorks("")} className="absolute right-3.5 top-3 text-slate-500 hover:text-white text-xs">✕</button>
              }
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="font-semibold text-white">{filteredWorks.length}</span> œuvre(s) trouvée(s)
            </div>
          </div>

          {/* TABLEAU COMPRESSÉ STYLE SACEM */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Titre de l'Œuvre</th>
                    <th className="py-3 px-4">Auteur(s) & Compositeur(s)</th>
                    <th className="py-3 px-4">Interprète & Clip</th>
                    <th className="py-3 px-4">Identifiants (ISWC / ISRC)</th>
                    <th className="py-3 px-4 text-right">Détails & Splits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredWorks.length > 0 ? 
                    filteredWorks.map((work) => {
                      const isExpanded = expandedWorkId === work.id;
                      
                      const authorsStr = (work.authors || []).map((a: any) => a.name).join(", ") || "Non spécifié";
                      const composersStr = (work.composers || []).map((c: any) => c.name).join(", ") || "Non spécifié";
                      const performersStr = (work.performers || []).map((p: any) => p.name).join(", ") || "Prince Nzassi";
                      const director = work.music_video_directors && work.music_video_directors[0] ? work.music_video_directors[0].name : null;

                      return (
                        <tr key={work.id} className="group hover:bg-slate-800/40 transition">
                          <td colSpan={5} className="p-0">
                            
                            {/* LIGNE PRINCIPALE CONDENSÉE */}
                            <div 
                              onClick={() => toggleExpandWork(work.id)}
                              className="grid grid-cols-1 md:grid-cols-5 items-center py-3.5 px-4 cursor-pointer select-none gap-2"
                            >
                              {/* 1. Titre & Genre */}
                              <div className="space-y-0.5">
                                <strong className="text-white text-sm font-bold block group-hover:text-congo-yellow transition">
                                  {work.work_title}
                                </strong>
                                <span className="text-[11px] text-slate-400">{work.genre || "Rumba Congolaise"}</span>
                              </div>

                              {/* 2. Auteurs & Compositeurs */}
                              <div className="text-xs space-y-0.5 text-slate-300">
                                <div><span className="text-slate-500 font-semibold text-[10px]">Aut :</span> {authorsStr}</div>
                                <div><span className="text-slate-500 font-semibold text-[10px]">Comp :</span> {composersStr}</div>
                              </div>

                              {/* 3. Interprète & Réalisateur Clip */}
                              <div className="text-xs space-y-0.5 text-slate-300">
                                <div><span className="text-slate-500 font-semibold text-[10px]">Chant :</span> {performersStr}</div>
                                {director && 
                                  <div className="text-purple-300 truncate">
                                    <span className="text-purple-400 font-semibold text-[10px]">Clip :</span> {director}
                                  </div>
                                }
                              </div>

                              {/* 4. Codes ISWC & ISRC & BCDA */}
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                                  <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-congo-yellow">
                                    {work.iswc_code || "ISWC en cours"}
                                  </span>
                                  <span className="text-slate-500">|</span>
                                  <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-sky-400">
                                    {work.isrc_code}
                                  </span>
                                </div>
                                <span className="text-[10px] text-congo-green font-bold block">{work.registration_number}</span>
                              </div>

                              {/* 5. Statut & Bouton Déplier */}
                              <div className="flex items-center justify-end space-x-3">
                                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full text-[10px] font-bold hidden sm:inline-block">
                                  ✓ Certifié BCDA
                                </span>
                                <button className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800">
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-congo-yellow" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* VOLET DÉPLIABLE EN ACCORDÉON */}
                            {isExpanded && 
                              <div className="bg-slate-950 border-t border-slate-800/80 p-4 animate-fade-in space-y-3">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Feuille de Répartition Légale & Ayants Droit (Split Sheet BCDA) :
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                                    <span className="text-[10px] text-congo-green font-bold block mb-0.5">✍️ Auteur (Paroles)</span>
                                    {work.authors?.map((a: any, idx: number) => 
                                      <div key={idx} className="text-slate-200 text-[11px]">
                                        <strong>{a.name}</strong> <span className="text-congo-yellow font-bold">({a.split_percentage}%)</span>
                                        <div className="text-[10px] text-slate-500">{isAuth ? `MoMo: ${a.phone}` : "MoMo: ••••••••"}</div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                                    <span className="text-[10px] text-congo-yellow font-bold block mb-0.5">🎼 Compositeur</span>
                                    {work.composers?.map((c: any, idx: number) => 
                                      <div key={idx} className="text-slate-200 text-[11px]">
                                        <strong>{c.name}</strong> <span className="text-congo-yellow font-bold">({c.split_percentage}%)</span>
                                        <div className="text-[10px] text-slate-500">{isAuth ? `MoMo: ${c.phone}` : "MoMo: ••••••••"}</div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                                    <span className="text-[10px] text-sky-400 font-bold block mb-0.5">🎤 Droits Voisins</span>
                                    {work.performers?.map((p: any, idx: number) => 
                                      <div key={idx} className="text-slate-200 text-[11px]">
                                        <strong>{p.name}</strong> <span className="text-congo-yellow font-bold">({p.split_percentage}%)</span>
                                        <div className="text-[10px] text-slate-500">{isAuth ? `MoMo: ${p.phone}` : "MoMo: ••••••••"}</div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                                    <span className="text-[10px] text-congo-red font-bold block mb-0.5">📀 Producteur</span>
                                    {work.producers?.map((pr: any, idx: number) => 
                                      <div key={idx} className="text-slate-200 text-[11px]">
                                        <strong>{pr.name}</strong> <span className="text-congo-yellow font-bold">({pr.split_percentage}%)</span>
                                        <div className="text-[10px] text-slate-500">{isAuth ? `MoMo: ${pr.phone}` : "MoMo: ••••••••"}</div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-2.5 bg-slate-900 border border-purple-800/80 rounded-xl bg-purple-950/20">
                                    <span className="text-[10px] text-purple-400 font-bold block mb-0.5">🎬 Réalisateur Clip</span>
                                    {work.music_video_directors && work.music_video_directors.length > 0 ? 
                                      work.music_video_directors.map((d: any, idx: number) => 
                                        <div key={idx} className="text-slate-200 text-[11px]">
                                          <strong>{d.name}</strong> <span className="text-congo-yellow font-bold">({d.tv_split_percentage || d.split_percentage}%)</span>
                                          <div className="text-[10px] text-slate-500">{isAuth ? `MoMo: ${d.phone}` : "MoMo: ••••••••"}</div>
                                        </div>
                                      )
                                     : 
                                      <div className="text-[10px] text-slate-500 italic">Clip non déclaré</div>
                                    }
                                  </div>
                                </div>
                              </div>
                            }

                          </td>
                        </tr>
                      );
                    })
                   : 
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                        Aucune œuvre correspondant à la recherche "{searchWorks}".
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>
      }

      {/* 2. ONGLET : IMPORT DISTROKID / TUNECORE & DROITS MONDIAUX (PUBLISHING) */}
      {activeTab === "publishing" && 
        <div className="space-y-6 animate-fade-in">
          {/* Bannière explicative */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-400">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Administration Mondiale d'Édition (The MLC / CISAC / BCDA)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Récupérez les 15% à 20% de Droits d'Auteur sur DistroKid & TuneCore
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  DistroKid et TuneCore ne réclament pas vos droits d'auteur sur Spotify/Apple Music aux USA et dans le monde. Entrez votre code ISRC existant : Moyo génère votre code ISWC mondial et dépose la réclamation auprès de <strong>The MLC</strong> et du <strong>BCDA</strong> !
                </p>
              </div>

              <button
                onClick={() => setIsPubImportOpen(true)}
                className="px-5 py-3 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 flex-shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Rattacher un ISRC</span>
              </button>
            </div>
          </div>

          {/* Résumé des revenus d'édition mondiale */}
          {pubAnalytics && 
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400 block">Titres Rattachés</span>
                <strong className="text-xl font-black text-white">{pubAnalytics.total_tracks || 0}</strong>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400 block">Streams Suivis</span>
                <strong className="text-xl font-black text-white">{Number(pubAnalytics.total_streams || 0).toLocaleString("fr-FR")}</strong>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400 block">Droits Voisins Content ID</span>
                <strong className="text-xl font-black text-congo-yellow">
                  {Number(pubAnalytics.total_content_id || 0).toLocaleString("fr-FR")} FCFA
                </strong>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400 block">Total Collecté (Mondial)</span>
                <strong className="text-xl font-black text-emerald-400">
                  {Number(pubAnalytics.grand_total_fcfa || 0).toLocaleString("fr-FR")} FCFA
                </strong>
              </div>
            </div>
          }

          {/* Tableau des morceaux administrés */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Morceaux Administrés ({pubCatalog.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400">Titres rattachés via leur ISRC DistroKid/TuneCore.</p>
              </div>

              <button
                onClick={() => setIsPubImportOpen(true)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700"
              >
                + Ajouter
              </button>
            </div>

            {pubCatalog.length === 0 ? 
              <div className="p-8 text-center space-y-3">
                <Globe className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Aucun morceau DistroKid/TuneCore rattaché pour le moment.</p>
                <button
                  onClick={() => setIsPubImportOpen(true)}
                  className="px-4 py-2 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs"
                >
                  Rattacher mon premier ISRC 🚀
                </button>
              </div>
             : 
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Titre & Artiste</th>
                      <th className="p-3">Distributeur Source</th>
                      <th className="p-3">Codes Internationaux</th>
                      <th className="p-3 text-center">Streams Trackés</th>
                      <th className="p-3 text-center">Droits Collectés</th>
                      <th className="p-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pubCatalog.map((t) => 
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="p-3">
                          <strong className="text-white block">{t.track_title}</strong>
                          <span className="text-[10px] text-slate-400">{t.artist_name}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {t.original_distributor || "DistroKid"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[10px]">
                          <div><span className="text-slate-500">ISRC:</span> {t.isrc_code}</div>
                          <div className="text-congo-yellow"><span className="text-slate-500">ISWC:</span> {t.iswc_code}</div>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300 font-bold">
                          {(t.total_streams_tracked || 0).toLocaleString("fr-FR")}
                        </td>
                        <td className="p-3 text-center text-congo-yellow font-bold">
                          {parseFloat(t.total_collected_fcfa || 0).toLocaleString("fr-FR")} FCFA
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ● Collecte Active (The MLC)
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }

      {/* MODAL POPUP : IMPORTER UN ISRC DIRECTEMENT DANS BCDA */}
      {isPubImportOpen && 
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl text-white">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Administration Mondiale d'Édition
                </span>
                <h3 className="text-xl font-black text-white mt-1">Rattacher un Code ISRC</h3>
                <p className="text-xs text-slate-400">Récupérez vos droits d'auteur mondiaux The MLC et BCDA.</p>
              </div>
              <button onClick={() => setIsPubImportOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {pubError && 
              <div className="p-3 bg-rose-950/60 border border-rose-500 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pubError}</span>
              </div>
            }

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingPub(true);
                setPubError("");
                try {
                  const res = await publishingApi.importIsrc({
                    isrc_code: pubIsrc,
                    track_title: pubTitle,
                    artist_name: pubArtist,
                    original_distributor: pubDistributor
                  });
                  setNotification(`🎉 Morceau "${pubTitle || pubIsrc}" rattaché avec succès ! Code ISWC : ${res.iswc_code}`);
                  setIsPubImportOpen(false);
                  setPubIsrc("");
                  setPubTitle("");
                  loadData();
                } catch (err: any) {
                  setPubError(err.message || "Erreur lors du rattachement de l'ISRC.");
                } finally {
                  setIsSubmittingPub(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-slate-300 font-bold block mb-1">Distributeur Digital d'Origine *</label>
                <select
                  value={pubDistributor}
                  onChange={(e) => setPubDistributor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="DistroKid">DistroKid 📦</option>
                  <option value="TuneCore">TuneCore 🎵</option>
                  <option value="CD Baby">CD Baby 💿</option>
                  <option value="Believe">Believe / Backstage 🏢</option>
                  <option value="Autre">Autre Distributeur</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Code ISRC du Morceau *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: QZ-DA4-24-00123"
                  value={pubIsrc}
                  onChange={(e) => setPubIsrc(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Titre du Morceau *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rumba du Fleuve"
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Nom d'Artiste / Auteur *</label>
                <input
                  type="text"
                  required
                  value={pubArtist}
                  onChange={(e) => setPubArtist(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPubImportOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPub}
                  className="px-6 py-2 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl"
                >
                  {isSubmittingPub ? "Rattachement..." : "Activer la Collecte Mondiale 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      {/* 3. ONGLET : VIGNETTES TRANSPORTS AVEC RENOUVELLEMENT 1 CLIC */}
      {activeTab === "licenses" && 
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full max-w-lg">
              <input
                type="text"
                placeholder="Rechercher par numéro de plaque (ex: 452-EZ-06), nom du bar ou code vignette..."
                value={searchLicenses}
                onChange={(e) => setSearchLicenses(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              {searchLicenses && 
                <button onClick={() => setSearchLicenses("")} className="absolute right-3.5 top-3 text-slate-500 hover:text-white text-xs">✕</button>
              }
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLicenseModalMode("renew");
                  setIsLicenseModalOpen(true);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition shadow-md"
              >
                <RotateCw className="w-4 h-4 text-congo-yellow" />
                <span>Renouveler ma Vignette (1 Clic)</span>
              </button>

              <button
                onClick={() => {
                  setLicenseModalMode("new");
                  setIsLicenseModalOpen(true);
                }}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
              >
                <Car className="w-4 h-4" />
                <span>Nouvelle Souscription</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLicenses.length > 0 ? 
              filteredLicenses.map((lic) => 
                <div key={lic.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-sky-500/40 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lic.venue_type.includes("Taxi") || lic.venue_type.includes("Bus") 
                          ? "bg-amber-950 border border-amber-800 text-congo-yellow" 
                          : "bg-sky-950 border border-sky-800 text-sky-400"
                      }`}>
                        {lic.license_code}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">{lic.venue_name}</h4>
                      <span className="text-xs text-slate-400">{lic.venue_type} • {lic.city}</span>
                    </div>

                    {/* VRAI QR CODE SCANNABLE */}
                    <button
                      onClick={() => {
                        window.open(`/verify/license/${lic.license_code}`, "_blank");
                      }}
                      title="Cliquer pour vérifier le certificat officiel ou imprimer l'autocollant"
                      className="w-14 h-14 p-1 rounded-xl bg-white border-2 border-slate-700 hover:border-congo-yellow flex items-center justify-center transition shadow-lg group relative cursor-pointer"
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://moyo-culture.cg/verify/license/${lic.license_code}`}
                        alt={`QR Code ${lic.license_code}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <div><span className="text-slate-500">Emplacement / Ligne :</span> {lic.address}</div>
                    <div><span className="text-slate-500">Contact :</span> {lic.owner_name} ({isAuth ? lic.owner_phone : "••••••••"})</div>
                    <div><span className="text-slate-500">Validité :</span> <strong className="text-emerald-400">Jusqu'au {new Date(lic.valid_until).toLocaleDateString("fr-FR")}</strong></div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                    <button
                      onClick={() => {
                        setRenewLicenseCode(lic.license_code);
                        setLicenseModalMode("renew");
                        setIsLicenseModalOpen(true);
                      }}
                      className="text-congo-yellow hover:underline flex items-center space-x-1 font-bold text-[11px]"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Renouveler (+1 an)</span>
                    </button>

                    <Link
                      href={`/verify/license/${lic.license_code}`}
                      target="_blank"
                      className="text-[10px] text-sky-400 hover:underline flex items-center space-x-1"
                    >
                      <span>Certificat / Imprimer 🖨️</span>
                    </Link>
                  </div>
                </div>
              )
             : 
              <div className="col-span-3 text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs">
                Aucun établissement ou véhicule correspondant à la recherche "{searchLicenses}".
              </div>
            }
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* MODALE : SOUSCRIPTION & RENOUVELLEMENT DE VIGNETTES / PASS */}
      {/* ========================================================================= */}
      {isLicenseModalOpen && 
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsLicenseModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm mb-3">
              <Car className="w-5 h-5" />
              <span>Vignettes Transports & Pass BCDA</span>
            </div>

            {/* Sélecteur Mode : 1. Nouvelle Souscription / 2. Renouvellement */}
            <div className="flex gap-2 border-b border-slate-800 pb-3 mb-4 text-xs">
              <button
                type="button"
                onClick={() => setLicenseModalMode("new")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${licenseModalMode === "new" ? "bg-sky-500 text-slate-950" : "bg-slate-950 text-slate-400"}`}
              >
                1. Nouvelle Souscription
              </button>
              <button
                type="button"
                onClick={() => setLicenseModalMode("renew")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${licenseModalMode === "renew" ? "bg-congo-yellow text-slate-950" : "bg-slate-950 text-slate-400"}`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>2. Renouvellement (1 an)</span>
              </button>
            </div>

            {licenseModalMode === "new" ? 
              <form onSubmit={handlePayLicense} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Nom / Immatriculation / Enseigne *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Taxi 100-100 Plaque 784-FA-06 ou Le Privilège"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Catégorie</label>
                  <select
                    value={venueType}
                    onChange={(e) => {
                      setVenueType(e.target.value);
                      if (e.target.value.includes("Taxi")) setMonthlyFee(2500);
                      else if (e.target.value.includes("Bus")) setMonthlyFee(10000);
                      else if (e.target.value.includes("Bateau")) setMonthlyFee(15000);
                      else if (e.target.value.includes("Salon")) setMonthlyFee(7500);
                      else if (e.target.value.includes("Discothèque")) setMonthlyFee(65000);
                      else if (e.target.value.includes("Lounge")) setMonthlyFee(45000);
                      else setMonthlyFee(20000);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Taxi 100-100 / VTC">🚕 Taxi 100-100 / VTC (2 500 FCFA / an)</option>
                    <option value="Bus Transport Coaster">🚌 Bus Transport Coaster (10 000 FCFA / an)</option>
                    <option value="Bateau / Canot Fleuve Congo">🚤 Bateau Rapide Pool Malebo (15 000 FCFA / an)</option>
                    <option value="Salon de Coiffure / Beauté">💈 Salon de Coiffure / Beauté (7 500 FCFA / an)</option>
                    <option value="Discothèque / Club">🍸 Discothèque / Club VIP (65 000 FCFA / mois)</option>
                    <option value="Bar VIP / Lounge">🍹 Bar VIP / Lounge (45 000 FCFA / mois)</option>
                    <option value="Nganda / Maquis">🍻 Nganda / Maquis Populaire (20 000 FCFA / mois)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Propriétaire/Chauffeur</label>
                    <input type="text" placeholder="Ex: Michel Mabiala" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Numéro MoMo / Airtel *</label>
                    <input type="tel" required placeholder="06XXXXXXXX" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Ville</label>
                    <select value={venueCity} onChange={(e) => setVenueCity(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white">
                      <option value="Brazzaville">Brazzaville</option>
                      <option value="Pointe-Noire">Pointe-Noire</option>
                      <option value="Dolisie">Dolisie</option>
                      <option value="Nkayi">Nkayi</option>
                      <option value="Ouesso">Ouesso</option>
                      <option value="Owando">Owando</option>
                      <option value="Impfondo">Impfondo</option>
                      <option value="Sibiti">Sibiti</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Ligne / Quartier</label>
                    <input type="text" placeholder="Ex: Bacongo - Moungali" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center font-bold">
                  <span className="text-slate-400">Montant Forfaitaire :</span>
                  <span className="text-congo-yellow text-sm">{monthlyFee.toLocaleString()} FCFA</span>
                </div>

                <button type="submit" className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl shadow-xl">
                  Valider Paiement MoMo 📱
                </button>
              </form>
             : 
              <form onSubmit={handleRenewLicense} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Numéro de Vignette / Code BCDA *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: VIG-BCDA-2026-TAXI-012"
                    value={renewLicenseCode}
                    onChange={(e) => setRenewLicenseCode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-congo-yellow focus:outline-none focus:border-congo-yellow"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Le numéro présent sur votre autocollant pare-brise.</span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Numéro Téléphone Payeur (MoMo / Airtel)</label>
                  <input
                    type="tel"
                    placeholder="06XXXXXXXX"
                    value={renewPhone}
                    onChange={(e) => setRenewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                  <span>Prolongation automatique de la validité de <strong>+365 jours</strong> sans avoir à créer un nouveau dossier.</span>
                </div>

                <button type="submit" className="w-full py-3 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-xl flex items-center justify-center space-x-2">
                  <RotateCw className="w-4 h-4" />
                  <span>Prolonger la Vignette pour 1 An 📱</span>
                </button>
              </form>
            }
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* MODALE : DÉPÔT D'ŒUVRE & CLIP (RÉSERVÉ ARTISTE) */}
      {/* ========================================================================= */}
      {isRegisterWorkOpen && 
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsRegisterWorkOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-congo-green font-bold text-sm mb-4">
              <PlusCircle className="w-5 h-5" />
              <span>Immatriculation d'une Œuvre & Clip (5 Volets de Droits)</span>
            </div>

            <form onSubmit={handleRegisterWork} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Titre de la Chanson *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rumba du Fleuve"
                    value={workTitle}
                    onChange={(e) => setWorkTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-green"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Genre Musical</label>
                  <input
                    type="text"
                    placeholder="Rumba, Soukous, Afrobeat, Gospel, etc."
                    value={workGenre}
                    onChange={(e) => setWorkGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* 1. FICHIER AUDIO MASTER (POUR EMPREINTE ACOUSTIQUE IA) */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-emerald-400 font-bold flex items-center space-x-1.5">
                    <Music className="w-4 h-4" />
                    <span>Fichier Audio Master (.WAV / .MP3) pour Empreinte Acoustique IA *</span>
                  </label>
                  <span className="text-[10px] text-congo-yellow font-mono">Standard Shazam / SACEM</span>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-congo-green file:text-white hover:file:bg-emerald-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  L'empreinte acoustique fréquentielle sera calculée pour permettre la reconnaissance automatique lors des passages sur <strong>Télé Congo, DRTV, Top Congo FM et YouTube</strong>.
                </p>
              </div>

              {/* 2. AJOUT DYNAMIQUE LIGNE PAR LIGNE DES AYANTS DROIT */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-white font-bold text-xs flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-congo-yellow" />
                    <span>Feuille de Répartition Légale des Ayants Droit (Splits)</span>
                  </span>
                  
                  {/* Jauge des 100% */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    authorSplit + composerSplit + performerSplit + producerSplit + directorSplit === 100
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-red-950 text-red-400 border border-red-800"
                  }`}>
                    Total : {authorSplit + composerSplit + performerSplit + producerSplit + directorSplit} % / 100%
                  </span>
                </div>

                {/* Ligne 1 : Auteur */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-congo-green font-bold text-[11px]">1. Auteur des Paroles (Droit d'Auteur)</span>
                    <span className="text-[10px] text-slate-500">✍️ Texte</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" placeholder="Nom de l'auteur" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <input type="tel" placeholder="Téléphone / MoMo" value={authorPhone} onChange={(e) => setAuthorPhone(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <div className="flex items-center space-x-1">
                      <input type="number" placeholder="%" value={authorSplit} onChange={(e) => setAuthorSplit(parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-congo-yellow font-bold text-center" />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Ligne 2 : Compositeur */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-congo-yellow font-bold text-[11px]">2. Compositeur / Beatmaker (Droit de Composition)</span>
                    <span className="text-[10px] text-slate-500">🎼 Mélodie</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" placeholder="Nom compositeur" value={composerName} onChange={(e) => setComposerName(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <input type="tel" placeholder="Téléphone / MoMo" value={composerPhone} onChange={(e) => setComposerPhone(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <div className="flex items-center space-x-1">
                      <input type="number" placeholder="%" value={composerSplit} onChange={(e) => setComposerSplit(parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-congo-yellow font-bold text-center" />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Ligne 3 : Interprète */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sky-400 font-bold text-[11px]">3. Artiste-Interprète & Musiciens (Droits Voisins)</span>
                    <span className="text-[10px] text-slate-500">🎤 Chant Lead</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" placeholder="Nom chanteur / interprète" value={performerName} onChange={(e) => setPerformerName(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <input type="tel" placeholder="Téléphone / MoMo" value={performerPhone} onChange={(e) => setPerformerPhone(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <div className="flex items-center space-x-1">
                      <input type="number" placeholder="%" value={performerSplit} onChange={(e) => setPerformerSplit(parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-congo-yellow font-bold text-center" />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Ligne 4 : Producteur Master */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-congo-red font-bold text-[11px]">4. Producteur Phonographique (Droits du Master Audio)</span>
                    <span className="text-[10px] text-slate-500">📀 Master</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" placeholder="Nom label / producteur" value={producerName} onChange={(e) => setProducerName(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <input type="tel" placeholder="Téléphone / MoMo" value={producerPhone} onChange={(e) => setProducerPhone(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <div className="flex items-center space-x-1">
                      <input type="number" placeholder="%" value={producerSplit} onChange={(e) => setProducerSplit(parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-congo-yellow font-bold text-center" />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Ligne 5 : Réalisateur Clip Vidéo */}
                <div className="p-3 bg-slate-950 border border-purple-800/80 rounded-xl space-y-2 bg-purple-950/20">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400 font-bold text-[11px]">5. Réalisateur Clip Vidéo (Droits Audiovisuels TV & Web)</span>
                    <span className="text-[10px] text-purple-300">🎬 Clip</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" placeholder="Nom du réalisateur de clip" value={directorName} onChange={(e) => setDirectorName(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <input type="tel" placeholder="Téléphone / MoMo" value={directorPhone} onChange={(e) => setDirectorPhone(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                    <div className="flex items-center space-x-1">
                      <input type="number" placeholder="%" value={directorSplit} onChange={(e) => setDirectorSplit(parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-congo-yellow font-bold text-center" />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-[11px] text-amber-200 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-congo-yellow flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Compte Séquestre BCDA d'Attente :</strong> Si un ayant droit mentionné n'a pas encore de compte sur Moyo Culture, ses redevances seront sécurisées sur un compte d'attente BCDA et lui seront reversées dès sa réclamation.
                </span>
              </div>

              <button
                type="submit"
                disabled={authorSplit + composerSplit + performerSplit + producerSplit + directorSplit !== 100}
                className="w-full py-3.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authorSplit + composerSplit + performerSplit + producerSplit + directorSplit === 100
                  ? "Valider l'Immatriculation BCDA (Musique + Clip) ✓"
                  : `Ajustez les pourcentages (Total actuel: ${authorSplit + composerSplit + performerSplit + producerSplit + directorSplit}% / 100%)`}
              </button>
            </form>
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* MODALE : CANAL A - SÉCURISATION & RAPPROCHEMENT BILLETS PHYSIQUES */}
      {/* ========================================================================= */}
      {isPhysicalTicketOpen && 
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsPhysicalTicketOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm mb-4">
              <Ticket className="w-5 h-5" />
              <span>Sécurisation & Rapprochement de Billetterie Papier</span>
            </div>

            <div className="flex gap-2 border-b border-slate-800 pb-3 mb-4 text-xs">
              <button
                type="button"
                onClick={() => setIsReconcileOpen(false)}
                className={`px-3 py-1.5 rounded-lg font-bold ${!isReconcileOpen ? "bg-purple-600 text-white" : "bg-slate-950 text-slate-400"}`}
              >
                1. Tirage Imprimerie (Timbre QR)
              </button>
              <button
                type="button"
                onClick={() => setIsReconcileOpen(true)}
                className={`px-3 py-1.5 rounded-lg font-bold ${isReconcileOpen ? "bg-purple-600 text-white" : "bg-slate-950 text-slate-400"}`}
              >
                2. Rapprochement Invendus / Annulation
              </button>
            </div>

            {!isReconcileOpen ? 
              <form onSubmit={handleStampPhysicalTickets} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Nom du Concert / Spectacle *</label>
                  <input type="text" required placeholder="Ex: Concert Rumba Palais des Congrès" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Tirage Papier Prévu</label>
                    <input type="number" value={ticketsPrinted} onChange={(e) => setTicketsPrinted(parseInt(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Prix Unitaire (FCFA)</label>
                    <input type="number" value={unitTicketPrice} onChange={(e) => setUnitTicketPrice(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xl flex items-center justify-center space-x-2">
                  <Printer className="w-4 h-4" />
                  <span>Générer Timbre d'Imprimerie</span>
                </button>

                {ticketBatchResult && 
                  <div className="p-4 bg-slate-950 border border-purple-500 rounded-2xl space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                      <strong className="text-white">{ticketBatchResult.batch_code}</strong>
                      <img src={ticketBatchResult.security_stamp_qr} alt="QR" className="w-12 h-12 bg-white rounded-lg p-0.5" />
                    </div>
                    <p className="text-[11px] text-slate-400">Timbre prêt à intégrer sur les souches physiques.</p>
                  </div>
                }
              </form>
             : 
              <form onSubmit={handleReconcileTickets} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Code du Lot de Billets *</label>
                  <input type="text" required placeholder="Ex: TIMBRE-BCDA-2026-XXXXXX" value={reconcileBatchCode} onChange={(e) => setReconcileBatchCode(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-congo-yellow" />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                  <input type="checkbox" id="cancel" checked={isCancelledEvent} onChange={(e) => setIsCancelledEvent(e.target.checked)} className="rounded" />
                  <label htmlFor="cancel" className="text-slate-200 cursor-pointer">Le concert a été annulé (Taxe = 0 FCFA)</label>
                </div>

                {!isCancelledEvent && 
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Billets Réellement Vendus</label>
                      <input type="number" value={actualSold} onChange={(e) => setActualSold(parseInt(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Souches Invendues Restituées</label>
                      <input type="number" value={unsoldReturned} onChange={(e) => setUnsoldReturned(parseInt(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                    </div>
                  </div>
                }

                <button type="submit" className="w-full py-3 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-xl">
                  Valider le Rapprochement de Guichet
                </button>

                {reconciliationResult && 
                  <div className="p-4 bg-slate-950 border border-congo-green rounded-2xl text-xs space-y-1 text-slate-300 mt-4">
                    <strong className="text-emerald-400 block">✓ Clôture Validée</strong>
                    <div>Taxe BCDA finale ajustée : <strong className="text-congo-yellow">{reconciliationResult.final_tax_collected_fcfa.toLocaleString()} FCFA</strong></div>
                  </div>
                }
              </form>
            }
          </div>
        </div>
      }

      {/* ========================================================================= */}
      {/* MODALE : MOTEUR DE RÉPARTITION DES REDEVANCES (RÉSERVÉ AGENTS BCDA) */}
      {/* ========================================================================= */}
      {isDistributeOpen && isBcdaAgent && 
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsDistributeOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-congo-yellow font-bold text-sm mb-2">
              <Wallet className="w-5 h-5" />
              <span>Exécution de la Répartition Nationale (Crédit Sécurisé sur Portefeuille)</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Les fonds sont crédités instantanément dans le <strong>portefeuille interne Moyo Culture</strong> des ayants droit. L'artiste peut ainsi retirer son argent d'un bloc sans être spammé par des SMS MoMo.
            </p>

            <form onSubmit={handleDistributeRoyalties} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Sélectionner l'Œuvre Musicale *</label>
                <select value={selectedWorkId} onChange={(e) => setSelectedWorkId(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white">
                  {works.map((w) => 
                    <option key={w.id} value={w.id}>{w.work_title} ({w.isrc_code})</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Montant à Répartir (FCFA)</label>
                  <input type="number" value={distributeAmount} onChange={(e) => setDistributeAmount(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-congo-yellow" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Source de Collecte</label>
                  <select value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white">
                    <option value="Télévisions (Télé Congo, DRTV, Vox TV) & YouTube">Télévisions & YouTube</option>
                    <option value="Taxis 100-100, Bus & Transports BCDA">Taxis 100-100 & Transports</option>
                    <option value="Discothèques & Bars VIP">Discothèques & Bars</option>
                    <option value="Concerts & Billetterie Papier">Concerts & Billetterie</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={isDistributing} className="w-full py-3.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-xl transition">
                {isDistributing ? "Crédit en cours..." : "Créditer les Portefeuilles des 5 Ayants Droit 💸"}
              </button>

              {distributionResult && 
                <div className="p-4 bg-slate-950 border border-congo-green rounded-2xl space-y-3 mt-4">
                  <div className="flex justify-between items-center text-xs">
                    <strong className="text-emerald-400">{distributionResult.work_title}</strong>
                    <span className="font-black text-congo-yellow">{distributionResult.total_distributed_fcfa.toLocaleString()} FCFA</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px]">
                          <th className="pb-1">Ayant Droit</th>
                          <th className="pb-1">Rôle</th>
                          <th className="pb-1">Part</th>
                          <th className="pb-1">Montant</th>
                          <th className="pb-1">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {distributionResult.beneficiaries_paid.map((b: any, idx: number) => 
                          <tr key={idx}>
                            <td className="py-1.5 font-bold text-white">{b.recipient}</td>
                            <td className="py-1.5 text-slate-400">{b.role}</td>
                            <td className="py-1.5 text-congo-yellow">{b.split}</td>
                            <td className="py-1.5 font-extrabold text-emerald-400">+{b.amount_fcfa.toLocaleString()} F</td>
                            <td className="py-1.5 text-[10px] text-emerald-400">✓ {b.status}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </form>
          </div>
        </div>
      }

    </div>
  );
}
