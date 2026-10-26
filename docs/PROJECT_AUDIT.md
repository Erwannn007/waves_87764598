# Rapport d'audit — Phase 0

- **Date :** 2026-10-26
- **Dépôt :** `git@github.com:Erwannn007/waves_87764598.git` (branche `main`)
- **Statut :** en attente d'approbation

---

## 1. État actuel du dépôt

| Élément | Constat |
|---|---|
| Historique | 1 commit (`1534eb5 Initial commit`) |
| Fichiers | `README.md`, qui contient uniquement le titre `# waves_87764598` |
| `package.json` | absent |
| Scripts (dev, build, deploy) | aucun |
| Configuration GitHub Pages | aucun fichier dans le dépôt (ni workflow `.github/`, ni `CNAME`, ni `.nojekyll`). Les réglages Pages côté GitHub n'ont pas pu être lus : la CLI `gh` n'est pas installée sur la machine. |
| Assets | aucun |
| Tests | aucun |
| Navigation, routes | aucune |

**Conclusion :** le dépôt est vierge. Il n'y a ni code, ni architecture, ni déploiement à préserver, donc aucune migration. Le choix technologique se fait librement.

URL GitHub Pages attendue si Pages est activé : `https://erwannn007.github.io/waves_87764598/`. Le jeu sera servi **sous un sous-répertoire**, et cela a une conséquence directe sur le chemin de base (voir § 7).

## 2. Technologie utilisée

Aucune. Outils disponibles sur la machine de développement : Node.js v26.5.0, npm 11.17.0 et git (accès SSH à GitHub fonctionnel).

## 3. Éléments existants à préserver

- `README.md` : sera enrichi, pas supprimé.
- L'historique git et la branche `main`.

## 4. Problèmes éventuels

1. **Le nom du dépôt contient un suffixe numérique** (`waves_87764598`). Il apparaîtra dans l'URL publique. Ce n'est pas bloquant, mais un renommage ultérieur change l'URL, ce qui casse l'installation PWA et **fait perdre la sauvegarde locale**, car le stockage est lié à l'origine et au chemin. À décider **avant** la première installation sur téléphone.
2. **Propriété intellectuelle.** Le dépôt est probablement public. S'inspirer de *Fortnite : Sauver le monde* (concept des Husks, défense de zone, fabrication) est acceptable. Reprendre des noms déposés, des designs reconnaissables, des sprites, des sons ou des logos ne l'est pas. Les ennemis auront des noms et des designs originaux qui reprennent seulement des **archétypes** (standard, rapide, tank, distance, briseur de défenses, boss).
3. **La qualité du pixel art est le risque n°1 du projet** (voir § 7.1).

## 5. Technologie recommandée et justification

### 5.1 Comparatif des moteurs

| Option | Avantages | Limites | Verdict |
|---|---|---|---|
| **Phaser + TypeScript + Vite** | Moteur 2D web mature ; caméra, atlas, animations, tri de profondeur, physique Arcade, gestion multi-touch et audio WebAudio intégrés ; mode `pixelArt` (pas de lissage) ; build statique compatible GitHub Pages ; grosse communauté | Taille du bundle (~1 Mo minifié, ~300 Ko gzip) ; physique Arcade limitée aux AABB et aux cercles (suffisant ici) ; l'UI de menus complexe est plus pénible qu'en DOM | **Recommandé** |
| PixiJS + code maison | Rendu très performant, plus léger | Caméra, scènes, input, audio, collisions et animations seraient à écrire soi-même : beaucoup de code d'infrastructure | Plus de travail sans gain visuel |
| Godot (export Web) | Éditeur complet, très bon pour la 2D | Export Web lourd (wasm de plusieurs dizaines de Mo) ; démarrage lent et contraintes mémoire sur iOS Safari ; difficile à piloter et à tester depuis Claude Code | Déconseillé pour une PWA mobile |
| Excalibur, Kaplay, etc. | API simple | Écosystème plus petit, moins de recul sur les gros projets | Pas de bénéfice net |

Le choix de version de Phaser (branche 3.x stable ou 4.x) sera tranché à l'installation, en fonction des versions stables publiées à ce moment-là. L'architecture proposée ne dépend pas de cette différence.

### 5.2 Stack complète proposée

