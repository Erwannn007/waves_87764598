# Waves

Jeu solo de survie et d'action en pixel art **isométrique 2:1**, jouable dans le navigateur (ordinateur, iOS, Android) et installable comme PWA.

**▶ Prototype jouable : https://erwannn007.github.io/waves_87764598/** (paysage ; sur iPhone : Partager → « Sur l'écran d'accueil » pour le plein écran)

**Statut :** Phase 2, prototype 0.2. Une zone jouable, un survivant, un Rôdeur, une arme. Les sprites sont encore des maquettes du pipeline hybride.

## Commandes

```bash
npm install
npm run dev            # serveur local (régénère les assets) → http://localhost:5173/waves_87764598/
npm run dev -- --host  # accessible depuis un téléphone sur le même réseau
npm test               # tests unitaires (Vitest)
npm run build          # assets + contrôle + build de production dans dist/
npm run test:e2e       # tests navigateur sur le build (WebKit iPhone, Chromium Android)
npm run assets         # export des sprites, tuiles, décor (public/assets/gen/)
npm run art:blockout   # exporte aussi chaque image de maquette, à retoucher
npm run art:boards     # régénère les planches de la Phase 1
```

Le déploiement est automatique à chaque push sur `main` (GitHub Actions).

## Documentation
- Avancement et décisions : [`ROADMAP.md`](ROADMAP.md)
- Cahier des charges : [`docs/PROMPT_MAITRE.md`](docs/PROMPT_MAITRE.md)
- Bible artistique : [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md) · Design system : [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- Pipeline d'assets : [`docs/ASSET_PIPELINE.md`](docs/ASSET_PIPELINE.md) · Catalogue : [`docs/ASSET_CATALOG.md`](docs/ASSET_CATALOG.md)
- Architecture : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · Tests : [`docs/TESTING.md`](docs/TESTING.md) · Limites : [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md)
- Critères du prototype : [`docs/PROTOTYPE_ACCEPTANCE.md`](docs/PROTOTYPE_ACCEPTANCE.md) · Déploiement : [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- Propositions visuelles de la Phase 1 : [`docs/art/phase1/`](docs/art/phase1/README.md)
