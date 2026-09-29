# Corrections frontend — MOYO Music

Ce dossier reproduit uniquement l'arborescence `src/` (+ `.env.example`) des fichiers
modifiés. Pour les réintégrer : copiez chaque fichier à son même chemin dans votre
projet (`src/lib/api.ts` → `frontend/src/lib/api.ts`, etc.), en écrasant l'existant.

## Fichiers modifiés et pourquoi

- **src/lib/api.ts**
  `apiRequest` ne rejetait jamais sur une erreur HTTP (400/500) : tous les
  `try/catch` du projet étaient inopérants. Vérifie désormais `response.ok`,
  gère un corps de réponse non-JSON, et lève une vraie exception. `syncToWallet`
  aligné sur la convention des autres appels (`.then(r => r.data)`).

- **src/lib/auth-context.tsx**
  `isError`/`setIsError` étaient utilisés sans jamais être déclarés
  (erreur de compilation). État déclaré et réinitialisé à chaque tentative de
  connexion/inscription/déconnexion.

- **src/components/AuthModal.tsx**
  Un login ou une inscription échoués affichaient quand même "réussi" et
  redirigeaient l'utilisateur, car le code ignorait la valeur booléenne
  retournée par `login()`/`register()`. Corrigé. Les 5 comptes de démonstration
  (numéros + mots de passe en clair) ne sont plus exposés dans le bundle JS par
  défaut : repliés derrière `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true` (voir
  `.env.example`), à n'activer qu'en dev/démo.

- **src/components/Navbar.tsx**
  `logout` était appelé sans être déstructuré de `useAuth()` → plantage au
  clic. Un bouton "Déconnexion" ouvrait en réalité la modale de connexion
  (jamais montée à cet endroit, donc sans aucun effet) ; supprimé, il faisait
  doublon avec le bouton icône déjà correct. Le bouton du menu mobile affichait
  "Se Connecter" tout en appelant `logout()` ; réétiqueté "Déconnexion".

- **src/components/DashboardSidebar.tsx**
  Classes Tailwind contradictoires (`lg:flex` + `md:hidden` inconditionnel)
  qui pouvaient faire disparaître la sidebar sur desktop selon l'ordre de
  génération CSS. Plus grave : le bouton censé ouvrir le menu sur mobile était
  situé à l'intérieur du panneau qu'il devait ouvrir — impossible à atteindre,
  donc navigation du dashboard totalement inaccessible sur mobile. Le
  déclencheur est maintenant un bouton fixe en dehors du panneau, avec un fond
  semi-transparent cliquable pour refermer.

- **src/app/billetterie/creer/page.tsx** et **src/app/galerie/ajouter/page.tsx**
  Lisaient `res.event` / `res.artwork` au lieu de `res.data.event` /
  `res.data.artwork` (ces deux pages appellent `apiRequest` directement au lieu
  de passer par les wrappers `ticketingApi`/`marketplaceApi`). Corrigé.

- **src/app/publishing/page.tsx**
  Incompatibilité de type `string | undefined` → `string | null` sur
  `setNotification`. Valeur de repli ajoutée.

- **src/app/services-360/page.tsx** *(fusion + branchement réel à l'API)*
  `/services-360` et `/services360` étaient deux pages différentes, non liées
  entre elles, toutes deux avec un catalogue et une commande **entièrement
  simulés en local** (aucun appel à `servicesApi`, pourtant déjà présent et
  prêt dans `lib/api.ts`). Le dossier `/services360` a été supprimé. La page
  `/services-360` (celle déjà utilisée par la sidebar) a été reconstruite pour
  charger le vrai catalogue via `GET /services360/catalog` et soumettre une
  vraie commande via `POST /services360/order`, avec état de chargement et
  gestion d'erreur. Le verrou "réservé aux artistes" de l'ancienne page
  `/services360` a été repris, car le backend restreint déjà ces deux routes
  au rôle `artist` (+ `admin`).

- **src/components/Footer.tsx**
  Deux liens pointaient vers `/services360`, route supprimée → 404 en
  puissance. Redirigés vers `/services-360`.

- **.env.example** *(nouveau fichier)*
  Documente `NEXT_PUBLIC_API_URL` et la nouvelle variable
  `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS`.

## Vérification effectuée

`npx tsc --noEmit` : 0 erreur (hors avertissement de dépréciation `target: es5`,
préexistant, sans rapport).
`next build` : build de production complet réussi, 21 routes générées,
`/services-360` unique, `/services360` bien absent.

## Reste à votre appréciation (non modifié)

- Le token JWT reste stocké en `localStorage` (exposition XSS). Le corriger
  proprement nécessite un cookie httpOnly, donc une intervention côté backend
  — hors du périmètre de cette passe purement frontend.