| Besoin | Choix | Raison |
|---|---|---|
| Langage | TypeScript (strict) | Données typées (armes, ennemis, recettes), refactorisations sûres |
| Build et serveur de dev | Vite | Rapide ; `base` configurable pour GitHub Pages ; sortie statique |
| Moteur | Phaser (`pixelArt: true`, `roundPixels: true`) | Voir § 5.1 |
| Collisions | Physique Arcade de Phaser sur des **empreintes au sol** (cercles et rectangles logiques) | Séparation stricte entre logique et affichage (§ 6.2 du prompt maître) |
| Interface | UI dessinée dans Phaser (9-slice pixel art) pour le HUD et les menus de jeu ; DOM uniquement en secours (champs texte, dialogues système) | Cohérence pixel art et contrôle exact de l'échelle |
| Données | Fichiers JSON + schémas **Zod** pour la validation et les valeurs par défaut | Ajouter une arme, un ennemi ou une recette sans toucher au moteur |
| Sauvegarde | **IndexedDB** via un petit wrapper (`idb`), avec un schéma versionné et des migrations ; repli sur localStorage | Volume structuré, écritures transactionnelles, plus de place que localStorage |
| PWA | `vite-plugin-pwa` (Workbox) : manifeste, icônes, précache des assets versionnés | Installation sur l'écran d'accueil et fonctionnement hors ligne |
| Tests unitaires | **Vitest** | Intégré à Vite ; tests de la logique pure (dégâts, munitions, vagues, fabrication, boutique, sauvegarde, migrations) |
| Tests bout-en-bout | **Playwright** (Chromium et WebKit, émulation mobile) | Vérifier le lancement, l'absence d'erreurs console et le chemin de base. WebKit approxime Safari mais ne remplace pas un vrai iPhone. |
| Pipeline d'assets | Scripts Node (`sharp` / `pngjs`) + packer d'atlas (`free-tex-packer-core`) | Contrôle des palettes, de la transparence, des dimensions et des frames manquantes ; génération des atlas et des aperçus |
| Déploiement | GitHub Actions → GitHub Pages (`actions/deploy-pages`) | Build automatique à chaque push sur `main`, sans commit de fichiers compilés |

Aucune de ces dépendances n'est un service distant : tout tourne au build ou dans le navigateur du joueur.

## 6. Architecture proposée

```
/
├─ index.html
├─ package.json, tsconfig.json, vite.config.ts
├─ public/                      # icônes PWA, fichiers servis tels quels
├─ assets-src/                  # sources artistiques (.aseprite, .png par frame) — non servies
├─ src/
│  ├─ main.ts                   # bootstrap Phaser + config
│  ├─ scenes/                   # Boot, Preload, Menu, Game, HUD, Shop, AnimationLab (démo)
│  ├─ core/                     # boucle, événements, services (save, audio, input)
│  ├─ world/                    # iso : conversion sol↔écran, profondeur, carte, caméra
│  ├─ entities/                 # joueur, ennemis, projectiles, structures (composition)
│  ├─ systems/                  # combat, armes, IA, vagues, missions, construction, destruction
│  ├─ meta/                     # inventaire, fabrication, compétences, boutique, skins
│  ├─ ui/                       # composants pixel art (bouton, panneau, joystick, cartes)
│  ├─ data/                     # JSON : weapons, enemies, recipes, skills, skins, missions
│  │  └─ schemas.ts             # schémas Zod + valeurs par défaut
│  └─ save/                     # IndexedDB, versions, migrations, validation
├─ tools/                       # scripts du pipeline d'assets
├─ tests/                       # Vitest (unitaires) et Playwright (e2e)
├─ docs/                        # audit, bible artistique, design system, architecture, catalogue
└─ .github/workflows/deploy.yml
```

**Principes :**

- **Logique pure séparée de Phaser** dans `systems/` et `meta/`. Ces modules sont testables avec Vitest sans navigateur.
- **Coordonnées.** Chaque entité possède une position au sol `(x, y)` en unités logiques, une hauteur `z` et une empreinte de collision. Le sprite est un rendu dérivé : position écran = projection(sol) − z, profondeur = y au sol (plus un biais par couche). Cela évite les personnages flottants et les erreurs de tri.
- **Projection.** « Pseudo-isométrique » ne veut pas forcément dire losange 2:1. Deux options seront testées au prototype : (a) **vue de 3/4 avec sol orthogonal** (le sol reste une grille droite, seul le volume est dessiné en perspective), plus simple pour le déplacement libre et la visée à 360° ; (b) **iso 2:1** classique. Choix soumis à validation en Phase 1.
- **Une seule source de données par contenu.** Une arme correspond à une entrée JSON validée, plus un atlas. Le moteur de combat lit les données et ne connaît aucune arme en particulier.
- **Pooling** des projectiles, des particules et des ennemis dès le départ (coût faible, gain réel sur mobile). Pas d'ECS complet : la composition simple suffit à cette échelle.

## 7. Risques techniques

### 7.1 Production du pixel art (risque élevé)

Claude Code écrit du code et des fichiers, mais il ne « dessine » pas comme un artiste. Comparaison honnête des trois méthodes :

