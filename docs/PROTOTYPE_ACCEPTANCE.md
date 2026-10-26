# Critères d'acceptation — Prototype de la Phase 2

Le prototype est **accepté** quand tous les critères ✅ obligatoires sont vérifiés **et** que tu as validé explicitement la direction artistique. Chaque critère indique comment il est vérifié.

Légende : **[A]** test automatisé · **[M]** vérification manuelle sur appareil · **[V]** ta validation artistique

## État au 2026-10-26 (prototype 0.2 publié)

| Critères | État |
|---|---|
| P1, P4, C4, G1, G2, G3, G6 (logique), R4, E1, E2, F2 (taille) | ✅ vérifiés automatiquement (CI + tests contre l'URL publiée) |
| C1, C2, C3 (multi-touch) | ✅ en émulation Chromium ; ⏳ **à confirmer sur ton téléphone** |
| P2, P3, P5, C5, G4, G5, R1, R2, R3, R5, F1, F3 | ⏳ à vérifier sur appareil (`docs/TESTING.md`) |
| R6 (direction artistique) | ⏳ **ta validation**. Les sprites sont encore des maquettes programmatiques. |
| E3 (documentation) | ✅ |

Build initial : 400 Ko gzip de JavaScript, plus environ 150 Ko d'images. Mesure ponctuelle : ≈ 60 images/s avec 20 Rôdeurs (Chromium sur Mac, pas sur téléphone).

## 1. Accès et plateforme

| # | Critère | Vérif. |
|---|---|---|
| P1 | Le jeu se lance depuis l'URL GitHub Pages `https://erwannn007.github.io/waves_87764598/`, sans erreur console | [A] Playwright sur le build + [M] |
| P2 | Il fonctionne sur iPhone (Safari) et sur Android (Chrome), dans le navigateur et après ajout à l'écran d'accueil | [M] sur tes appareils |
| P3 | Paysage : affichage correct à l'encoche et aux zones de sécurité ; en portrait, message « Tourne ton téléphone » et pause | [M] |
| P4 | Mise à l'échelle par facteur entier : aucun pixel déformé ni flou (contrôle par capture d'écran) | [A] + [M] |
| P5 | Le son démarre après le premier toucher (contrainte iOS) | [M] |

## 2. Contrôles

| # | Critère | Vérif. |
|---|---|---|
| C1 | Joystick gauche : déplacement à 360°, vitesse proportionnelle, zone morte ≈ 15 % | [A] logique + [M] |
| C2 | Joystick droit : visée indépendante du déplacement ; le multi-touch fonctionne (deux pouces en même temps) | [M] |
| C3 | Tir (manuel et/ou auto-tir selon la décision prise) et bouton de rechargement, avec une cible tactile ≥ 44 pt | [M] |
| C4 | Clavier et souris : ZQSD/WASD, visée à la souris, clic pour tirer, R pour recharger | [A] + [M] |
| C5 | Aucun zoom, défilement ou geste de retour système déclenché pendant le jeu | [M] |

## 3. Combat minimal

| # | Critère | Vérif. |
|---|---|---|
| G1 | Arme lue depuis un fichier de données validé (dégâts, cadence, chargeur, rechargement, dispersion, portée) | [A] |
| G2 | Munitions décomptées ; tir impossible à vide ; rechargement à la durée exacte prévue par la donnée | [A] |
| G3 | Projectiles avec collision logique (cercles au sol), et non sur les pixels | [A] |
| G4 | Le Rôdeur poursuit le joueur, contourne les obstacles simples, attaque au contact, subit les impacts (flash + recul), peut être étourdi, meurt | [A] logique + [M] |
| G5 | Profondeur correcte : passer devant ou derrière une caisse ou un arbre ne produit pas de chevauchement incorrect | [M] + capture |
| G6 | 1 barricade destructible à 3 états (intact, endommagé, détruit) ; sa collision est mise à jour | [A] + [M] |

## 4. Art et animation

| # | Critère | Vérif. |
|---|---|---|
| R1 | Survivant : repos, marche, course, 8 directions, visée indépendante, tir + recul, rechargement, dégâts | [M] AnimationLab |
| R2 | Rôdeur : repos, déplacement, poursuite, attaque, impact, étourdissement, défaite | [M] AnimationLab |
| R3 | Écran **AnimationLab** : choix du personnage, de l'animation, de la direction et de la vitesse, image par image, comparaison côte à côte | [M] |
| R4 | Tous les sprites respectent la palette, l'alpha binaire, l'ancre et les dimensions constantes | [A] script de contrôle |
| R5 | Lisibilité : à bout de bras, on identifie joueur, ennemis, tirs et obstacles en moins d'une seconde | [M] |
| R6 | Direction artistique approuvée : proportions, perspective, couleurs, animations, effets | **[V]** |

## 5. Performances (iPhone et Android de milieu de gamme)

| # | Critère | Vérif. |
|---|---|---|
| F1 | 60 images/s stables avec 20 Rôdeurs et des tirs continus ; jamais sous 45 | [M] compteur intégré |
| F2 | Premier chargement < 5 s en 4G ; build initial < 3 Mo (gzip) | [A] taille + [M] |
| F3 | Pas de croissance mémoire continue sur 5 minutes de jeu (objets réutilisés via un pool) | [M] outils du navigateur |

## 6. Ingénierie

| # | Critère | Vérif. |
|---|---|---|
| E1 | `npm test`, `npm run build` et le workflow GitHub Actions réussissent | [A] |
| E2 | Ajouter une 2e arme ne demande qu'une entrée de données et un sprite | [A] test avec une arme factice |
| E3 | Documentation à jour : ROADMAP, ARCHITECTURE, DEPLOYMENT, KNOWN_LIMITATIONS | revue |

## Hors périmètre du prototype

Missions complètes, vagues multiples, construction libre, inventaire, fabrication, compétences, boutique, sauvegarde complète. Seuls les **paramètres** seront persistés, à titre de test du stockage.
