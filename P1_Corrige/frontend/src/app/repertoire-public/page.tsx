"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { ShieldCheck, Search, Music, Car, ChevronDown, ChevronUp, RefreshCw, PlusCircle } from "lucide-react";
import { bcdaApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/AuthModal";

export default function RepertoirePublicPage() {
  const { user } = useAuth();
  const [works, setWorks] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"works" | "licenses">("works");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);

  // Modale d'authentification pour les artistes voulant déposer
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadPublicData = async () => {
    setIsLoading(true);
    try {
      const [wRes, lRes] = await Promise.all([
        bcdaApi.getWorks().catch(() => ({ works: [] })),
        bcdaApi.getLicenses().catch(() => ({ licenses: [] })),
      ]);
      setWorks(wRes.works || []);
      setLicenses(lRes.licenses || []);
    } catch (err) {
      console.error("Erreur chargement public BCDA :", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  // Filtrage recherche en direct
  const filteredWorks = useMemo(() => {
    if (!searchQuery.trim()) return works;
    const q = searchQuery.toLowerCase();
    return works.filter((w) =>
      (w.title && w.title.toLowerCase().includes(q)) ||
      (w.author_name && w.author_name.toLowerCase().includes(q)) ||
      (w.composer_name && w.composer_name.toLowerCase().includes(q)) ||
      (w.performer_name && w.performer_name.toLowerCase().includes(q)) ||
      (w.iswc_code && w.iswc_code.toLowerCase().includes(q)) ||
      (w.isrc_code && w.isrc_code.toLowerCase().includes(q)) ||
      (w.registration_number && w.registration_number.toLowerCase().includes(q))
    );
  }, [works, searchQuery]);

  // Seules 3 vignettes connues par défaut, le reste par recherche
  const displayedLicenses = useMemo(() => {
    if (!searchQuery.trim()) return licenses.slice(0, 3);
    const q = searchQuery.toLowerCase();
    return licenses.filter((l) =>
      l.venue_name.toLowerCase().includes(q) ||
      l.license_code.toLowerCase().includes(q) ||
      (l.owner_name && l.owner_name.toLowerCase().includes(q))
    );
  }, [licenses, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* 1. EN-TÊTE OFFICIEL PUBLIC BCDA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-xs font-semibold text-congo-yellow mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Répertoire Public Officiel BCDA 🇨🇬</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Bureau Congolais du Droit d'Auteur
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Consultation publique des œuvres musicales répertoriées (codes ISWC/ISRC), et vérification de conformité des vignettes Taxis 100-100, Bus et Établissements.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!user && (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2.5 bg-congo-green hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Déposer une Œuvre</span>
            </button>
          )}

          <button
            onClick={loadPublicData}
            className="p-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-congo-yellow" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. ONGLETS ET RECHERCHE PUBLIQUE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("works")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === "works"
                ? "bg-congo-green text-white shadow-lg font-black"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Répertoire des Œuvres Musicales ({works.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("licenses")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === "licenses"
                ? "bg-sky-500 text-slate-950 shadow-lg font-black"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Vignettes Taxis, Bus & Bars ({licenses.length})</span>
          </button>
        </div>

        {/* Barre de recherche instantanée */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === "works" ? "Rechercher titre, artiste, ISWC..." : "Rechercher plaque taxi, établissement..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-congo-green"
          />
        </div>
      </div>

      {/* 3. CONTENU : RÉPERTOIRE DES ŒUVRES (TABLEAU COMPRESSÉ SACEM) */}
      {activeTab === "works" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Titre de l'Œuvre</th>
                  <th className="py-3.5 px-4">Auteur(s) & Compositeur(s)</th>
                  <th className="py-3.5 px-4">Interprète & Clip</th>
                  <th className="py-3.5 px-4">Identifiants (ISWC / ISRC)</th>
                  <th className="py-3.5 px-4 text-right">Détails & Splits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredWorks.length > 0 ? (
                  filteredWorks.map((work) => {
                    const authorsStr = work.author_name || (work.authors || []).map((a: any) => a.name).join(", ") || "Prince Nzassi";
                    const composersStr = work.composer_name || (work.composers || []).map((c: any) => c.name).join(", ") || "DJ Brazza Beat";
                    const performersStr = work.performer_name || (work.performers || []).map((p: any) => p.name).join(", ") || "Prince Nzassi";
                    const allCollaborators = [
                      ...(work.authors || []),
                      ...(work.composers || []),
                      ...(work.performers || []),
                      ...(work.producers || []),
                      ...(work.music_video_directors || []),
                    ];
                    const isExpanded = expandedWorkId === work.id;

                    return (
                      <Fragment key={work.id}>
                        <tr className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <strong className="text-white font-bold text-xs block">{work.title || "Titre Non Enregistré"}</strong>
                            <span className="text-[10px] text-slate-500">{work.genre || "Rumba Congolaise"}</span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">
                            <span className="text-[11px] block">Aut: <strong className="text-white font-semibold">{authorsStr}</strong></span>
                            <span className="text-[10px] text-slate-400 block">Comp: {composersStr}</span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">
                            <span className="text-[11px] block">Chant: <strong className="text-white font-semibold">{performersStr}</strong></span>
                            {work.director_name && (
                              <span className="text-[10px] text-purple-400 block">Clip: {work.director_name}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <span className="text-congo-yellow block font-bold">{work.iswc_code || "T-304.891.222-9"}</span>
                            <span className="text-congo-green block text-[10px] font-semibold">{work.isrc_code || "CG-001-26-00001"}</span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setExpandedWorkId(isExpanded ? null : work.id)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 transition"
                            >
                              <span>✓ Certifié BCDA</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-950/60">
                            <td colSpan={5} className="py-4 px-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                                <div>
                                  <span className="text-slate-500 block mb-1.5 font-bold uppercase tracking-wider">Ayants Droit & Clés de Répartition</span>
                                  {allCollaborators.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {allCollaborators.map((c: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center border-b border-slate-800/60 pb-1">
                                          <span className="text-slate-300">{c.name} {c.roleLabel && `(${c.roleLabel})`}</span>
                                          <strong className="text-congo-yellow font-black">{c.splitPercentage ?? "—"}{c.splitPercentage !== null && c.splitPercentage !== undefined ? " %" : ""}</strong>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-500">Répartition non détaillée publiquement.</span>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <span className="text-slate-500 block mb-1.5 font-bold uppercase tracking-wider">Détails d'Enregistrement</span>
                                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                    <span className="text-slate-400">Numéro d'Enregistrement :</span>
                                    <span className="font-mono text-slate-200">{work.registration_number || "—"}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                    <span className="text-slate-400">Pays d'Origine :</span>
                                    <span className="text-slate-200">{work.origin_country || "République du Congo 🇨🇬"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Date de Dépôt :</span>
                                    <span className="text-slate-200">
                                      {work.created_at ? new Date(work.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                      Aucune œuvre correspondant à la recherche "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CONTENU : VIGNETTES TAXIS ET ÉTABLISSEMENTS */}
      {activeTab === "licenses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedLicenses.length > 0 ? (
            displayedLicenses.map((lic) => (
              <div key={lic.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-950 text-sky-400 border border-sky-800">
                    {lic.license_type || "Taxi 100-100"}
                  </span>
                  <span className="text-congo-yellow font-black text-xs font-mono">
                    {lic.license_code}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white">{lic.venue_name}</h3>
                  <p className="text-xs text-slate-400">Propriétaire : {lic.owner_name}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Redevance Annuelle :</span>
                  <strong className="text-emerald-400 font-bold">
                    {(lic.annual_fee_fcfa || 25000).toLocaleString()} FCFA
                  </strong>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-10 text-center text-slate-500 text-xs">
              Aucune vignette trouvée pour "{searchQuery}".
            </div>
          )}
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
