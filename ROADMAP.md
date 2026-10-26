# ROADMAP

Statuts : 🟦 proposé · 🟨 en cours · ✅ terminé · 🟥 bloqué · ⏸️ en attente de validation

Référence : [`docs/PROMPT_MAITRE.md`](docs/PROMPT_MAITRE.md) · Audit : [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md)

## Décisions prises

| # | Décision | Date |
|---|---|---|
| D1 | Stack : Phaser + TypeScript + Vite ; Vitest, Playwright et Zod si l'usage le justifie | 2026-10-26 |
| D2 | Déploiement via GitHub Actions → GitHub Pages (réglage côté GitHub **non vérifié**, voir `docs/DEPLOYMENT.md`) | 2026-10-26 |
| D3 | Le dépôt et l'URL restent `waves_87764598` ; la sauvegarde doit être versionnée et exportable/importable avant d'être déclarée fiable | 2026-10-26 |
| D4 | Paysage en priorité, avec gestion propre de l'orientation et des limites iOS | 2026-10-26 |
| D5 | Nom provisoire : « Waves » | 2026-10-26 |
| D6 | Déploiement dès la Phase 2 pour tester le prototype sur téléphone | 2026-10-26 |

## Décisions en attente (Phase 1 → 2)

| # | Décision | Recommandation | Bloque |
|---|---|---|---|
| A1 | Projection : 3/4 orthogonal ou iso 2:1 | 3/4 orthogonal | Phase 2 |
| A2 | Échelle : hauteur du personnage et résolution interne | ~44–48 px, ~300 px de haut, à confirmer sur téléphone | figeage des dimensions |
| A3 | Contour : noir ou sélectif | sélectif si ≥ 44 px | Phase 2 |
| A4 | Palette : Tempête ou Cendres | Tempête | Phase 2 |
| A5 | Méthode de production des personnages (2a toi + éditeur, 2b IA externe, 2c artiste, 2d programmatique poussé) | hybride ; prototype livré d'abord en 2d | production en série |
| A6 | Haut et bas du corps séparés ; miroir des directions | séparés ; pas de miroir tant que le programmatique suffit | Phase 2 |
| A7 | Auto-tir au joystick droit ou bouton de tir seul | auto-tir + bouton, à tester | Phase 2 |
| A8 | Police : bitmap maison ou police OFL convertie | bitmap maison | Phase 7 |

## Phases

### Phase 0 — Audit · ✅
- ✅ Inspection, rapport, roadmap, `CLAUDE.md`, prompt maître versionné, décisions D1 à D6

### Phase 1 — Bible artistique et design system · ⏸️ en attente de validation
- ✅ `docs/ART_BIBLE.md` (perspective, échelle, lumière, contours, palette, matériaux, effets, transparence, lisibilité, animation, bestiaire)
- ✅ `docs/DESIGN_SYSTEM.md` (jetons, typographie, composants, états, tactile, HUD)
- ✅ `docs/ASSET_PIPELINE.md` (test honnête des 3 méthodes, pipeline recommandé)
- ✅ `docs/ASSET_CATALOG.md` (fiche normalisée + inventaire)
- ✅ `docs/PROTOTYPE_ACCEPTANCE.md` (critères de la Phase 2)
- ✅ `docs/DEPLOYMENT.md` (réglages GitHub à effectuer)
- ✅ Planches : 3 propositions (scène, HUD, sprites, GIF), UI, palettes, comparaison des méthodes → [`docs/art/phase1/`](docs/art/phase1/README.md)
- ✅ Outils : `tools/art-lab/` (rendu volumes → pixel, encodeurs PNG/GIF, kit UI)
- **Acceptation :** décisions A1 à A6 tranchées par toi.

### Phase 2 — Prototype artistique et technique · 🟦
- 🟦 Squelette Vite + TypeScript + Phaser, `base` GitHub Pages, workflow Actions, manifeste PWA minimal
- 🟦 Écran d'orientation, zones de sécurité, mise à l'échelle par facteur entier
- 🟦 Scripts de contrôle des sprites et de génération d'atlas
- 🟦 Survivant et Rôdeur complets selon la direction validée ; fusil d'assaut ; effets
- 🟦 Double joystick et clavier/souris, combat minimal, barricade destructible à 3 états
- 🟦 Écran AnimationLab
- **Acceptation :** `docs/PROTOTYPE_ACCEPTANCE.md`

### Phases 3 à 9 · 🟦
Voir `docs/PROJECT_AUDIT.md` § 8 et `docs/PROMPT_MAITRE.md` § 16.

## Problèmes connus
- La CLI `gh` n'est pas installée : les réglages GitHub Pages n'ont pas été vérifiés.
- Méthode programmatique : formes de mannequin, visages génériques, animations rigides (détails dans `docs/ASSET_PIPELINE.md` § 2).
- Les boutons des planches UI sont trop petits pour le tactile (à agrandir, voir `docs/DESIGN_SYSTEM.md` § 7).
- La police 3×5 des planches n'a ni minuscules ni accents.
