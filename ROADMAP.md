# ROADMAP

Statuts : 🟦 proposé · 🟨 en cours · ✅ terminé · 🟥 bloqué

Référence : [`docs/PROMPT_MAITRE.md`](docs/PROMPT_MAITRE.md) · Audit : [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md)

## Décisions en attente

| # | Décision | Bloque |
|---|---|---|
| D1 | Stack : Phaser + TypeScript + Vite (+ Vitest, Playwright, Zod, IndexedDB, vite-plugin-pwa) | Phase 1+ |
| D2 | Déploiement via GitHub Actions (réglage Pages → Source : GitHub Actions) | Phase 2 |
| D3 | Nom du dépôt et URL définitive | Installation PWA |
| D4 | Orientation : paysage seul ou paysage et portrait | Phase 1 |
| D5 | Outil de dessin des personnages (si la génération par code est insuffisante) | Phase 2 |
| D6 | Squelette technique et déploiement avancés en Phase 2 | Phase 2 |
| D7 | Nom du jeu | Phase 1 (identité visuelle) |

## Phases

### Phase 0 — Audit · 🟨 en attente d'approbation
- ✅ Inspection du dépôt
- ✅ Rapport `docs/PROJECT_AUDIT.md`
- ✅ Roadmap, `CLAUDE.md`, prompt maître versionné
- **Acceptation :** décisions D1 à D7 tranchées.

### Phase 1 — Bible artistique et design system · 🟦
- 🟦 `docs/ART_BIBLE.md` avec variantes (projection, échelle, résolution interne, contours, palette)
- 🟦 `docs/DESIGN_SYSTEM.md`
- 🟦 `docs/ASSET_CATALOG.md` + fiche normalisée d'asset
- 🟦 Planche de référence (survivant, zombie, arme, sol, décor)
- **Dépend de :** Phase 0
- **Acceptation :** une variante validée ; dimensions et conventions figées par écrit.

### Phase 2 — Prototype artistique et technique · 🟦
- 🟦 Squelette Vite + TypeScript + Phaser, workflow Pages, manifeste PWA minimal
- 🟦 Pipeline d'assets (contrôles + atlas)
- 🟦 Survivant animé (repos, marche, course, 8 directions, visée indépendante, tir, recul, rechargement, dégâts)
- 🟦 Zombie de référence animé (repos, marche, poursuite, attaque, impact, étourdissement, défaite)
- 🟦 Arme, tir, effets d'impact, ombres, décor
- 🟦 Écran AnimationLab
- **Dépend de :** Phase 1
- **Acceptation :** jouable depuis l'URL publiée sur un vrai téléphone, sans erreur console ; validation artistique explicite.

### Phase 3 — Moteur · 🟦
Rendu iso (sol / affichage / profondeur / collisions séparés), caméra, input clavier/souris + double joystick, données JSON + Zod.
- **Acceptation :** tests unitaires de la projection et des collisions ; contrôles validés sur téléphone.

### Phase 4 — Combat, armes, ennemis, missions · 🟦
- **Acceptation :** boucle complète mission → vagues → victoire/défaite → récompense ; tests des dégâts, des munitions, du rechargement et des vagues.

### Phase 5 — Construction et destruction partielle · 🟦
- **Acceptation :** placement validé par collisions ; états intact / endommagé / détruit qui mettent à jour la collision.

### Phase 6 — Progression, fabrication, compétences, boutique, skins · 🟦
- **Acceptation :** transactions atomiques testées ; effets de compétences mesurables en jeu.

### Phase 7 — Interface finale et mobile · 🟦
- **Acceptation :** tous les écrans conformes au design system ; zones de sécurité et tailles tactiles vérifiées.

### Phase 8 — Sauvegarde, PWA, GitHub Pages · 🟦
- **Acceptation :** schéma versionné + migrations testées ; données corrompues gérées ; installation sur l'écran d'accueil testée sur iOS et Android.

### Phase 9 — Tests, équilibrage, optimisation · 🟦

## Problèmes connus
- La CLI `gh` n'est pas installée : les réglages GitHub Pages du dépôt n'ont pas pu être vérifiés.
