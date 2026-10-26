# Catalogue des assets

Statuts : `maquette` (générée, provisoire) · `en-cours` (passe artistique) · `à-valider` · `approuvé` · `rejeté`

**Aucun asset n'est approuvé à ce jour.** Tout ce qui suit est au stade `maquette`.

## 1. Fiche normalisée

Chaque asset aura une fiche `<id>.asset.json` à côté de ses sources dans `assets-src/`. Elle sera validée par un schéma Zod en Phase 2.

```jsonc
{
  "id": "enemy.rodeur",                 // unique, stable, minuscules
  "category": "enemy",                  // character | enemy | weapon | projectile | fx | prop | tile | structure | ui | icon
  "name": "Rôdeur",
  "status": "maquette",                 // voir statuts ci-dessus
  "source": {
    "method": "procedural",             // procedural | hybrid | hand | external
    "reference": "tools/art-lab/models.mjs#shambler",
    "author": "Claude Code",
    "license": "original"               // ou licence exacte + lien si externe
  },
  "native": { "frameW": 0, "frameH": 0 },   // fixé après le prototype
  "anchor": { "x": 0.5, "y": 0.9 },          // fraction du cadre : point de contact au sol
  "perspective": "3/4",                      // 3/4 | iso2:1 | flat (UI)
  "palette": "tempete",
  "directions": ["S","SE","E","NE","N","NW","W","SW"],
  "mirror": false,
  "animations": {
    "walk": { "frames": 8, "frameMs": 100, "loop": true },
    "death": { "frames": 8, "frameMs": 100, "loop": false, "holdLast": true }
  },
  "layers": ["legs", "torso"],               // optionnel : haut/bas du corps séparés
  "collision": { "shape": "circle", "radius": 0.3 },   // en mètres, au sol — indépendant du sprite
  "depth": { "sortBy": "groundY", "heightM": 1.6 },
  "shadow": { "type": "contact", "rx": 0.35, "ry": 0.16 },
  "states": null,                            // structures destructibles : ["intact","damaged","destroyed"]
  "notes": ""
}
```

Règles :

- La **collision** et la **profondeur** sont des données de jeu en mètres. Elles ne dépendent jamais des pixels transparents.
- L'**ancre** est toujours le point de contact au sol. Pour un objet large (barricade), c'est le centre de son empreinte.
- Une fiche `approuvé` ne change plus sans nouvelle validation. Toute modification la repasse en `à-valider`.

## 2. Inventaire actuel

| id | Catégorie | Nom | Méthode | Statut | Fichiers |
|---|---|---|---|---|---|
| `character.survivor` | character | Survivant (orange, casquette teal à l'envers, sac à dos) | procedural | maquette | `tools/art-lab/models.mjs#survivor`, planches A, B, C |
| `character.survivor.retouch-test` | character | Survivant SE, retouche manuelle (test) | hybrid | maquette | `assets-src/retouch/survivant_SE_repos_A.txt` |
| `enemy.rodeur` | enemy | Rôdeur (standard) | procedural | maquette | `models.mjs#shambler` |
| `weapon.ar.basic` | weapon | Fusil d'assaut (porté) | procedural | maquette | intégré au survivant |
| `fx.muzzle`, `fx.tracer`, `fx.spark`, `fx.stun` | fx | Flash, traceur, étincelles, étoiles | procedural | maquette | `build.mjs` |
| `prop.crate`, `prop.barrel`, `prop.jersey`, `prop.barricade.wood`, `prop.tree`, `prop.lamp` | prop | Décor de la scène | procedural | maquette | `models.mjs` |
| `tile.asphalt`, `tile.sidewalk`, `tile.grass` | tile | Sols | procedural | maquette | `build.mjs#groundFn` |
| `ui.kit.v0` | ui | Panneau, boutons, barres, joysticks, cartes, icônes | procedural | maquette | `tools/art-lab/ui.mjs` |

## 3. Assets prévus pour le prototype (Phase 2)

Survivant (complet), Rôdeur (complet), 1 fusil d'assaut, effets de tir et d'impact, 3 tuiles de sol, 5 à 6 objets de décor dont 1 destructible à 3 états (barricade), HUD provisoire.
