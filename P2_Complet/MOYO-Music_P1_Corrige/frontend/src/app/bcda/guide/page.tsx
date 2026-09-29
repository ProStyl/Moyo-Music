"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle2, 
  Coins, 
  Clock, 
  Globe, 
  FileText, 
  Users, 
  Music, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ExternalLink,
  BookOpen,
  Award,
  Scale,
  Zap,
  Info
} from "lucide-react";

interface FAQItem {
  id: string;
  category: "adhesion" | "droits" | "protection" | "international";
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  tips?: string;
  tags: string[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "quest-1",
    category: "adhesion",
    question: "C'est quoi le BCDA (et la SACEM) et à quoi ça sert concrètement ?",
    shortAnswer: "C'est la société d'auteurs qui protège vos œuvres, autorise leur diffusion et collecte l'argent auprès des radios, télés, concerts et discothèques pour vous le reverser.",
    detailedAnswer: "Le Bureau Congolais du Droit d'Auteur (BCDA), tout comme la SACEM en France ou la SABAM en Belgique, est l'organisme collectif qui regroupe les auteurs, compositeurs et éditeurs de musique. Au lieu que chaque créateur aille négocier individuellement avec des milliers de radios, chaînes de télévision, bars, festivals ou plateformes de streaming, le BCDA parle d'une seule voix forte, perçoit les redevances légales pour chaque diffusion et les reverse directement sur le compte Mobile Money ou bancaire des artistes selon les clés de répartition.",
    tips: "💡 Sans inscription au BCDA ou à la SACEM, vos musiques peuvent passer à la radio ou en club sans que vous ne touchiez jamais le moindre franc de droit d'auteur.",
    tags: ["Définition", "Rôle", "Collecte", "Général"]
  },
  {
    id: "quest-2",
    category: "adhesion",
    question: "À combien s'élèvent les frais d'adhésion et est-ce un paiement à vie ?",
    shortAnswer: "L'adhésion est un paiement unique À VIE (aucun abonnement mensuel ni annuel), incluant une part sociale récupérable si vous quittez la société.",
    detailedAnswer: "Les frais d'adhésion sont payés une seule et unique fois pour toute votre vie de créateur. Vous pouvez ensuite déposer 10, 1 000 ou 50 000 œuvres à votre catalogue sans jamais débourser un centime supplémentaire. Ces frais comprennent une part sociale au capital (remboursée en cas de démission).",
    tips: "✅ Une fois adhérent, tous vos futurs albums, singles et clips sont protégés à vie sans frais de renouvellement.",
    tags: ["Tarifs", "Adhésion", "Part sociale", "Prix"]
  },
  {
    id: "quest-3",
    category: "adhesion",
    question: "L'inscription au BCDA ou à la SACEM est-elle obligatoire ?",
    shortAnswer: "Non, elle n'est pas obligatoire, mais elle est indispensable si vous voulez être rémunéré pour vos diffusions.",
    detailedAnswer: "Légalement, personne ne peut vous forcer à adhérer. Vous pouvez choisir de rester en auto-gestion ou faire appel à un avocat spécialisé. Cependant, sans adhésion à une société d'auteurs officielle (BCDA, SACEM, BMI), aucune chaîne de télévision ni station de radio ne pourra vous identifier pour vous verser vos redevances d'exécution publique.",
    tips: "⚠️ Un simple dépôt informel sur les réseaux ne collecte aucun droit d'auteur.",
    tags: ["Obligation", "Loi", "Autonomie"]
  },
  {
    id: "quest-4",
    category: "adhesion",
    question: "Est-ce que je peux adhérer si je ne sais pas lire la musique (solfège) ou sans diplôme ?",
    shortAnswer: "OUI, ABSOLUMENT ! Aucun diplôme ni connaissance du solfège n'est requis.",
    detailedAnswer: "Une grande partie des plus grands créateurs de musique urbaine, rap, afrobeats, rumba ou électro n'ont jamais lu une seule partition de leur vie. Pour adhérer, il suffit simplement de prouver que vous créez de la musique (fichier audio MP3/WAV, démo ou texte de chanson). Le BCDA et la SACEM accueillent tous les créateurs sans aucune condition de diplôme.",
    tips: "🎹 Si vous composez des mélodies à l'oreille ou programmez des beats sur votre ordinateur, vous êtes 100% éligible.",
    tags: ["Solfège", "Diplôme", "Accessibilité", "Beatmaker"]
  },
  {
    id: "quest-5",
    category: "adhesion",
    question: "Peut-on adhérer en étant MINEUR (moins de 18 ans) ?",
    shortAnswer: "OUI, avec l'autorisation écrite préalable de votre représentant légal (parent ou tuteur).",
    detailedAnswer: "De nombreux jeunes talents et prodiges de la musique créent des hits avant leur majorité. L'inscription est totalement ouverte aux mineurs. Un dossier spécifique avec l'accord signé du tuteur légal et une copie de sa pièce d'identité est requis. Les redevances perçues peuvent être versées au tuteur légal ou conservées sous séquestre sécurisé jusqu'à la majorité du créateur.",
    tips: "👨‍👩‍👦 Les parents peuvent créer et valider le compte BCDA pour leur enfant artiste.",
    tags: ["Mineur", "Jeunesse", "Tuteur", "Parental"]
  },
  {
    id: "quest-6",
    category: "adhesion",
    question: "Quels sont les justificatifs d'exploitation acceptés pour devenir membre ?",
    shortAnswer: "Une simple capture d'écran de votre titre sur Spotify, Boomplay, Apple Music, ou YouTube avec +1 000 vues suffit !",
    detailedAnswer: "Pour prouver votre qualité de créateur en activité, vous devez fournir UN SEUL justificatif parmi les 4 suivants :\n1. 📱 Une capture d'écran des crédits sur une plateforme de streaming (Spotify, Apple Music, Boomplay, Deezer) mentionnant votre nom en Auteur ou Compositeur.\n2. 📺 Une capture d'écran YouTube, TikTok ou Soundcloud affichant au moins 1 000 vues/écoutes.\n3. 📻 Une attestation de diffusion signée par une radio, une télé ou un organisateur de concert.\n4. 💿 Une copie de la jaquette d'un CD ou vinyle physique mentionnant vos crédits.",
    tips: "💡 Astuce rapide : Sortez votre son en distribution digitale via Moyo Culture, faites une capture d'écran des crédits Spotify, et votre adhésion est immédiatement validée !",
    tags: ["Justificatifs", "Spotify", "YouTube", "Preuve"]
  },
  {
    id: "quest-7",
    category: "droits",
    question: "Combien de temps faut-il pour encaisser ses premiers droits d'auteur ?",
    shortAnswer: "En moyenne entre 6 à 18 mois après les premières diffusions.",
    detailedAnswer: "C'est le délai légal standard de la filière musicale dans le monde entier. Par exemple, si votre morceau est diffusé en radio ou télévision au premier semestre (janvier à juin), les diffuseurs transmettent leurs relevés de diffusion et règlent les redevances au BCDA/SACEM au second semestre. Le temps de calculer les clés de répartition (Phono, DEP, DR) et d'auditer les comptes, la répartition effective arrive 6 à 12 mois plus tard.",
    tips: "⏳ Règle d'or : Ce que votre musique génère aujourd'hui en radio et TV sera encaissé sur votre compte l'année suivante.",
    tags: ["Délai", "Paiement", "Calendrier", "Répartition"]
  },
  {
    id: "quest-8",
    category: "droits",
    question: "C'est quoi la différence entre Clés PHONO, Clés DEP et Clés DR ?",
    shortAnswer: "Ce sont les 3 canaux de perception : le streaming/disques (PHONO), les passages TV/Radios/Concerts (DEP) et la synchronisation film/pub (DR).",
    detailedAnswer: "• 💿 **Clés PHONO (Droits Phonographiques)** : Rémunèrent les ventes physiques, le téléchargement et les streams sur les plateformes numériques (Spotify, Boomplay, Apple Music).\n• 📻 **Clés DEP (Droits d'Exécution Publique)** : Rémunèrent chaque diffusion publique (Radios FM, Télévisions, Bars, Discothèques, Concerts en live, Restaurants).\n• 🎬 **Clés DR (Droits de Reproduction Mécanique / Synchro)** : Rémunèrent l'utilisation de votre musique dans des films, séries, publicités et jeux vidéo.\nPar défaut, le bouton **'Partage Égalitaire'** applique le même pourcentage sur les 3 clés.",
    tips: "⚖️ Si vous êtes 2 co-auteurs à 50/50, la clé Phono, DEP et DR sera automatiquement fixée à 50% chacun.",
    tags: ["Clés Phono", "DEP", "DR", "Splits", "Technique"]
  },
  {
    id: "quest-9",
    category: "international",
    question: "Peut-on cumuler le BCDA avec la SACEM, la SABAM, la SOCAN ou BMI ?",
    shortAnswer: "OUI, grâce au principe officiel de la FRAGMENTATION DE TERRITOIRE !",
    detailedAnswer: "Vous avez parfaitement le droit de mandater plusieurs sociétés d'auteurs en fragmentant vos territoires. Par exemple :\n• Vous confiez au **BCDA** la gestion de vos droits pour la République du Congo et l'Afrique Centrale.\n• Vous confiez à la **SACEM** vos droits pour la France et l'Europe.\n• Vous confiez à **BMI ou ASCAP** vos droits pour les États-Unis et le continent américain.\nChaque société collectera l'argent sur son propre territoire et vous le reversera directement.",
    tips: "🌍 La fragmentation de territoire vous permet de maximiser vos revenus et de toucher directement les subventions locales de chaque pays.",
    tags: ["International", "SACEM", "BMI", "Territoires", "Monde"]
  },
  {
    id: "quest-10",
    category: "droits",
    question: "Quelle est la différence entre le BCDA/SACEM et les Droits Voisins (SCPP/SPPF/ADAMI) ?",
    shortAnswer: "Le BCDA/SACEM rémunère ceux qui CRÉENT l'œuvre (Auteurs, Compositeurs), les Droits Voisins rémunèrent ceux qui la FINANCENT et l'INTERPRÈTENT (Producteurs, Chanteurs, Musiciens).",
    detailedAnswer: "• ✍️ **Droits d'Auteur (BCDA / SACEM)** : Rémunèrent la propriété intellectuelle : l'écriture des paroles (Auteur), la composition de la mélodie (Compositeur) et l'arrangement (Beatmaker).\n• 📀 **Droits Voisins de Producteur (SCPP / SPPF)** : Rémunèrent le producteur qui a payé la séance de studio, le mixage, le mastering et le clip.\n• 🎤 **Droits Voisins d'Interprètes (ADAMI / SPEDIDAM)** : Rémunèrent les artistes et musiciens de session qui chantent ou jouent sur l'enregistrement phonographique.",
    tips: "💡 Sur Moyo Culture, si vous êtes à la fois Auteur, Compositeur ET Producteur de votre son, vous cumulez 100% des droits d'auteur ET des droits voisins !",
    tags: ["Droits voisins", "Producteur", "Interprète", "SCPP"]
  },
  {
    id: "quest-11",
    category: "adhesion",
    question: "Quelle est la commission prélevée par la société d'auteurs sur mes gains ?",
    shortAnswer: "Environ 10% à 11% pour couvrir les frais de fonctionnement, logiciels et équipes de contrôle.",
    detailedAnswer: "Les sociétés d'auteurs sont des organismes à but non lucratif gérés par et pour les créateurs. La commission moyenne prélevée est d'environ 10.8% sur les sommes effectivement perçues. Cela permet de financer les serveurs de détection acoustique, les équipes de contrôle sur le terrain et la gestion administrative.",
    tips: "💰 Vous conservez environ 89% à 90% net de tous les droits collectés sur vos œuvres.",
    tags: ["Commission", "Frais", "Pourcentage"]
  },
  {
    id: "quest-12",
    category: "adhesion",
    question: "Que se passe-t-il si je décide de quitter le BCDA ou la SACEM ?",
    shortAnswer: "Votre part sociale vous est remboursée et vos droits résiduels continuent de vous être versés.",
    detailedAnswer: "Pour démissionner, il suffit d'envoyer un courrier ou une demande de résiliation en ligne. La part sociale apportée lors de votre adhésion vous est intégralement remboursée. Si vos œuvres passées continuent d'être diffusées et de générer des redevances, la société d'auteurs continuera de vous verser vos droits légaux.",
    tips: "🛡️ Vos créations restent protégées par leur preuve d'antériorité même si vous quittez la société.",
    tags: ["Démission", "Sortie", "Remboursement"]
  },
  {
    id: "quest-13",
    category: "protection",
    question: "C'est quoi MusicStart et la Preuve d'Antériorité Cryptographique ?",
    shortAnswer: "C'est un certificat infalsifiable avec hash SHA-256 qui prouve que vous êtes le premier créateur d'une démo ou d'un beat avant sa sortie.",
    detailedAnswer: "MusicStart permet de protéger des maquettes, démos, beats ou textes inachevés avant même qu'ils ne soient publiés. Dès que vous déposez votre fichier sur Moyo Culture BCDA, notre algorithme génère une empreinte numérique SHA-256 horodatée. Si un tiers tente de voler votre prod ou vos paroles 2 ans plus tard, votre certificat prouve juridiquement votre antériorité devant n'importe quel tribunal ou plateforme mondiale.",
    tips: "🔒 Déposez toujours vos instrumentales et maquettes sur MusicStart BCDA avant de les faire écouter à des tiers.",
    tags: ["MusicStart", "Anti-plagiat", "Démo", "SHA256"]
  }
];

