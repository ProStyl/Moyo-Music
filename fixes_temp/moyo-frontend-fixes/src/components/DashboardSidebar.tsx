"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Music, 
  Radio, 
  ShieldCheck, 
  Wallet, 
  Ticket, 
  PlusCircle, 
  Palette, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard,
  Globe,
  Disc3,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Building2,
  Tv,
  Coins,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    music: true,
    live: true,
    finance: true,
    help: false
  });

  if (!user) return null;

  const role = user.role; // 'artist', 'painter', 'organizer', 'bcda_agent', 'admin', 'fan'

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getRoleBadge = () => {
    switch (role) {
      case "artist":
        return { label: "Artiste & Auteur", color: "bg-emerald-950/80 text-emerald-400 border-emerald-800" };
      case "organizer":
        return { label: "Promoteur Événements", color: "bg-rose-950/80 text-rose-400 border-rose-800" };
      case "painter":
        return { label: "Maître Peintre", color: "bg-sky-950/80 text-sky-400 border-sky-800" };
      case "bcda_agent":
        return { label: "Inspecteur BCDA", color: "bg-amber-950/80 text-congo-yellow border-amber-800" };
      case "admin":
        return { label: "Administrateur", color: "bg-purple-950/80 text-purple-400 border-purple-800" };
      default:
        return { label: "Mélomane", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const badge = getRoleBadge();

  return (
    <>
      {/* Déclencheur mobile : doit rester EN DEHORS de l'<aside>, sinon il est
          piégé dans le panneau qu'il est censé ouvrir et devient inatteignable. */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-congo-yellow shadow-lg"
        title="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Fond semi-transparent sur mobile quand le panneau est ouvert */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
        />
      )}

      <aside
        className={`flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-300 h-screen z-50 ${
          isCollapsed ? "w-20" : "w-64"
        } ${isMobileOpen ? "flex fixed inset-y-0 left-0" : "hidden"} lg:flex lg:sticky lg:top-0`}
      >
        {/* 1. LOGO PRINCIPAL MOYO CULTURE */}
        <div className={`p-4 border-b border-slate-800 flex ${isCollapsed ? "flex-col items-center gap-3" : "items-center justify-between"}`}>
          <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-congo-green via-congo-yellow to-congo-red flex items-center justify-center p-0.5 shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-congo-yellow" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-sm font-black tracking-tight bg-gradient-to-r from-congo-yellow via-white to-congo-green bg-clip-text text-transparent block">
                  MOYO CULTURE
                </span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase block">
                  Workspace Artiste 🇨🇬
                </span>
              </div>
            )}
          </Link>

          {/* Bouton replier/déplier - uniquement pertinent en desktop (lg+) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex-shrink-0 ${isCollapsed ? "w-8 h-8 items-center justify-center" : ""}`}
            title={isCollapsed ? "Déplier le menu" : "Replier le menu"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Bouton de fermeture mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* 2. PROFIL ACTIF */}
      <div className="p-3.5 bg-slate-900/40 border-b border-slate-800/80">
        {!isCollapsed ? (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <strong className="text-white text-xs font-bold truncate block">
                {user.artist_name || user.full_name}
              </strong>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title={user.artist_name || user.full_name}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
        )}
      </div>

      {/* 3. NAVIGATION STRUCTURÉE ET CLAIRE */}
      <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
        
        {/* VUE D'ENSEMBLE */}
        <Link
          href="/dashboard"
          className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
            pathname === "/dashboard"
              ? "bg-congo-yellow text-slate-950 shadow-md font-black"
              : "text-slate-300 hover:text-white hover:bg-slate-900"
          } ${isCollapsed ? "justify-center px-2" : ""}`}
          title="Tableau de Bord Général"
        >
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Vue d'Ensemble</span>}
        </Link>

        {/* PILLIER 1 : MUSIQUE, ÉDITION & DROITS (360°) */}
        {(role === "artist" || role === "admin" || role === "bcda_agent") && (
          <div className="space-y-1">
            {!isCollapsed && (
              <button
                onClick={() => toggleSection("music")}
                className="w-full flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 tracking-wider px-2 py-1"
              >
                <span>🎵 Musique & Droits (360°)</span>
                {openSections.music ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {(openSections.music || isCollapsed) && (
              <div className="space-y-1">
                {/* Distribution DSPs */}
                <Link
                  href="/distribution"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname.startsWith("/distribution") ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-900"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                  title="Distribution Spotify, Apple, Boomplay (DDEX)"
                >
                  <Music className="w-4 h-4 flex-shrink-0 text-congo-green" />
                  {!isCollapsed && <span>Distribution DSPs</span>}
                </Link>

                {/* Droit d'Auteur BCDA */}
                <Link
                  href="/bcda"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === "/bcda" || pathname === "/bcda/deposer" ? "bg-amber-950 text-congo-yellow border border-amber-800/60 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-900"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                  title="Droit d'Auteur, Dépôt d'Œuvres & Import DistroKid"
                >
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-congo-yellow" />
                  {!isCollapsed && <span>Droit d'Auteur & BCDA</span>}
                </Link>

                {/* Airplay Monitoring IA */}
                <Link
                  href="/monitoring"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === "/monitoring" ? "bg-sky-950 text-sky-400 border border-sky-800/60 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-900"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                  title="Détections en Direct Radios & TV Congo"
                >
                  <Radio className="w-4 h-4 flex-shrink-0 text-sky-400" />
                  {!isCollapsed && <span>Airplay Radios & TV</span>}
                </Link>

                {/* Services 360° */}
                <Link
                  href="/services-360"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === "/services-360" ? "bg-purple-950 text-purple-300 border border-purple-800/60 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-900"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                  title="Services & Packs 360° (Clips, Mastering, Presse)"
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0 text-purple-400" />
                  {!isCollapsed && <span>Services 360° Artiste</span>}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* PILLIER 2 : SPECTACLES & ARTS VISUELS */}
        {(role === "artist" || role === "organizer" || role === "painter" || role === "admin") && (
          <div className="space-y-1">
            {!isCollapsed && (
              <button
                onClick={() => toggleSection("live")}
                className="w-full flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 tracking-wider px-2 py-1"
              >
                <span>🎟️ Spectacles & Arts</span>
                {openSections.live ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {(openSections.live || isCollapsed) && (
              <div className="space-y-1">
                {(role === "artist" || role === "organizer" || role === "admin") && (
                  <Link
                    href="/billetterie/mes-evenements"
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      pathname.startsWith("/billetterie") ? "bg-rose-950 text-congo-red border border-rose-800/60 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-900"
                    } ${isCollapsed ? "justify-center px-2" : ""}`}
                    title="Mes Concerts & Billetterie QR Code"
                  >
                    <Ticket className="w-4 h-4 flex-shrink-0 text-congo-red" />
                    {!isCollapsed && <span>Mes Concerts & Billets</span>}
                  </Link>
                )}

                {(role === "painter" || role === "admin") && (
                  <Link
                    href="/galerie"
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      pathname.startsWith("/galerie") ? "bg-sky-950 text-sky-400 border border-sky-800/60 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-900"
                    } ${isCollapsed ? "justify-center px-2" : ""}`}
                    title="Galerie d'Art Poto-Poto"
                  >
                    <Palette className="w-4 h-4 flex-shrink-0 text-sky-400" />
                    {!isCollapsed && <span>Galerie d'Art Poto-Poto</span>}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* PILLIER 3 : FINANCES & PORTEFEUILLE */}
        <div className="space-y-1">
          <Link
            href="/dashboard"
            onClick={(e) => {
              // Raccourci vers le wallet sur le dashboard
            }}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition ${isCollapsed ? "justify-center px-2" : ""}`}
            title="Mon Portefeuille Mobile Money"
          >
            <Wallet className="w-4 h-4 flex-shrink-0 text-congo-yellow" />
            {!isCollapsed && <span>Portefeuille MoMo</span>}
          </Link>
        </div>

        {/* PILLIER 4 : GUIDE & RESSOURCES */}
        <div className="space-y-1">
          <Link
            href="/bcda/guide"
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              pathname === "/bcda/guide" ? "bg-amber-950 text-congo-yellow border border-amber-800/60 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-900"
            } ${isCollapsed ? "justify-center px-2" : ""}`}
            title="Guide Droit d'Auteur & FAQ"
          >
            <FileText className="w-4 h-4 flex-shrink-0 text-congo-yellow" />
            {!isCollapsed && <span>Guide & FAQ Droit d'Auteur</span>}
          </Link>
        </div>

      </div>

      {/* 4. BAS DE BARRE : DÉCONNEXION */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition ${
            isCollapsed ? "justify-center px-2" : ""
          }`}
          title="Se Déconnecter"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>

      </aside>
    </>
  );
}
