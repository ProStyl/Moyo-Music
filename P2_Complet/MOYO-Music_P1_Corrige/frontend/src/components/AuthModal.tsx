"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Lock, Phone, Sparkles, X, CheckCircle, AlertCircle, Music, Palette, Ticket, ShieldCheck, ShieldAlert } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const router = useRouter();
  const { login, register, isError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  
  // Champs formulaire
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("artist");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const ok = await login({ identifier, password });
      if (!ok) {
        setError(isError?.message || "Identifiants incorrects. Vérifiez votre numéro/email et votre mot de passe.");
        return;
      }
      setSuccess("Connexion réussie ! Redirection vers votre Tableau de Bord...");
      setTimeout(() => {
        onClose();
        setSuccess("");
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      // Filet de sécurité : login() ne devrait normalement jamais lever d'exception
      // (elle capture ses propres erreurs et renvoie false), mais on reste défensif.
      setError(err.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const ok = await register({
        full_name: fullName,
        artist_name: artistName || fullName,
        email: email || undefined,
        phone_number: phoneNumber,
        password,
        role,
      });
      if (!ok) {
        setError(isError?.message || "Erreur lors de la création du compte.");
        return;
      }
      setSuccess("Compte créé avec succès !");
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 700);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion rapide en 1 clic selon le rôle
  const quickLoginAs = async (phone: string, pass: string) => {
    setIsLoading(true);
    setError("");
    try {
      const ok = await login({ identifier: phone, password: pass });
      if (!ok) {
        setError(isError?.message || "Impossible de se connecter avec ce compte de démonstration.");
        return;
      }
      setSuccess("Connexion réussie !");
      setTimeout(() => {
        onClose();
        setSuccess("");
        router.push("/dashboard");
      }, 400);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-congo-green via-congo-yellow to-congo-red rounded-2xl p-0.5 mx-auto mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-congo-yellow" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === "login" ? "Espace Créateur, BCDA & Gestion des Rôles" : "Créer un Compte d'Artiste / Promoteur"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chaque rôle dispose d'un espace de travail personnalisé et sécurisé 🇨🇬
          </p>
        </div>

        {/* 5 COMPTES DÉMO CLÉ EN MAIN POUR LES TESTS RBAC
            N'apparaît que si NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true est explicitement
            défini (à activer uniquement en dev/démo, jamais en production) pour éviter
            d'exposer des identifiants réels dans le bundle JS livré au navigateur. */}
        {mode === "login" && process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === "true" && 
          <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>🚀 Test Rapide des 5 Rôles (1 Clic) :</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Artiste Musicien */}
              <button
                type="button"
                onClick={() => quickLoginAs("+242068001122", "Congo2026!")}
                disabled={isLoading}
                className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900/60 rounded-xl text-left transition flex items-center space-x-2.5"
              >
                <Music className="w-4 h-4 text-congo-green flex-shrink-0" />
                <div className="truncate">
                  <strong className="text-white block truncate">Prince Nzassi</strong>
                  <span className="text-[10px] text-emerald-400">Artiste Musicien</span>
                </div>
              </button>

              {/* Agent BCDA */}
              <button
                type="button"
                onClick={() => quickLoginAs("+242065554433", "Congo2026!")}
                disabled={isLoading}
                className="p-2.5 bg-amber-950/60 border border-amber-800/80 hover:bg-amber-900/60 rounded-xl text-left transition flex items-center space-x-2.5"
              >
                <ShieldCheck className="w-4 h-4 text-congo-yellow flex-shrink-0" />
                <div className="truncate">
                  <strong className="text-white block truncate">Inspecteur BCDA</strong>
                  <span className="text-[10px] text-congo-yellow">Contrôle & Répartition</span>
                </div>
              </button>

              {/* Organisateur Concerts */}
              <button
                type="button"
                onClick={() => quickLoginAs("+242069998877", "Congo2026!")}
                disabled={isLoading}
                className="p-2.5 bg-red-950/60 border border-red-800/80 hover:bg-red-900/60 rounded-xl text-left transition flex items-center space-x-2.5"
              >
                <Ticket className="w-4 h-4 text-congo-red flex-shrink-0" />
                <div className="truncate">
                  <strong className="text-white block truncate">Brazza Live Prod</strong>
                  <span className="text-[10px] text-red-400">Organisateur Spectacles</span>
                </div>
              </button>

              {/* Peintre Poto-Poto */}
              <button
                type="button"
                onClick={() => quickLoginAs("+242055003344", "Congo2026!")}
                disabled={isLoading}
                className="p-2.5 bg-sky-950/60 border border-sky-800/80 hover:bg-sky-900/60 rounded-xl text-left transition flex items-center space-x-2.5"
              >
                <Palette className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <div className="truncate">
                  <strong className="text-white block truncate">Maître Mouanga</strong>
                  <span className="text-[10px] text-sky-400">Peintre (Poto-Poto)</span>
                </div>
              </button>

              {/* Admin Plateforme */}
              <button
                type="button"
                onClick={() => quickLoginAs("+242060000000", "Congo2026!")}
                disabled={isLoading}
                className="sm:col-span-2 p-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl text-left transition flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <strong className="text-white text-xs">Administrateur Général Moyo</strong>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">Superviseur</span>
              </button>
            </div>
          </div>
        }

        {/* Alertes d'état */}
        {error && 
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        }
        {success && 
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        }

        {/* Formulaire manuel */}
        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4 text-xs">
          {mode === "register" && 
            <>
              <div>
                <label className="text-slate-400 block mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prince Nzassi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-yellow"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Nom d'Artiste / Scène (optionnel)</label>
                <input
                  type="text"
                  placeholder="Si différent de votre nom complet"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-yellow"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Votre Rôle / Métier *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-yellow"
                >
                  <option value="artist">Artiste Musicien / Compositeur / Réalisateur</option>
                  <option value="painter">Artiste Peintre / Sculpteur (École de Poto-Poto)</option>
                  <option value="organizer">Organisateur d'Événements & Billetterie</option>
                  <option value="bcda_agent">Agent / Inspecteur BCDA</option>
                  <option value="fan">Mélomane / Public / Acheteur</option>
                </select>
              </div>
            </>
          }

          <div>
            <label className="text-slate-400 block mb-1">
              {mode === "login" ? "Numéro de Téléphone (MoMo / Airtel) ou Email *" : "Numéro de Téléphone (MoMo / Airtel) *"}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={mode === "login" ? "+242068001122 ou prince@moyo.cg" : "+242068001122"}
                value={mode === "login" ? identifier : phoneNumber}
                onChange={(e) => (mode === "login" ? setIdentifier(e.target.value) : setPhoneNumber(e.target.value))}
                className="w-full px-3 py-2.5 pl-9 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-yellow"
              />
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {mode === "register" && 
            <div>
              <label className="text-slate-400 block mb-1">Email (optionnel, pour la récupération de compte)</label>
              <input
                type="email"
                placeholder="prince@moyo.cg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-yellow"
              />
            </div>
          }

          <div>
            <label className="text-slate-400 block mb-1">Mot de passe *</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pl-9 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-congo-yellow"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-congo-yellow to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition shadow-xl hover:opacity-95 disabled:opacity-50"
          >
            {isLoading ? "Vérification..." : mode === "login" ? "Se Connecter" : "Créer mon Compte"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
          {mode === "login" ? 
            <p>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-congo-yellow font-bold hover:underline"
              >
                Inscrivez-vous ici
              </button>
            </p>
           : 
            <p>
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-congo-yellow font-bold hover:underline"
              >
                Connectez-vous
              </button>
            </p>
          }
        </div>

      </div>
    </div>
  );
}
