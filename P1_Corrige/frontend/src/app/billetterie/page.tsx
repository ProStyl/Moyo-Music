"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket, MapPin, Calendar, QrCode, Smartphone, CheckCircle, ArrowRight, ScanLine, AlertCircle, RefreshCw, PlusCircle } from "lucide-react";
import { ticketingApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function BilletteriePage() {
  const { user } = useAuth();
  const isOrganizer = user?.role === "organizer" || user?.role === "admin";

  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [ticketType, setTicketType] = useState<"STANDARD" | "VIP">("STANDARD");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await ticketingApi.getEvents();
      if (res.events && res.events.length > 0) {
        setEvents(res.events);
      }
    } catch (err: any) {
      console.error("Erreur chargement événements API :", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPurchasing(true);
    setError("");

    try {
      // Appel API réel vers le Backend PostgreSQL
      const res = await ticketingApi.buyTicket({
        event_id: selectedEvent.id,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        ticket_type: ticketType,
        payment_method: buyerPhone.includes("05") ? "AIRTEL_MONEY" : "MTN_MOMO",
      });

      if (res.ticket) {
        setGeneratedTicket({
          ...res.ticket,
          instructions: res.instructions,
        });
        loadEvents();
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'achat du billet");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* En-tête : Les boutons d'administration/scan ne s'affichent QUE pour les Organisateurs connectés */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-congo-red/10 border border-congo-red/30 text-xs font-semibold text-congo-red mb-3">
            <Ticket className="w-3.5 h-3.5" />
            <span>Billetterie & Spectacles Congo 🇨🇬</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Concerts, Spectacles & Festivals
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Achetez vos billets sécurisés par MTN MoMo ou Airtel Money. Présentez votre QR Code à l'entrée des salles.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadEvents}
            className="p-2.5 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs flex items-center space-x-1.5"
            title="Rafraîchir les événements"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Grille des événements */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-congo-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Chargement des événements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={evt.banner_image_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80"}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute bottom-3 left-3 px-3 py-1 bg-slate-900/90 border border-congo-yellow/40 backdrop-blur-md rounded-full text-[11px] font-bold text-congo-yellow shadow-md">
                    {parseFloat(evt.ticket_price_fcfa).toLocaleString()} FCFA
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <h2 className="text-lg font-bold text-white leading-snug">{evt.title}</h2>
                  <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-congo-green" />
                      <span>{new Date(evt.event_date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-congo-red" />
                      <span>{evt.venue_name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-800/80 mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {evt.total_capacity - (evt.tickets_sold || 0)} places restantes
                  </span>
                  <button
                    onClick={() => {
                      setSelectedEvent(evt);
                      setGeneratedTicket(null);
                      setError("");
                    }}
                    className="px-4 py-2 bg-congo-green hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
                  >
                    <span>Acheter Billet MoMo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* BOUTON DÉDIÉ ORGANISATEUR : CANAL A (Tirage Papier BCDA) */}
                {isOrganizer && (
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-purple-400 font-semibold flex items-center space-x-1">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Vente Physique / Guichet</span>
                    </span>
                    <Link
                      href="/bcda"
                      className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-800 text-purple-200 rounded-lg text-[10px] font-bold transition flex items-center space-x-1"
                    >
                      <span>Sécuriser Tirage Papier (BCDA) 🏛️</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Achat & Billet QR Code */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            {generatedTicket ? (
              <div className="text-center space-y-6 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white">Billet Électronique Émis !</h3>
                  <p className="text-xs text-slate-400 mt-1">Transaction Mobile Money confirmée.</p>
                </div>

                {/* Billet avec QR Code réel */}
                <div className="bg-slate-950 border border-dashed border-congo-yellow/60 rounded-2xl p-6 text-center relative overflow-hidden shadow-2xl">
                  <div className="w-full pb-3 border-b border-slate-800 text-left">
                    <span className="text-[10px] text-congo-yellow font-bold uppercase tracking-wider">Pass Officiel 🇨🇬</span>
                    <h4 className="text-base font-bold text-white">{generatedTicket.event_title}</h4>
                    <p className="text-[11px] text-slate-400">{generatedTicket.venue}</p>
                    <p className="text-[11px] text-slate-300 font-semibold mt-1">
                      {new Date(generatedTicket.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  {/* QR Code Réel généré par le backend */}
                  <div className="my-4 p-4 bg-white rounded-xl inline-block shadow-lg">
                    <img
                      src={generatedTicket.qr_code_image}
                      alt="Billet QR Code"
                      className="w-44 h-44 object-contain"
                    />
                    <span className="text-[9px] font-mono text-slate-900 block mt-1 font-bold">
                      {generatedTicket.qr_code_hash}
                    </span>
                  </div>

                  <div className="pt-2 text-xs text-slate-300 flex justify-between border-t border-slate-800">
                    <span>Titulaire : <strong>{generatedTicket.buyer_name}</strong></span>
                    <span className="text-congo-yellow font-bold">{generatedTicket.ticket_type}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  {generatedTicket.instructions}
                </p>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTicket.qr_code_hash);
                      alert(`Code hash copié : ${generatedTicket.qr_code_hash}`);
                    }}
                    className="px-4 py-2.5 bg-congo-yellow hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Copier le Code Hash
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBuyTicket} className="space-y-6">
                <div>
                  <span className="text-xs text-congo-red font-bold uppercase tracking-wider">Achat Rapide de Billet</span>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedEvent.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{selectedEvent.venue_name}</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Choix Tarif Standard / VIP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Catégorie de Billet *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setTicketType("STANDARD")}
                      className={`p-4 rounded-xl border cursor-pointer text-left transition ${
                        ticketType === "STANDARD"
                          ? "bg-congo-red/10 border-congo-red text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="block text-xs font-bold">Standard</span>
                      <span className="text-base font-extrabold text-congo-yellow">
                        {parseFloat(selectedEvent.ticket_price_fcfa).toLocaleString()} FCFA
                      </span>
                    </div>

                    <div
                      onClick={() => setTicketType("VIP")}
                      className={`p-4 rounded-xl border cursor-pointer text-left transition ${
                        ticketType === "VIP"
                          ? "bg-congo-red/10 border-congo-red text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="block text-xs font-bold">VIP Privilège</span>
                      <span className="text-base font-extrabold text-congo-yellow">
                        {parseFloat(selectedEvent.vip_ticket_price_fcfa || selectedEvent.ticket_price_fcfa * 2).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Nom & Prénom du Participant *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean-Luc Malonga"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-congo-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Numéro Mobile Money (+242...) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+242 06 XXX XX XX (MTN) ou +242 05... (Airtel)"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-congo-red"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-extrabold text-congo-yellow">
                    {ticketType === "VIP"
                      ? parseFloat(selectedEvent.vip_ticket_price_fcfa || selectedEvent.ticket_price_fcfa * 2).toLocaleString()
                      : parseFloat(selectedEvent.ticket_price_fcfa).toLocaleString()}{" "}
                    FCFA
                  </span>
                  <button
                    type="submit"
                    disabled={isPurchasing}
                    className="px-6 py-3 bg-congo-red hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isPurchasing ? <span>Génération du QR Code en DB...</span> : <span>Payer & Obtenir mon Billet 📲</span>}
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
