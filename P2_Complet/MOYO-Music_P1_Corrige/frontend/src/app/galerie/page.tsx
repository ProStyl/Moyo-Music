"use client";

import { useState } from "react";
import { Image as ImageIcon, ShieldCheck, Search, CheckCircle, Tag, Globe, Sparkles } from "lucide-react";

export default function GaleriePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [certInput, setCertInput] = useState("");
  const [certResult, setCertResult] = useState<any>(null);

  const artworks = [
    {
      id: "art-1",
      title: "Danse des Masques du Chaillu",
      artist: "Maître Michel Mouanga",
      category: "poto-poto",
      medium: "Acrylique sur toile de lin (Style Mika)",
      dimensions: "100 x 120 cm",
      year: 2026,
      priceFcfa: 350000,
      priceEur: 535,
      certNumber: "CERT-EPP-2026-089",
      image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80",
      desc: "Tableau emblématique de l'École de Peinture de Poto-Poto (EPP) représentant les esprits protecteurs et les danses sacrées du massif du Chaillu."
    },
    {
      id: "art-2",
      title: "Les Sapeurs de Bacongo au Crépuscule",
      artist: "Dieudonné Loubaki",
      category: "contemporary",
      medium: "Huile et collages textiles wax",
      dimensions: "90 x 90 cm",
      year: 2026,
      priceFcfa: 280000,
      priceEur: 425,
      certNumber: "CERT-EPP-2026-090",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
      desc: "Célébration vibrante de la SAPE congolaise, alliant élégance vestimentaire, couleurs vives et silhouettes majestueuses au cœur de Bacongo."
    },
    {
      id: "art-3",
      title: "Maternité Protectrice du Kouilou",
      artist: "Sculpteur Jean-Paul Tchicaya",
      category: "sculpture",
      medium: "Bois d'ébène ciré et cuivre martelé",
      dimensions: "65 cm (Hauteur)",
      year: 2025,
      priceFcfa: 190000,
      priceEur: 290,
      certNumber: "CERT-EPP-2025-142",
      image: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80",
      desc: "Sculpture traditionnelle Vili représentant la transmission intergénérationnelle et la puissance de la femme congolaise."
    }
  ];

  const filteredArtworks = activeCategory === "all"
    ? artworks
    : artworks.filter((a) => a.category === activeCategory);

  const handleVerifyCert = (e: React.FormEvent) => {
    e.preventDefault();
    const found = artworks.find(a => a.certNumber.toLowerCase() === certInput.trim().toLowerCase());
    if (found) {
      setCertResult({
        valid: true,
        artwork: found
      });
    } else {
      setCertResult({
        valid: false,
        message: "Certificat non trouvé dans le registre officiel des arts du Congo."
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* En-tête */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-semibold text-sky-400 mb-4">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>École de Peinture de Poto-Poto & Artistes Congolais</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Galerie d'Art Virtuelle & Marketplace
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-300">
          Acquérez des œuvres originales d'artistes congolais. Chaque tableau ou sculpture est certifié par un identifiant d'authenticité infalsifiable.
        </p>
      </div>

      {/* Barre de Vérification de Certificat */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-congo-green" />
          <div>
            <h2 className="text-sm font-bold text-white">Registre Officiel des Certificats d'Authenticité</h2>
            <p className="text-xs text-slate-400">Vérifiez l'origine d'un tableau avant achat</p>
          </div>
        </div>

        <form onSubmit={handleVerifyCert} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Ex: CERT-EPP-2026-089"
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            className="flex-grow px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Vérifier
          </button>
        </form>

        {certResult && (
          <div className="mt-4 p-4 rounded-xl border text-xs bg-slate-950 border-slate-800">
            {certResult.valid ? (
              <div className="space-y-1 text-emerald-400">
                <p className="font-bold flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Œuvre Authentifiée : {certResult.artwork.title}</span>
                </p>
                <p className="text-slate-300">Artiste : <strong>{certResult.artwork.artist}</strong> ({certResult.artwork.year})</p>
                <p className="text-slate-400">Support : {certResult.artwork.medium}</p>
              </div>
            ) : (
              <p className="text-red-400 font-medium">{certResult.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Filtres de catégorie */}
      <div className="flex justify-center gap-2 flex-wrap">
        {[
          { id: "all", label: "Toutes les œuvres" },
          { id: "poto-poto", label: "École de Poto-Poto" },
          { id: "contemporary", label: "Art Contemporain & Sape" },
          { id: "sculpture", label: "Sculptures & Artisanat" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeCategory === cat.id
                ? "bg-congo-yellow text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grille des Œuvres d'Art */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredArtworks.map((art) => (
          <div
            key={art.id}
            className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-sky-500/50 transition flex flex-col justify-between group"
          >
            <div>
              <div className="h-64 relative overflow-hidden bg-slate-950">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 right-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-[10px] font-mono text-sky-400 border border-sky-400/30">
                  {art.certNumber}
                </span>
              </div>

              <div className="p-6 space-y-3">
                <div>
                  <span className="text-[11px] text-congo-yellow font-medium">{art.artist}</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{art.title}</h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{art.desc}</p>

                <div className="pt-2 text-xs text-slate-400 space-y-1">
                  <p>Dimensions : <span className="text-slate-200">{art.dimensions}</span></p>
                  <p>Technique : <span className="text-slate-200">{art.medium}</span></p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-slate-800/80 mt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Prix de l'œuvre :</span>
                <span className="text-base font-extrabold text-white">
                  {art.priceFcfa.toLocaleString()} <span className="text-xs text-congo-yellow">FCFA</span>
                  <span className="text-xs text-slate-500 ml-1.5 font-normal">({art.priceEur} €)</span>
                </span>
              </div>

              <button
                onClick={() => alert(`Demande d'acquisition pour "${art.title}". Paiement par MTN MoMo ou virement international disponible.`)}
                className="px-4 py-2 bg-congo-green hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition"
              >
                Acquérir
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
