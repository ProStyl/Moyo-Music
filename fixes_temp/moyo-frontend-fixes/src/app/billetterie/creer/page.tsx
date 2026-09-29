"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket, PlusCircle, CheckCircle2, AlertCircle, ArrowLeft, Lock, Calendar, MapPin, Users, Percent, Sparkles, Building2, UserPlus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";

const CONGO_VENUES_LIST = [
  // BRAZZAVILLE
  { id: "palais-congres-grande", name: "Palais des Congrès - Grande Salle des Congrès (Brazzaville)", city: "Brazzaville", capacity: 1800, type: "Salle de Spectacle & Congrès", address: "Plateau des 15 Ans" },
  { id: "palais-congres-banquets", name: "Palais des Congrès - Salle des Banquets / Showcases (Brazzaville)", city: "Brazzaville", capacity: 500, type: "Dîner-Concert & Showcase VIP", address: "Plateau des 15 Ans" },
  { id: "ifc-brazza-savorgnan", name: "Institut Français du Congo (IFC) - Salle Savorgnan de Brazza", city: "Brazzaville", capacity: 480, type: "Théâtre & Concert Acoustique", address: "Rond-Point CCF, Centre-Ville" },
  { id: "ifc-brazza-exterieur", name: "Institut Français du Congo (IFC) - Scène Plein Air", city: "Brazzaville", capacity: 1000, type: "Festival & Scène Extérieure", address: "Rond-Point CCF, Centre-Ville" },
  { id: "stade-massamba-debat", name: "Stade Alphonse Massamba-Débat", city: "Brazzaville", capacity: 33000, type: "Méga-Concert / Festival National", address: "Bacongo" },
  { id: "stade-kintele", name: "Complexe Sportif de la Concorde (Stade de Kintélé)", city: "Brazzaville", capacity: 60000, type: "Stade International & Festival", address: "Kintélé" },
  { id: "radisson-blu-mbamou", name: "Radisson Blu M'Bamou Palace - Salons VIP", city: "Brazzaville", capacity: 300, type: "Showcase Ultra-VIP & Soirée SAPE", address: "Bords du Fleuve Congo" },
  { id: "centre-culturel-zola", name: "Centre Culturel Zola (CCZ Bacongo)", city: "Brazzaville", capacity: 350, type: "Concert Rumba & Théâtre", address: "Rue Mâ-Loango, Bacongo" },

  // POINTE-NOIRE
  { id: "ifc-pnr-tchicaya", name: "Institut Français de Pointe-Noire - Salle Jean-Baptiste Tchicaya U Tam'si", city: "Pointe-Noire", capacity: 350, type: "Concert Live & Spectacle", address: "Centre-Ville" },
  { id: "espace-yaro-pnr", name: "Espace Culturel Yaro (Côte Sauvage)", city: "Pointe-Noire", capacity: 400, type: "Festival & Scène Indépendante", address: "Loandjili / Mer" },
  { id: "stade-municipal-pnr", name: "Stade Municipal de Pointe-Noire", city: "Pointe-Noire", capacity: 13500, type: "Grand Concert Extérieur", address: "Centre-Ville" }
];

