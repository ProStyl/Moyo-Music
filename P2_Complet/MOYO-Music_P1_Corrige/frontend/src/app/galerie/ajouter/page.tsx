"use client";

import { useState } from "react";
import Link from "next/link";
import { Palette, Upload, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";

export default function AjouterArtPage() {
  const { user } = useAuth();
  const isPainter = user?.role === "painter" || user?.role === "admin";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Peinture Poto-Poto");
  const [dimensions, setDimensions] = useState("100 x 120 cm");
  const [medium, setMedium] = useState("Acrylique sur toile (Style Mika)");
  const [priceFcfa, setPriceFcfa] = useState("350000");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdArtwork, setCreatedArtwork] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await apiRequest("/marketplace/artworks/create", {
        method: "POST",
        body: JSON.stringify({
          title,
          category,
          dimensions,
          medium,
          price_fcfa: parseFloat(priceFcfa),
          description,
          image_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80",
        }),
      });

      setCreatedArtwork(res.data.artwork);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise en ligne de l'œuvre");
    } finally {
      setIsSubmitting(false);
    }
  };

  // VERROU STRICT : Si l'utilisateur n'est pas peintre
  if (!user || !isPainter) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-sky-500/10 text-sky-400 rounded-3xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Espace Réservé aux Artistes Peintres</h1>
        <p className="text-xs text-slate-400">
          L'ajout et la certification d'œuvres d'art sont réservés aux membres de l'<strong>École de Peinture de Poto-Poto (EPP)</strong> et aux plasticiens enregistrés.
        </p>
        <p className="text-[11px] text-congo-yellow">
          Votre rôle actuel : <strong>{user ? user.role : "Visiteur non connecté"}</strong>
        </p>
        <div className="pt-2">
          <Link
            href="/galerie"
            className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:text-white rounded-xl text-xs inline-block"
          >
            Retourner à la Galerie Publique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <Link href="/galerie" className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour à la Galerie d'Art</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Atelier d'Art : Certifier & Vendre une Œuvre</h1>
            <p className="text-xs text-slate-400">
              Artiste Peintre : <strong>{user.artist_name || user.full_name}</strong> (École de Poto-Poto)
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-2xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {createdArtwork ? (
          <div className="bg-slate-950 border border-sky-500/50 rounded-3xl p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Certificat d'Authenticité Émis !</h2>
              <p className="text-xs text-slate-400 mt-1">L'œuvre a été inscrite au registre officiel de la plateforme.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Titre :</span>
                <span className="font-bold text-white">{createdArtwork.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Numéro de Certificat :</span>
                <span className="font-mono font-bold text-sky-400">{createdArtwork.certificate_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prix de Vente :</span>
                <span className="font-bold text-congo-yellow">{parseFloat(createdArtwork.price_fcfa).toLocaleString()} FCFA ({createdArtwork.price_eur} €)</span>
              </div>
            </div>

            <button
              onClick={() => setCreatedArtwork(null)}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              Ajouter une autre toile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Titre du Tableau / de la Sculpture *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Danse des Masques du Chaillu"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Style / Catégorie *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400"
                >
                  <option value="Peinture Poto-Poto">Peinture École de Poto-Poto (EPP)</option>
                  <option value="Art Contemporain">Art Contemporain & Sape</option>
                  <option value="Sculpture Bois/Bronze">Sculpture Bois d'Ébène / Bronze</option>
                  <option value="Artisanat d'Art">Artisanat d'Art & Céramique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Dimensions (Largeur x Hauteur) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 100 x 120 cm"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Technique / Médium utilisé *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Acrylique sur toile de lin (Style Mika)"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Prix de Vente (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 350000"
                  value={priceFcfa}
                  onChange={(e) => setPriceFcfa(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Photo Haute Définition de l'Œuvre
                </label>
                <div className="border border-dashed border-slate-800 rounded-xl p-3 text-center bg-slate-950 text-xs text-slate-400">
                  <span>Photo prête (Exemple Demo HD)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Histoire et Signification de l'Œuvre
              </label>
              <textarea
                rows={3}
                placeholder="Décrivez les symboles, les masques ou le message culturel véhiculé par cette création..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-2"
            >
              {isSubmitting ? <span>Génération du Certificat Numérique...</span> : <span>Publier l'Œuvre & Obtenir le Certificat d'Authenticité 📜</span>}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
