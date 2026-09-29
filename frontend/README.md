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

---

## Session 2 — Réparation d'ESLint + audit fonctionnel approfondi

### Configuration ESLint (bloquait totalement le lint)
- **package.json** : `eslint` retombé en `^8.57.0` (le lint intégré de Next
  14.2.4 utilise une API dépréciée depuis ESLint 9+), ajout de la vraie
  dépendance `eslint-config-next@14.2.4` (manquante — `.eslintrc.json`
  référençait un plugin jamais installé). Dépendance flat-config `@eslint/js`
  retirée (incompatible avec ce setup legacy).
- **eslint.config.js** : supprimé. C'était un flat-config mort, référençant un
  paquet inexistant (`@eslint-plugin/react`), qui faisait planter tout appel
  direct à `eslint` (mais pas `next lint`, d'où le fait qu'il soit passé
  inaperçu).
- **.eslintrc.json** : plusieurs règles invalides corrigées — `computed-property`,
  `react/react-internal` et `no-use-before-declare` ne sont pas des noms de
  règles ESLint réels (`no-use-before-declare` → `no-use-before-define`, le
  reste retiré). `no-restricted-syntax` interdisait `BlockStatement`, ce qui
  aurait fait échouer le lint sur *tout* bloc `{ }` du projet — retiré.
  `no-confusing-arrow` avait une option inexistante. `quotes` était réglé sur
  `single` alors que 100% du code utilise des guillemets doubles — aligné sur
  l'existant. `no-undef` désactivé pour ce projet TypeScript (règle JS pure,
  faux positifs systématiques sur des types comme `React.FormEvent` que
  `tsc` gère déjà correctement). `react/no-unescaped-entities` redescendu en
  avertissement (zéro impact fonctionnel/sécurité, ~150 occurrences
  historiques ; les nouvelles restent signalées).

### Nettoyage automatisé
~194 imports/variables inutilisés réduits à ~35 restants (principalement des
variables d'état à examiner au cas par cas, volontairement non supprimées
en masse — voir plus bas). **Un raté du script de nettoyage automatique a été
détecté et corrigé dans la foulée** : 2 imports par défaut (`import Link from
"next/link"`) et 3 imports vides ont été laissés dans un état syntaxiquement
invalide par un premier passage trop naïf ; repérés via `tsc`/`eslint`,
corrigés, et revérifiés avant de continuer.

### Bugs fonctionnels trouvés en auditant les variables "jamais utilisées"
Le signal `no-unused-vars` a permis de trouver de vraies fonctionnalités
inachevées, pas seulement du code mort :

- **src/app/monitoring/page.tsx** : le bouton "Ajouter un Autre Média" togglait
  un état (`isAddingStream`) qu'aucun formulaire ne consommait — cliquer
  dessus ne faisait littéralement rien. Le backend a pourtant de vraies
  routes (`POST /monitoring/stations/add`, `POST /monitoring/stations/:id/test-stream`)
  jamais exposées dans `monitoringApi` côté client, et les deux handlers
  correspondants appelaient `fetch("http://localhost:4000/...")` en dur au
  lieu de passer par `apiRequest` — cassé dans tout environnement autre que
  la machine du développeur. Corrigé : méthodes ajoutées à `monitoringApi`
  (src/lib/api.ts), formulaire d'ajout de station construit et branché, et
  le résultat du test de flux (`streamTestResult`) — calculé mais jamais
  affiché — a maintenant un badge visuel par station.
- **src/app/distribution/page.tsx** : contenait un second formulaire de
  création de sortie complet (avec son propre `togglePlatform`), entièrement
  mort — `setIsCreateModalOpen(true)` n'était appelé nulle part, le seul CTA
  de la page pointe vers `/distribution/nouveau`. C'est le même schéma que
  `services-360`/`services360` de la session précédente, caché cette fois
  dans un seul fichier. Page réécrite pour ne garder que le listing
  réellement atteignable (avec, au passage, l'état de chargement
  `isLoadingReleases` — lui aussi calculé mais jamais affiché — maintenant
  utilisé).
- **src/app/distribution/nouveau/page.tsx** (la page réellement utilisée) :
  `releaseDate` et `trackTitle` étaient lus dans la charge envoyée au backend
  mais aucun champ ne permettait de les modifier — toute sortie partait avec
  la même date par défaut (2026-10-15) et sans titre de piste personnalisé.
  Deux champs ajoutés à l'étape 2 du formulaire. `router` (jamais utilisé,
  la page navigue déjà via `<Link>`) retiré.

### Vérifications effectuées à chaque étape
`tsc --noEmit`, `eslint` (0 erreur), et `next build` (build de production
complet, 21 routes) relancés après chaque correction.

### Reste à faire (pas traité cette session)
~35 variables/handlers encore signalés "assigned but never used" dans
`admin/page.tsx`, `bcda/page.tsx`, `bcda/deposer/page.tsx`, `wallet/page.tsx`,
`publishing/page.tsx`, `repertoire-public/page.tsx` — certains sont du code
mort inoffensif, d'autres pourraient être du même type de trou fonctionnel
que ceux trouvés ci-dessus. Pas encore auditées un par un.