export default function CreerEvenementPage() {
  const { user } = useAuth();
  const canCreate = user?.role === "artist" || user?.role === "organizer" || user?.role === "admin";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("Concert Live Rumba");
  const [selectedVenueId, setSelectedVenueId] = useState("ifc-brazza-savorgnan");
  const [eventDate, setEventDate] = useState("2026-11-20T20:00");
  const [ticketPriceFcfa, setTicketPriceFcfa] = useState("5000");
  const [vipPriceFcfa, setVipPriceFcfa] = useState("15000");
  const [totalCapacity, setTotalCapacity] = useState("480");

  // Invités & Line-up
  const [invitedGuests, setInvitedGuests] = useState([
    { name: "Orchestre Les Bantous de la Capitale", role: "Artiste Invité / Première Partie", pass: "Pass VIP Scène" },
    { name: "Président de la SAPE de Bacongo", role: "VIP Guest & Sapeur Célèbre", pass: "Carré VIP Or" },
    { name: "Influenceur Brazza TikTok (+500k)", role: "Influenceur Promo & Médias", pass: "Pass Presse / Backstage" }
  ]);

  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestRole, setNewGuestRole] = useState("Artiste Invité");
  const [newGuestPass, setNewGuestPass] = useState("Pass VIP");

  // Partage des Revenus (Revenue Splits %)
  const [revenueSplits, setRevenueSplits] = useState([
    { name: user?.artist_name || "Artiste Principal (Porteur du Projet)", role: "Artiste Principal", phone: user?.phone_number || "+242068001122", percentage: 50 },
    { name: "Artiste Invité / Orchestre Partenaire", role: "Featuring / Orchestre", phone: "+242065551122", percentage: 25 },
    { name: "Promoteur & Régie Technique", role: "Organisation & Salle", phone: "+242069998877", percentage: 15 },
    { name: "Influenceur & Campagne Digitale", role: "Promotion & Médias", phone: "+242055009988", percentage: 10 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdEvent, setCreatedEvent] = useState<any>(null);

  // Mettre à jour la capacité selon la salle sélectionnée
  const handleVenueChange = (venueId: string) => {
    setSelectedVenueId(venueId);
    const venue = CONGO_VENUES_LIST.find(v => v.id === venueId);
    if (venue) {
      setTotalCapacity(venue.capacity.toString());
    }
  };

  const totalSplitPercentage = revenueSplits.reduce((sum, item) => sum + (parseFloat(item.percentage as any) || 0), 0);

  const addGuest = () => {
    if (!newGuestName.trim()) return;
    setInvitedGuests([...invitedGuests, { name: newGuestName.trim(), role: newGuestRole, pass: newGuestPass }]);
    setNewGuestName("");
  };

  const removeGuest = (index: number) => {
    setInvitedGuests(invitedGuests.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: string, value: any) => {
    const updated = [...revenueSplits];
    updated[index] = { ...updated[index], [field]: value };
    setRevenueSplits(updated);
  };

  const addSplitRow = () => {
    setRevenueSplits([...revenueSplits, { name: "", role: "Collaborateur", phone: "+24206...", percentage: 0 }]);
  };

  const removeSplitRow = (index: number) => {
    setRevenueSplits(revenueSplits.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (totalSplitPercentage !== 100) {
      setError(`Le total du partage des revenus doit être exactement égal à 100% (Actuellement : ${totalSplitPercentage}%).`);
      return;
    }

    const selectedVenue = CONGO_VENUES_LIST.find(v => v.id === selectedVenueId) || CONGO_VENUES_LIST[0];

    setIsSubmitting(true);
    setError("");

    try {
      const res = await apiRequest("/ticketing/events/create", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category: "Concert",
          event_type: eventType,
          venue_name: selectedVenue.name,
          city: selectedVenue.city,
          address: selectedVenue.address,
          event_date: eventDate,
          ticket_price_fcfa: parseFloat(ticketPriceFcfa),
          vip_ticket_price_fcfa: parseFloat(vipPriceFcfa),
          total_capacity: parseInt(totalCapacity, 10),
          invited_guests: invitedGuests,
          revenue_splits: revenueSplits.map(s => ({
            name: s.name,
            role: s.role,
            phone_number: s.phone,
            split_percentage: parseFloat(s.percentage as any)
          })),
          banner_image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
        }),
      });

      setCreatedEvent(res.data.event);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'événement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // VERROU STRICT : Si l'utilisateur n'est ni artiste ni organisateur
  if (!user || !canCreate) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 text-congo-red rounded-3xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Espace Réservé aux Artistes & Promoteurs</h1>
        <p className="text-xs text-slate-400">
          La création d'événements et le partage automatique des revenus de billetterie sont réservés aux artistes musiciens et promoteurs partenaires.
        </p>
        <div className="pt-2">
          <Link
            href="/billetterie"
            className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:text-white rounded-xl text-xs inline-block"
          >
            Retourner à la Billetterie
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <Link href={user.role === 'artist' ? '/distribution' : '/billetterie'} className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour à mon espace</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-10">
        
        {/* En-tête Créateur */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-congo-red/10 text-congo-red flex items-center justify-center font-bold">
              🎤
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Créer un Concert, Gérer Invités & Partage des Gains</h1>
              <p className="text-xs text-slate-400">
                Organisateur / Porteur de projet : <strong>{user.artist_name || user.full_name}</strong> ({user.role === 'artist' ? 'Artiste Musicien' : 'Promoteur'})
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-bold rounded-full">
            Smart Split Contract Actif ⚡
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-2xl text-red-300 text-xs flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {createdEvent ? (
          <div className="bg-slate-950 border border-congo-red/50 rounded-3xl p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-red-500/20 text-congo-red rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Concert & Smart Splits Enregistrés !</h2>
              <p className="text-xs text-slate-400 mt-1">La billetterie MoMo est ouverte et chaque collaborateur recevra automatiquement sa part des gains.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto text-left space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Événement :</span>
                <span className="font-bold text-white">{createdEvent.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Salle & Capacité :</span>
                <span className="text-congo-yellow font-semibold">{createdEvent.venue_name} ({createdEvent.total_capacity} places)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nombre de Collaborateurs :</span>
                <span className="text-emerald-400 font-bold">{revenueSplits.length} ayants droit enregistrés</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Link
                href="/billetterie"
                className="px-5 py-2.5 bg-congo-red hover:bg-red-600 text-white font-bold rounded-xl text-xs"
              >
                Voir sur la Billetterie Publique
              </Link>
              <button
                onClick={() => setCreatedEvent(null)}
                className="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Créer un autre concert
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* 1. DÉTAILS DU CONCERT */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-congo-green text-white text-xs flex items-center justify-center font-bold">1</span>
                <span>Détails & Type d'Événement</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Titre du Concert / Spectacle *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rumba Na Étoiles - Grand Live Bacongo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-congo-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Type d'Événement *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-congo-green"
                  >
                    <option value="Concert Live Rumba">Concert Live Rumba Congolaise</option>
                    <option value="Showcase VIP / Dîner-Spectacle">Showcase VIP / Dîner-Spectacle</option>
                    <option value="Festival & Scène Plein Air">Festival & Scène Plein Air</option>
                    <option value="Release Party & Écoute d'Album">Release Party & Écoute d'Album</option>
                    <option value="Soirée SAPE & Élégance">Soirée SAPE & Élégance</option>
                    <option value="Théâtre & Conte Tradi-Moderne">Théâtre & Conte Tradi-Moderne</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. CHOIX DE LA SALLE RÉELLE DU CONGO */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-congo-green text-white text-xs flex items-center justify-center font-bold">2</span>
                <span>Sélection de la Salle & Ville (Répertoire Officiel Congo 🇨🇬)</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Lieu de Concert Référencé *
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-congo-green font-semibold"
                >
                  <optgroup label="📍 Brazzaville">
                    {CONGO_VENUES_LIST.filter(v => v.city.includes("Brazzaville")).map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} — Capacité : {v.capacity.toLocaleString()} places ({v.type})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📍 Pointe-Noire">
                    {CONGO_VENUES_LIST.filter(v => v.city === "Pointe-Noire").map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} — Capacité : {v.capacity.toLocaleString()} places ({v.type})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Date & Heure *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-congo-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Prix Billet Standard *</label>
                  <input
                    type="number"
                    required
                    value={ticketPriceFcfa}
                    onChange={(e) => setTicketPriceFcfa(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold text-congo-yellow focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Prix Billet Carré VIP</label>
                  <input
                    type="number"
                    value={vipPriceFcfa}
                    onChange={(e) => setVipPriceFcfa(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold text-congo-yellow focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. GESTION DES INVITÉS & LINE-UP */}
            <div className="space-y-4 border-t border-slate-800 pt-8">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-congo-green text-white text-xs flex items-center justify-center font-bold">3</span>
                <span>Artistes Invités, Guests VIP & Influenceurs Promotion</span>
              </h2>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="space-y-2">
                  {invitedGuests.map((guest, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl text-xs border border-slate-800">
                      <div>
                        <strong className="text-white">{guest.name}</strong>
                        <span className="text-[10px] text-congo-green ml-2">({guest.role})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px]">{guest.pass}</span>
                        <button type="button" onClick={() => removeGuest(i)} className="text-slate-500 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    placeholder="Nom invité / Influenceur"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                  />
                  <select
                    value={newGuestRole}
                    onChange={(e) => setNewGuestRole(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="Artiste Invité / Featuring">Artiste Invité</option>
                    <option value="VIP Guest & Sapeur Célèbre">VIP Sapeur Célèbre</option>
                    <option value="Influenceur & Médias">Influenceur Promo</option>
                    <option value="Presse / Journaliste">Média / Télé</option>
                  </select>
                  <button
                    type="button"
                    onClick={addGuest}
                    className="py-2 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow-md"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. SMART REVENUE SPLIT : PARTAGE AUTOMATISÉ DES RECETTES */}
            <div className="space-y-4 border-t border-slate-800 pt-8">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-congo-green text-white text-xs flex items-center justify-center font-bold">4</span>
                  <span>Contrat de Partage des Gains (Smart Split %)</span>
                </h2>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    totalSplitPercentage === 100 ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"
                  }`}>
                    Total : {totalSplitPercentage} % / 100 %
                  </span>
                  <button
                    type="button"
                    onClick={addSplitRow}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    + Ajouter Ayant Droit
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Dès qu'un billet est vendu sur MTN MoMo ou Airtel Money, les fonds sont automatiquement répartis et crédités sur le wallet de chaque collaborateur selon son pourcentage.
              </p>

              <div className="space-y-3">
                {revenueSplits.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl items-center text-xs">
                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-slate-500 block">Nom du Collaborateur</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Nom de l'artiste"
                        value={item.name}
                        onChange={(e) => updateSplit(index, "name", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-500 block">Rôle / Prestation</label>
                      <input
                        type="text"
                        placeholder="Ex: Artiste / Régie / Promo"
                        value={item.role}
                        onChange={(e) => updateSplit(index, "role", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-500 block">Numéro MoMo pour Reversement</label>
                      <input
                        type="tel"
                        placeholder="+242 06..."
                        value={item.phone}
                        onChange={(e) => updateSplit(index, "phone", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-[10px] text-slate-500 block">Part %</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={item.percentage}
                        onChange={(e) => updateSplit(index, "percentage", e.target.value)}
                        className="w-full px-2 py-2 bg-slate-900 border border-congo-green text-congo-green font-bold text-center rounded-lg"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                      {revenueSplits.length > 1 && (
                        <button type="button" onClick={() => removeSplitRow(index)} className="text-slate-500 hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || totalSplitPercentage !== 100}
              className="w-full py-4 bg-gradient-to-r from-congo-red to-amber-600 hover:from-amber-600 hover:to-congo-red text-white font-bold rounded-2xl text-xs transition shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Création de l'événement et des contrats de split...</span>
              ) : (
                <>
                  <span>Publier le Concert & Activer le Partage Automatisé des Gains 🚀</span>
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
