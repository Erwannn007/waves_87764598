# ROADMAP

Statuts : 🟦 proposé · 🟨 en cours · ✅ terminé · 🟥 bloqué · ⏸️ en attente de validation

Référence : [`docs/PROMPT_MAITRE.md`](docs/PROMPT_MAITRE.md) · Audit : [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md)

## Décisions prises

| # | Décision | Date |
|---|---|---|
| D1 | Stack : Phaser + TypeScript + Vite ; Vitest, Playwright, Zod | 2026-10-26 |
| D2 | Déploiement via GitHub Actions → GitHub Pages | 2026-10-26 |
| D3 | Le dépôt et l'URL restent `waves_87764598` ; sauvegarde versionnée et exportable/importable exigée avant de la déclarer fiable | 2026-10-26 |
| D4 | Paysage en priorité, avec gestion de l'orientation et des limites iOS | 2026-10-26 |
| D5 | Nom provisoire : « Waves » | 2026-10-26 |
| D6 | Déploiement dès la Phase 2 pour tester sur téléphone | 2026-10-26 |
| A1 | **Perspective isométrique 2:1, sol en losanges** (proposition B) ; pas de retour au 3/4 pour la direction principale | 2026-10-26 |
| A4 | **Palette Cendres** (sombre, désaturée ; Rôdeurs verdâtres) | 2026-10-26 |
| A2′ | **~40 px** comme hypothèse de départ ; taille définitive après test de lisibilité sur téléphone | 2026-10-26 |
| A5 | **Pipeline hybride** : de vrais sprites expressifs, pas seulement générés par code | 2026-10-26 |
| A7′ | Tir **manuel** + option **auto-tir** à tester | 2026-10-26 |
| T1 | Phaser **4.2.1** (version stable actuelle), TypeScript 7, Vite 8 | 2026-10-26 |

## Décisions en attente

| # | Décision | Comment trancher |
|---|---|---|
| A2 | Hauteur interne et taille définitive des sprites | Bouton TAILLE (220 / 250 / 280 / 320) sur ton téléphone |
| A7 | Tir manuel (TIR = joystick) ou auto-tir comme mode par défaut | Essai en jeu (bouton AUTO) |
| A5′ | Qui réalise la passe artistique (toi dans un éditeur, IA externe, artiste) | Voir `docs/ASSET_PIPELINE.md` § 2 à 4 |
| A6 | Miroir des directions (économise 3 directions sur 8 en dessin manuel) | Selon la méthode retenue en A5′ |
| A8 | Police : bitmap maison avec accents ou police OFL | Phase 7 |

## Phases

### Phase 0 — Audit · ✅
### Phase 1 — Bible artistique et design system · ✅ (direction B choisie)

### Phase 2 — Prototype artistique et technique · ⏸️ en attente de ton retour sur téléphone
- ✅ Squelette Vite + TypeScript + Phaser 4, `base` GitHub Pages, workflow Actions, manifeste PWA et icônes
- ✅ Mise à l'échelle par facteur entier, hauteur interne réglable, zones de sécurité, écran d'orientation, plein écran Android
- ✅ Export d'assets iso : survivant en 2 calques (296 images), Rôdeur (232), tuiles 64×32, 13 décors + ombres, police, icônes
- ✅ Remplacement par images retouchées (pipeline hybride) et contrôle automatique des assets
- ✅ Carte « Carrefour » (22×22 tuiles), collisions logiques, tri de profondeur, transparence des décors masquants
- ✅ Survivant : déplacement libre, visée indépendante, fusil piloté par les données, tir, recul, rechargement, dégâts
- ✅ Rôdeur : navigation (champ de flux), attaque, impacts, recul, étourdissement, défaite, dissolution, réapparition
- ✅ 3 barricades destructibles à 3 états (collision et navigation mises à jour)
- ✅ Effets (traceurs, flash, étincelles, projections, douilles, étoiles), sons synthétisés, caméra amortie
- ✅ Double joystick dynamique, TIR-joystick, auto-tir optionnel, clavier et souris
- ✅ AnimationLab (personnage, animation, 8 directions, vitesse, image par image)
- ✅ Tests : 29 unitaires, e2e WebKit et Chromium en CI et contre l'URL publiée
- 🟨 Passe artistique hybride : non commencée (les sprites sont des maquettes)
- ⏳ Vérifications sur téléphone réel (`docs/TESTING.md`)
- **Acceptation :** `docs/PROTOTYPE_ACCEPTANCE.md` (état détaillé dans ce fichier)

### Phase 3 — Moteur · 🟦
Consolider à partir du prototype : chargement de plusieurs cartes, tuiles de raccord, éditeur de carte en données, tri de profondeur des objets longs, pooling étendu.

### Phases 4 à 9 · 🟦
Voir `docs/PROJECT_AUDIT.md` § 8 et `docs/PROMPT_MAITRE.md` § 16.

## Problèmes connus
Voir [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md).
