# Déploiement — GitHub Pages

> **Statut (vérifié le 2026-10-26) :**
> - Le workflow `.github/workflows/deploy.yml` **réussit** : assets, contrôle, typecheck, tests unitaires, build, tests e2e WebKit et Chromium, publication.
> - `https://erwannn007.github.io/waves_87764598/` sert le **build de production**. Les tests e2e passent **contre l'URL publiée** (`E2E_BASE_URL=… npx playwright test`).
> - ✅ Source Pages basculée sur **GitHub Actions** (2026-10-26). Depuis le commit `b4f016a`, le déploiement Jekyll ne tourne plus. Auparavant, il publiait par intermittence le `index.html` source.

## Réglages GitHub (faits le 2026-10-26)

1. Ouvre `https://github.com/Erwannn007/waves_87764598/settings/pages`.
2. **Build and deployment → Source** : choisis **GitHub Actions** (et non « Deploy from a branch »).
3. Rien d'autre à configurer : pas de domaine personnalisé, et « Enforce HTTPS » est actif par défaut.
4. Si le dépôt est **privé**, GitHub Pages exige un compte payant (GitHub Pro ou équivalent). Sur un compte gratuit, le dépôt doit être **public**.
5. Dis-moi quand c'est fait. Je vérifierai que l'URL répond après le premier déploiement.

## Fonctionnement prévu (Phase 2)

- Fichier `.github/workflows/deploy.yml` : déclenché à chaque push sur `main`. Il exécute `npm ci`, `npm test`, `npm run build`, puis publie `dist/` via `actions/upload-pages-artifact` et `actions/deploy-pages`.
- Vite est configuré avec `base: '/waves_87764598/'` : tous les chemins d'assets sont préfixés. C'est indispensable, car le site est servi dans un sous-répertoire.
- Les fichiers compilés ne sont **jamais commités** (`dist/` est dans `.gitignore`).

## URL attendue

`https://erwannn007.github.io/waves_87764598/`

## Vérifications après chaque déploiement

- [ ] L'onglet **Actions** du dépôt montre le workflow en vert.
- [ ] L'URL charge le jeu, sans erreur 404 sur les assets (console du navigateur).
- [ ] Sur téléphone, le rafraîchissement charge la nouvelle version (cache du service worker, à partir de la Phase 2).
