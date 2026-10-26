# Architecture technique (prototype de la Phase 2)

Stack : **Phaser 4.2.1**, **TypeScript 7**, **Vite 8**, **Zod 4** (validation des données), **Vitest 5** et **Playwright 1.64** (tests). Aucun service distant.

## Vue d'ensemble

```
tools/art-lab/export.mjs ──► public/assets/gen/ (sprites, tuiles, décor, police, assets.json)
        ▲                              │
assets-src/characters/*/art/*.png      ▼ (chargés par BootScene)
(retouches manuelles, prioritaires)   src/
                                        main.ts           configuration Phaser + mise à l'échelle
                                        core/             iso, écran, paramètres, sons, types d'assets
                                        sim/              logique pure, testée (collisions, arme, navigation, destruction)
                                        data/             JSON (armes, ennemis, carte) + schémas Zod
                                        game/             entités (Player, Rodeur), World, Effects, état des contrôles
                                        scenes/           Boot, Menu, Game, Hud, AnimLab
                                        ui/               thème et widgets pixel art
```

## Séparation logique / affichage (iso)

| Notion | Où | Unité |
|---|---|---|
| Position logique au sol | `x, y` des entités | mètres |
| Empreinte de collision | `Collider` (cercle ou rectangle aligné) | mètres |
| Position d'affichage | `toScreen(x, y, z)` (`core/iso.ts`) | pixels internes |
| Profondeur de rendu | `depthOf(x, y)` = ordonnée écran des pieds | pixels |
| Hauteur visuelle | dans le sprite, à partir de l'**ancre** (point de contact au sol) | pixels |

- Une tuile mesure 1,5 m, soit **64×32 px** : `PPU ≈ 30,17 px/m`, et un survivant de 1,55 m fait ≈ 40 px.
- Les collisions **ne regardent jamais les pixels**. Les balles sont testées comme des segments contre des cercles et des rectangles (`sim/collision.ts`).
- **Les directions de l'écran et celles du monde sont distinctes.** Le joystick donne une direction à l'écran, que `screenDirToWorld` convertit en direction au sol. `dirIndex` choisit l'une des 8 directions de sprite.
- Les grands décors (voiture, arbre, lampadaire) deviennent semi-transparents quand le joueur passe derrière.

## Données

- `src/data/weapons.json`, `enemies.json` et `map.json` sont validés par Zod (`data/schemas.ts`) au démarrage. Une erreur s'affiche à l'écran avec le champ fautif.
- **Ajouter une arme = ajouter une entrée JSON** : le moteur de combat ne connaît aucune arme en particulier (testé dans `tests/weapon.test.ts`).
- La carte est une grille de caractères (légende → type de tuile), complétée par une liste de décors en mètres. Un décor avec `hp` est une **structure destructible** à 3 états.

## Personnages

- Le survivant tient sur **deux feuilles** : `survivor_legs` (orientées selon le déplacement : repos, marche, course) et `survivor_upper` (orientées selon la visée : repos, tir, rechargement, dégâts). Le buste suit le rebond des hanches grâce au tableau `bob` du manifeste. 8 × 8 combinaisons sont ainsi possibles sans dessiner 64 versions.
- Le Rôdeur est un automate à états : `chase` → `attack` (préparation, puis coup) / `hit` / `stun` (seuil de déséquilibre) / `dead` (chute, puis dissolution par paliers).
- Navigation (`sim/flowfield.ts`) : un parcours en largeur sur une grille de 0,5 m depuis le joueur, recalculé quand le joueur change de case ou qu'une barricade casse. La ligne de vue directe est préférée quand elle est libre.

## Contrôles

- `HudScene` gère le multi-touch : joystick gauche **dynamique** (il apparaît sous le pouce), visée sur la moitié droite, et **bouton TIR qui sert aussi de joystick de visée**. On tire et on vise avec le même pouce, ce qui rend le tir manuel praticable sur téléphone.
- Auto-tir (option) : pousser le joystick de visée au-delà de 70 % déclenche le tir.
- Clavier et souris : ZQSD/WASD et flèches, Maj pour courir, souris pour viser et tirer, R pour recharger.
- L'état est partagé via `game/controls.ts`. `GameScene` fusionne le tactile, le clavier et la souris.

## Rendu et écran

- `pixelArt: true`, `roundPixels: true`. La **hauteur interne** visée est réglable (220, 250, 280 ou 320 : le bouton « TAILLE »). La largeur suit le format de l'écran.
- `core/screen.ts` choisit un facteur **entier** de pixels physiques par pixel interne, et convertit les zones de sécurité CSS (`env(safe-area-inset-*)`) en pixels internes.
- Les effets (particules en pool, traceurs, flash de bouche, étoiles) sont en pixels pleins (`game/Effects.ts`).

## Sons

Les sons sont synthétisés en WebAudio (`core/sfx.ts`), sans aucun fichier. Le contexte audio est déverrouillé au premier toucher (exigence iOS). La vibration ne fonctionne que sur Android.

## Persistance

Le prototype ne sauvegarde que les **paramètres** (`core/settings.ts`) :

- version de schéma et validation Zod ;
- données corrompues **conservées à part**, jamais écrasées ;
- stockage indisponible géré sans plantage.

La sauvegarde de progression (IndexedDB, migrations, export/import) est prévue en Phase 8.

## Hooks de test

`window.__game` (instance Phaser) et `window.__waves` (scène de jeu) servent aux tests Playwright et au débogage.