| Méthode | Qualité attendue | Coût | Remarque |
|---|---|---|---|
| 1. Entièrement programmatique (pixels définis dans le code, ou primitives) | Correcte pour les décors simples, les effets et les icônes ; **insuffisante** pour un survivant expressif animé en 8 directions | Faible | Risque élevé de rendu « formes géométriques », que le prompt maître refuse |
| 2. Sprites dessinés à la main ou générés par une IA d'image, puis nettoyés | La meilleure qualité possible | Élevé : temps de dessin, ou outil externe | La génération d'image n'est pas disponible dans Claude Code ; il faut un outil externe ou un artiste |
| 3. **Hybride** | Bonne à très bonne | Moyen | Personnages et ennemis dessinés (ou générés puis retouchés) dans un éditeur pixel art, avec gabarits, palette et squelette de poses fournis par Claude ; décors modulaires, effets, particules et UI en partie générés par script ; contrôles, atlas et intégration automatisés |

**Recommandation : méthode 3.** Pour le prototype (Phase 2), je propose de produire d'abord, par code, un **survivant et un zombie en pixel art palettisé** (matrices de pixels, pas de rectangles), avec quelques poses clés, pour **mesurer objectivement** ce que la méthode 1 permet d'atteindre. Si le rendu n'est pas au niveau, je le dirai, et les personnages passeront par un éditeur : Aseprite (payant, environ 20 €, standard de l'industrie), LibreSprite ou Pixelorama (gratuits). Le format d'échange (PNG par frame + JSON d'animation) sera identique dans les deux cas, donc rien n'est perdu.

**Volume à anticiper :** 8 directions × environ 10 animations × 4 à 8 frames ≈ 300 à 600 frames **par personnage**. Leviers de réduction à valider : dessiner 5 directions et obtenir les 3 autres par miroir, séparer l'arme du corps (le haut du corps pivote avec la visée, le bas suit le déplacement), et utiliser des calques de skins superposables.

### 7.2 Contraintes iOS / Android

| Sujet | iOS (Safari / PWA installée) | Android (Chrome) | Parade |
|---|---|---|---|
| Plein écran | **Pas d'API Fullscreen sur iPhone.** Seule l'app installée sur l'écran d'accueil (`display: standalone`) masque l'interface de Safari ; la barre d'état reste visible | `display: fullscreen` pris en charge | Inviter le joueur à installer l'app ; gérer `env(safe-area-inset-*)` avec `viewport-fit=cover` |
| Orientation | Le verrouillage via le manifeste ou `screen.orientation.lock` **n'est pas pris en charge** | Pris en charge (manifeste ou PWA) | Écran « tournez votre téléphone » si le mode portrait n'est pas jouable |
| Stockage | Possible éviction des données d'un site non installé après une période d'inactivité ; une PWA installée a son propre conteneur de stockage, **distinct de celui de Safari** | Plus stable ; `navigator.storage.persist()` possible | Demander la persistance, proposer un export/import manuel de la sauvegarde (fichier JSON), ne jamais promettre une conservation absolue |
| Audio | Lecture bloquée tant qu'aucun geste utilisateur n'a eu lieu ; le bouton silencieux coupe le WebAudio | Geste requis également | Déverrouiller l'audio au premier toucher (« Toucher pour jouer ») |
| Gestes | Zoom par double-tap, geste « retour » par glissement depuis le bord, rebond du scroll | Geste retour système | `touch-action: none`, `overscroll-behavior: none`, joysticks éloignés des bords |
| Performances | GPU correct, mais mémoire limitée ; trop de grandes textures provoque un rechargement de la page | Très variable selon l'appareil | Atlas ≤ 2048×2048, budget de draw calls, résolution interne basse avec mise à l'échelle par entier |

### 7.3 Autres risques

- **Mise à l'échelle du pixel art.** Les écrans ont des tailles arbitraires. Une mise à l'échelle non entière déforme les pixels. Parade : résolution interne fixe (à valider au prototype), facteur entier, bandes ou extension du champ de vision pour le reste.
- **Cache PWA.** Un service worker mal configuré peut servir une ancienne version indéfiniment. Parade : précache versionné et invite « nouvelle version disponible ».
- **Migrations de sauvegarde.** Elles sont dès le départ dans le périmètre de test (v1 → v2 simulée dans les tests).
- **Dépassement du périmètre.** Le prompt maître est très ambitieux. Les phases et les critères d'acceptation de `ROADMAP.md` servent de garde-fou.

## 8. Plan de développement

