"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ArrowRight,
  Check,
  Building2,
  DollarSign,
  Clock,
  X
} from "lucide-react";
import { walletApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/AuthModal";

export default function WalletPage() {
  const { user, refreshProfile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tunnel de retrait par étapes
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [operator, setOperator] = useState<"MTN" | "AIRTEL">("MTN");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadWalletData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await walletApi.getSummary();
      setBalance(parseFloat(res.balance_fcfa || "0"));
      setTransactions(res.recent_transactions || []);
      if (res.momo_number) setWithdrawPhone(res.momo_number);
      else if (user.phone_number) setWithdrawPhone(user.phone_number);
    } catch (err: any) {
      console.error("Erreur chargement portefeuille :", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWalletData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 2000) {
      setErrorMessage("Le montant minimum de retrait est de 2 000 FCFA.");
      return;
    }
    if (amount > balance) {
      setErrorMessage(`Solde insuffisant. Vous disposez de ${balance.toLocaleString()} FCFA.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await walletApi.withdraw({
        amount_fcfa: amount,
        phone_number: withdrawPhone || user?.phone_number || "+242060000000",
        operator,
        idempotency_key: crypto.randomUUID(),
      });

      setSuccessMessage(res.message);
      setBalance(res.new_balance_fcfa);
      setWithdrawStep(3); // Écran de confirmation de virement
      refreshProfile();
      loadWalletData();
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors du retrait Mobile Money");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Espace Portefeuille & Royalties</h1>
        <p className="text-xs text-slate-400">
          Veuillez vous connecter à votre compte artiste pour consulter votre solde réel, vos royalties de streaming et initier des retraits Mobile Money.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-6 py-3 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-lg"
        >
          Se Connecter à mon Compte
        </button>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* 1. EN-TÊTE DU PORTEFEUILLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-xs font-semibold text-congo-green mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Portefeuille Sécurisé • Direct MTN MoMo & Airtel Money 🇨🇬</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Mon Portefeuille & Retraits Express
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Titulaire : <strong className="text-white">{user.artist_name || user.full_name}</strong> • Compte vérifié
          </p>
        </div>

        <button
          onClick={loadWalletData}
          className="p-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs flex items-center space-x-2"
          title="Actualiser le solde"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-congo-yellow" : ""}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* 2. CARTE SOLDE PRINCIPAL AVEC GROS BOUTON DE RETRAIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Carte de Solde */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-800/60 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Solde Disponible</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">
              {balance.toLocaleString()} <span className="text-lg text-congo-yellow font-bold">FCFA</span>
            </p>
            <span className="text-[11px] text-slate-400 block font-mono">
              ≈ {(balance / 655.957).toFixed(2)} €
            </span>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={() => {
                setErrorMessage("");
                setSuccessMessage("");
                setWithdrawStep(1);
                setIsWithdrawOpen(true);
              }}
              className="w-full py-4 bg-congo-green hover:bg-emerald-600 text-white font-black rounded-2xl text-xs shadow-xl transition flex items-center justify-center space-x-2 group"
            >
              <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Demander un Retrait Mobile Money 💸</span>
            </button>

            <p className="text-[10px] text-slate-500 text-center">
              Virement instantané 24h/24 sans frais intermédiaires.
            </p>
          </div>
        </div>

        {/* Historique des Transactions */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-congo-yellow" />
              <span>Historique Récent des Mouvements</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">PostgreSQL Ledger</span>
          </div>

          {transactions.length > 0 ? 
            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              {transactions.map((tx, idx) => 
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      tx.type === "PAYOUT" || tx.type === "WITHDRAWAL" ? "bg-red-950/60 text-congo-red" : "bg-emerald-950/60 text-emerald-400"
                    }`}>
                      {tx.type === "PAYOUT" || tx.type === "WITHDRAWAL" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">{tx.description || tx.type}</strong>
                      <span className="text-[10px] text-slate-500">{new Date(tx.created_at || Date.now()).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>

                  <strong className={`font-mono text-sm ${
                    tx.type === "PAYOUT" || tx.type === "WITHDRAWAL" ? "text-red-400" : "text-emerald-400"
                  }`}>
                    {tx.type === "PAYOUT" || tx.type === "WITHDRAWAL" ? "-" : "+"}{parseFloat(tx.amount_fcfa || 0).toLocaleString()} FCFA
                  </strong>
                </div>
              )}
            </div>
           : 
            <div className="py-12 text-center text-slate-500 text-xs">
              Aucune transaction récente enregistrée sur votre compte.
            </div>
          }
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MODALE / TUNNEL DE RETRAIT ÉTAPE PAR ÉTAPE */}
      {/* ========================================================================= */}
      {isWithdrawOpen && 
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsWithdrawOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ÉTAPE 1 : CHOIX DE L'OPÉRATEUR */}
            {withdrawStep === 1 && 
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-congo-yellow/10 text-congo-yellow text-[10px] font-bold uppercase mb-2">
                    <span>Étape 1 sur 3</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Sélectionnez votre Opérateur Mobile</h3>
                  <p className="text-xs text-slate-400 mt-1">Où souhaitez-vous recevoir vos fonds ?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setOperator("MTN")}
                    className={`p-5 rounded-2xl border text-center transition space-y-2 ${
                      operator === "MTN"
                        ? "bg-yellow-950/30 border-yellow-400 text-white shadow-lg"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center mx-auto font-black text-base">
                      MTN
                    </div>
                    <strong className="text-xs font-bold block text-white">MTN MoMo</strong>
                    <span className="text-[10px] text-slate-400 block">Préfixes 06...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperator("AIRTEL")}
                    className={`p-5 rounded-2xl border text-center transition space-y-2 ${
                      operator === "AIRTEL"
                        ? "bg-red-950/30 border-red-500 text-white shadow-lg"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto font-black text-base">
                      airtel
                    </div>
                    <strong className="text-xs font-bold block text-white">Airtel Money</strong>
                    <span className="text-[10px] text-slate-400 block">Préfixes 04 / 05...</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setWithdrawStep(2)}
                  className="w-full py-3.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg"
                >
                  <span>Continuer vers le Montant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            }

            {/* ÉTAPE 2 : NUMÉRO & MONTANT */}
            {withdrawStep === 2 && 
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-congo-yellow/10 text-congo-yellow text-[10px] font-bold uppercase mb-2">
                    <span>Étape 2 sur 3</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Montant & Numéro de Réception</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Opérateur choisi : <strong className="text-congo-yellow">{operator === "MTN" ? "MTN Mobile Money" : "Airtel Money"}</strong>
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Numéro Mobile Money *</label>
                    <input
                      type="tel"
                      required
                      placeholder={operator === "MTN" ? "06XXXXXXXX" : "05XXXXXXXX"}
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-400">Montant à Retirer (FCFA) *</label>
                      <span className="text-[10px] text-emerald-400 font-mono">Max: {balance.toLocaleString()} FCFA</span>
                    </div>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 50000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-black text-lg"
                    />
                  </div>

                  {/* Boutons Rapides */}
                  <div className="flex gap-2">
                    {[10000, 25000, 50000, balance].map((val, idx) => 
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setWithdrawAmount(val.toString())}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono hover:border-congo-yellow"
                      >
                        {val === balance ? "Tout retirer" : `${val / 1000}k`}
                      </button>
                    )}
                  </div>
                </div>

                {errorMessage && 
                  <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs">
                    {errorMessage}
                  </div>
                }

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawStep(1)}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 2000}
                    onClick={handleWithdrawSubmit}
                    className="flex-1 py-3 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xl transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? 
                      <span>Virement MoMo en cours...</span>
                     : 
                      <span>Confirmer le Virement ({parseFloat(withdrawAmount || "0").toLocaleString()} FCFA) 🚀</span>
                    }
                  </button>
                </div>
              </div>
            }

            {/* ÉTAPE 3 : CONFIRMATION & REÇU */}
            {withdrawStep === 3 && 
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Virement Effectué !</h3>
                  <p className="text-xs text-slate-400 mt-1">{successMessage}</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bénéficiaire :</span>
                    <strong className="text-white">{withdrawPhone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opérateur :</span>
                    <strong className="text-congo-yellow">{operator}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nouveau Solde :</span>
                    <strong className="text-emerald-400">{balance.toLocaleString()} FCFA</strong>
                  </div>
                </div>

                <button
                  onClick={() => setIsWithdrawOpen(false)}
                  className="w-full py-3.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs"
                >
                  Fermer
                </button>
              </div>
            }

          </div>
        </div>
      }

    </div>
  );
}
