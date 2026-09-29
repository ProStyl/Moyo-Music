"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Printer } from "lucide-react";
import { bcdaApi } from "@/lib/api";

export default function LicenseVerifyPage({ params }: { params: { code: string } }) {
  const [license, setLicense] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const data = await bcdaApi.getLicenses(params.code);
        if (data.licenses && data.licenses.length > 0) {
          const match = data.licenses.find((l: any) => l.license_code.toLowerCase() === params.code.toLowerCase()) || data.licenses[0];
          setLicense(match);
          const validDate = new Date(match.valid_until);
          setIsExpired(validDate < new Date());
        }
      } catch (err) {
        console.error("Erreur vérification licence", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLicense();
  }, [params.code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Vérification du certificat BCDA en cours...
      </div>
    );
  }

  if (!license) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/50 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">Vignette / Licence Non Reconnue</h1>
          <p className="text-xs text-slate-400">
            Le code <strong>{params.code}</strong> n'est pas enregistré dans le registre officiel du BCDA. Attention à la fraude ou contrefaçon.
          </p>
        </div>
      </div>
    );
  }

  const isTransport = license.venue_type.includes("Taxi") || license.venue_type.includes("Bus");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex items-center justify-center">
      <div className="bg-slate-900 border-2 border-congo-yellow/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* En-tête officiel */}
        <div className="text-center border-b border-slate-800 pb-4 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-congo-yellow/10 border border-congo-yellow/30 text-congo-yellow text-[11px] font-bold rounded-full">
            <ShieldCheck className="w-4 h-4" />
            <span>République du Congo • BCDA</span>
          </div>
          <h1 className="text-xl font-black text-white">Certificat d'Authenticité BCDA</h1>
          <p className="text-xs text-slate-400">Contrôle officiel de conformité droit d'auteur & diffusion publique</p>
        </div>

        {/* Statut de validité */}
        <div className={`p-4 rounded-2xl border text-center space-y-1 ${
          !isExpired 
            ? "bg-emerald-950/60 border-emerald-500 text-emerald-300" 
            : "bg-red-950/60 border-red-500 text-red-300"
        }`}>
          <div className="flex items-center justify-center space-x-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{!isExpired ? "ÉTABLISSEMENT / VÉHICULE EN RÈGLE" : "VIGNETTE EXPIRÉE"}</span>
          </div>
          <p className="text-[11px] opacity-90">
            Valide jusqu'au <strong>{new Date(license.valid_until).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong>
          </p>
        </div>

        {/* Détails du titulaire */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">{isTransport ? "Véhicule / Plaque :" : "Enseigne Commerciale :"}</span>
            <strong className="text-white text-right">{license.venue_name}</strong>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Numéro de Licence BCDA :</span>
            <span className="font-mono font-bold text-congo-yellow">{license.license_code}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Catégorie :</span>
            <span className="text-slate-200">{license.venue_type}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Titulaire :</span>
            <span className="text-slate-200">{license.owner_name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Emplacement :</span>
            <span className="text-slate-200">{license.address}, {license.city}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-400">Redevance Culturelle :</span>
            <strong className="text-emerald-400">{parseFloat(license.monthly_fee_fcfa).toLocaleString()} FCFA</strong>
          </div>
        </div>

        {/* VRAI QR Code scannable */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2">
          <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-xl border-4 border-slate-800">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://moyo-culture.cg/verify/license/${license.license_code}`}
              alt={`QR Code BCDA ${license.license_code}`}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Empreinte de Sécurité : {license.qr_code_hash}</span>
        </div>

        <button 
          onClick={() => window.print()}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer la Vignette / Autocollant Officiel</span>
        </button>

      </div>
    </div>
  );
}