export default function BCDAGuideFAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "quest-1": true,
    "quest-2": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredItems = FAQ_ITEMS.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shortAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detailedAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-white">
      
      {/* Navigation Retour */}
      <div className="flex justify-between items-center">
        <Link
          href="/bcda"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'Espace BCDA</span>
        </Link>

        <Link
          href="/bcda/deposer"
          className="px-4 py-2 bg-congo-yellow hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-lg"
        >
          <span>Déposer une Œuvre (8 Étapes)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Bannière Header Inspirée de la Masterclass */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Guide & FAQ Officielle • Standard International SACEM, CISAC & BCDA 🇨🇬</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          Tout Savoir sur le Droit d'Auteur, l'Adhésion BCDA & la Collecte des Droits
        </h1>
        
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Comprenez précisément comment fonctionne la protection de vos musiques, le calcul des <strong>Clés Phono, DEP et DR</strong>, l'adhésion sans solfège, les délais de paiement et la fragmentation internationale de vos territoires.
        </p>

        {/* 4 Piliers Clés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-semibold">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center space-x-2.5">
            <Coins className="w-5 h-5 text-congo-yellow flex-shrink-0" />
            <div>
              <span className="text-white block font-bold">Frais Uniques à Vie</span>
              <span className="text-[10px] text-slate-400">Part sociale remboursable</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center space-x-2.5">
            <Award className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="text-white block font-bold">Sans Diplôme</span>
              <span className="text-[10px] text-slate-400">Pas besoin de solfège</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-sky-400 flex-shrink-0" />
            <div>
              <span className="text-white block font-bold">Délais de Paiement</span>
              <span className="text-[10px] text-slate-400">6 à 18 mois légaux</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center space-x-2.5">
            <Globe className="w-5 h-5 text-congo-red flex-shrink-0" />
            <div>
              <span className="text-white block font-bold">Fragmentation</span>
              <span className="text-[10px] text-slate-400">Cumul BCDA + SACEM + BMI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Rechercher une question (ex: mineur, solfège, clés phono, Spotify, SACEM, délais...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-congo-yellow shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: "all", label: "Toutes les Questions (13)" },
            { id: "adhesion", label: "Adhésion & Conditions" },
            { id: "droits", label: "Calcul des Droits (Phono/DEP/DR)" },
            { id: "protection", label: "MusicStart & Preuve IA" },
            { id: "international", label: "Territoires & Cumul SACEM" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold transition ${
                activeCategory === tab.id
                  ? "bg-congo-yellow text-slate-950 shadow-md"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des Questions / Réponses Accordéon */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const isOpen = !!openItems[item.id];
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl transition hover:border-slate-700"
            >
              {/* Question Header */}
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full p-6 text-left flex items-start justify-between gap-4 select-none"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {item.question}
                  </h3>
                  <p className="text-xs text-congo-yellow font-semibold">
                    {item.shortAnswer}
                  </p>
                </div>

                <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 flex-shrink-0">
                  {isOpen ? <ChevronUp className="w-5 h-5 text-congo-yellow" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Detailed Answer */}
              {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-4 text-xs text-slate-300 leading-relaxed animate-fade-in">
                  <div className="whitespace-pre-line bg-slate-950 p-4 rounded-2xl border border-slate-800/60 font-normal">
                    {item.detailedAnswer}
                  </div>

                  {item.tips && (
                    <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-emerald-300 font-medium">
                      {item.tips}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Module MusiSecure / Moyo Pro - Gestion Administrative & Subventions */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-full">
              Service Intégré Moyo Pro & MusiSecure 🛡️
            </span>
            <h2 className="text-xl font-black text-white mt-2">Déléguer Toute la Gestion Administrative & Contrats</h2>
          </div>

          <Link
            href="/bcda/deposer"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center space-x-2"
          >
            <span>Démarrer un Dépôt BCDA</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Vous n'avez pas le temps de remplir les formulaires de chaque organisme international ? Notre moteur automatisé gère vos dépôts multi-sociétés (<strong>BCDA, SACEM, BMI, SOCAN, OAPI</strong>), génère automatiquement vos <strong>contrats de cession et split-sheets</strong>, et audite vos passages radio/télé en direct.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <strong className="text-congo-yellow block">📑 Générateur de Contrats Auto</strong>
            <span className="text-slate-400 text-[11px]">Contrats de co-édition, accords beatmaker et réalisateurs de clips générés en 1 clic.</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <strong className="text-emerald-400 block">📻 Traçage Radio & TV Temps Réel</strong>
            <span className="text-slate-400 text-[11px]">Relevés horodatés de toutes vos diffusions pour vérifier l'exactitude des répartitions BCDA.</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <strong className="text-sky-400 block">🌍 Déclaration Multi-Territoires</strong>
            <span className="text-slate-400 text-[11px]">Enregistrement simultané de votre code ISWC au Congo, en Europe et aux USA.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
