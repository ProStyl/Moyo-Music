"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Ticket, 
  Disc3, 
  LogIn,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (user) {
    return (
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Congo Art & Music */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-congo-green via-congo-yellow to-congo-red flex items-center justify-center p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Disc3 className="w-6 h-6 text-congo-yellow" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-congo-yellow via-white to-congo-green bg-clip-text text-transparent">
                  MOYO CULTURE
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                  Congo-Brazzaville 🇨🇬
                </span>
              </div>
            </Link>

            {/* Profil utilisateur connecté */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-medium text-white">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span>{user.artist_name || user.full_name}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4 text-congo-red" />
              </button>
            </div>

            {/* Navigation Principale Publique (toujours visible) */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Accueil
              </Link>

              <Link
                href="/billetterie"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <Ticket className="w-4 h-4 text-congo-red" />
                <span>Concerts & Billetterie</span>
              </Link>

              <Link
                href="/repertoire-public"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-congo-yellow hover:text-amber-300 hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-congo-yellow" />
                <span>Répertoire Public BCDA 🏛️</span>
              </Link>
            </div>

            {/* Bouton Mobile */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Menu Mobile */}
        {isOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-900"
            >
              Accueil
            </Link>
            <Link
              href="/billetterie"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-900"
            >
              Concerts & Billetterie
            </Link>
            <Link
              href="/repertoire-public"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-congo-yellow hover:bg-slate-900"
            >
              Répertoire Public BCDA 🏛️
            </Link>

            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full py-2.5 bg-congo-red/90 text-white rounded-xl text-xs font-bold mt-2"
            >
              Déconnexion
            </button>
          </div>
        )}
      </nav>
    );
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Congo Art & Music */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-congo-green via-congo-yellow to-congo-red flex items-center justify-center p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Disc3 className="w-6 h-6 text-congo-yellow" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-congo-yellow via-white to-congo-green bg-clip-text text-transparent">
                  MOYO CULTURE
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                  Congo-Brazzaville 🇨🇬
                </span>
              </div>
            </Link>

            {/* Navigation Principale Publique */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Accueil
              </Link>

              <Link
                href="/billetterie"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <Ticket className="w-4 h-4 text-congo-red" />
                <span>Concerts & Billetterie</span>
              </Link>

              <Link
                href="/repertoire-public"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-congo-yellow hover:text-amber-300 hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-congo-yellow" />
                <span>Répertoire Public BCDA 🏛️</span>
              </Link>
            </div>

            {/* Bouton Connexion & Theme Switcher */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title={theme === "dark" ? "Mode Clair Institutionnel 🇨🇬" : "Mode Sombre Studio 🌙"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-congo-yellow" /> : <Moon className="w-4 h-4 text-congo-green" />}
              </button>

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white hover:bg-slate-800 transition shadow-md"
              >
                <LogIn className="w-4 h-4 text-congo-yellow" />
                <span>Espace Artiste / Connexion</span>
              </button>
            </div>

            {/* Bouton Mobile */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Menu Mobile */}
        {isOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-900"
            >
              Accueil
            </Link>
            <Link
              href="/billetterie"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-900"
            >
              Concerts & Billetterie
            </Link>
            <Link
              href="/repertoire-public"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-congo-yellow hover:bg-slate-900"
            >
              Répertoire Public BCDA 🏛️
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="w-full py-2.5 bg-congo-yellow text-slate-950 rounded-xl text-xs font-bold mt-2"
            >
              Se Connecter
            </button>
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