Voir `ROADMAP.md` (statuts, dépendances, critères d'acceptation). Résumé :

| Phase | Contenu | Point d'arrêt |
|---|---|---|
| 0 | Audit (ce document) | ✋ approbation de la stack |
| 1 | Bible artistique, design system, catalogue d'assets, planche de référence avec variantes (projection, échelle, palette) | ✋ validation artistique |
| 2 | Prototype : scène, survivant, zombie, arme, tir, impacts, écran « AnimationLab » | ✋ validation du prototype |
| 3 | Moteur : iso, caméra, collisions, input clavier/souris + double joystick, données + Zod | |
| 4 | Combat, armes, bestiaire initial, vagues, missions | |
| 5 | Construction, pièges, destruction à états | |
| 6 | Inventaire, fabrication, compétences, boutique, skins | |
| 7 | UI finale, expérience mobile | |
| 8 | Sauvegarde fiabilisée, PWA, déploiement réel | |
| 9 | Tests, équilibrage, optimisation | |

**Ajustement proposé :** le squelette technique minimal (Vite, TypeScript, Phaser, workflow de déploiement, manifeste PWA) arrive **au début de la Phase 2**, pas en Phase 8. Le prototype doit être testable **sur un vrai téléphone, depuis l'URL GitHub Pages**, sinon la lisibilité mobile et les performances ne peuvent pas être jugées. La fiabilisation complète de la PWA et de la sauvegarde reste en Phase 8.

## 9. Commandes (prévues, pas encore disponibles)

Elles existeront après l'initialisation du projet (début de la Phase 2) :

```bash
npm install          # installer les dépendances
npm run dev          # serveur local (http://localhost:5173/waves_87764598/)
npm run dev -- --host  # exposer sur le réseau local pour tester depuis un téléphone
npm run build        # build de production dans dist/
npm run preview      # servir le build localement
npm test             # tests unitaires (Vitest)
npm run test:e2e     # tests navigateur (Playwright)
npm run assets       # pipeline : contrôle des sprites + génération des atlas
```

Le déploiement sera automatique à chaque push sur `main`, via GitHub Actions.

## 10. Modifications soumises à approbation

1. **Stack :** Phaser + TypeScript + Vite + Vitest/Playwright + Zod + IndexedDB + vite-plugin-pwa.
2. **Déploiement via GitHub Actions.** Action manuelle de ta part : *Settings → Pages → Build and deployment → Source : « GitHub Actions »*.
3. **Nom du dépôt / URL définitive** (garder `waves_87764598` ou renommer **avant** toute installation sur téléphone).
4. **Orientation cible :** paysage uniquement (recommandé pour un double joystick), ou paysage et portrait.
5. **Outil de dessin** pour les personnages si le test programmatique est insuffisant : Aseprite, LibreSprite, Pixelorama, ou générateur IA externe.
6. **Ajustement du plan :** squelette technique et déploiement dès la Phase 2 (§ 8).
7. **Nom du jeu** (pour le manifeste PWA et l'identité visuelle). Provisoirement : « Waves ».

## 11. Documentation à créer

| Fichier | Phase | Statut |
|---|---|---|
| `docs/PROMPT_MAITRE.md` | 0 | ✅ créé |
| `docs/PROJECT_AUDIT.md` | 0 | ✅ créé |
| `ROADMAP.md` | 0 | ✅ créé (tenu à jour à chaque phase) |
| `CLAUDE.md` | 0 | ✅ créé (règles pour les sessions Claude Code) |
| `docs/ART_BIBLE.md` | 1 | proposé |
| `docs/DESIGN_SYSTEM.md` | 1 | proposé |
| `docs/ASSET_CATALOG.md` (+ fiche normalisée) | 1 | proposé |
| `docs/ARCHITECTURE.md` | 2–3 | proposé |
| `docs/DEPLOYMENT.md` | 2 | proposé |
| `docs/TESTING.md` (checklists manuelles) | 2 | proposé |
| `docs/KNOWN_LIMITATIONS.md` | 2+ | proposé |

## 12. Premières étapes vers le prototype artistique

1. Après approbation : rédiger `docs/ART_BIBLE.md` avec **2 ou 3 variantes** sur les choix structurants : projection (3/4 orthogonale ou iso 2:1), hauteur du personnage à l'écran, résolution interne, épaisseur et couleur des contours, palette.
2. Produire une **planche de référence** statique : survivant de face et de dos, zombie, une arme, une tuile de sol et un élément de décor, dans chaque variante, affichés à l'échelle réelle d'un téléphone.
3. Tu valides une variante. Seuls ces paramètres-là sont alors figés.
4. Initialiser le squelette technique, le workflow Pages et le manifeste PWA, puis vérifier l'URL publiée sur ton téléphone.
5. Produire les animations du prototype, puis l'écran AnimationLab de comparaison.
