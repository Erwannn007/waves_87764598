# Déploiement — GitHub Pages

> **Statut : NON CONFIGURÉ, NON VÉRIFIÉ.** Le workflow de build sera ajouté au début de la Phase 2.
> Je n'ai pas accès aux réglages du dépôt (la CLI `gh` n'est pas installée), donc l'état ci-dessous est à confirmer par toi.

## Réglages à faire dans GitHub (par toi, une seule fois)

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
