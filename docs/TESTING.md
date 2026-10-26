# Tests

## Automatisés

| Commande | Contenu | Résultat (2026-10-26) |
|---|---|---|
| `npm run assets:check` | palette, alpha binaire, images vides ou rognées, tailles de texture, ancres | ✅ (a détecté puis fait corriger 9 images de défaite rognées) |
| `npm run typecheck` | TypeScript strict, sources et tests | ✅ |
| `npm test` | 29 tests Vitest : projection iso, collisions, arme (cadence, munitions, rechargement, dispersion, ajout d'une arme), navigation, destruction, validation des données, paramètres (absents, corrompus, version inconnue, stockage indisponible), cohérence du manifeste d'assets | ✅ 29/29 |
| `npm run test:e2e` | build de production servi sous `/waves_87764598/` ; **WebKit** (iPhone 14 paysage) et **Chromium** (Pixel 7 paysage) : chargement sans erreur ni 404, échelle entière, tap sur JOUER ; **Chromium** : double joystick multi-touch réel (déplacement + visée + tir) | ✅ 3 passés, 1 ignoré (le multi-touch scripté passe par un protocole propre à Chromium) |

Mesure ponctuelle (Chromium sur Mac, émulation Pixel 7) : **≈ 60 images/s avec 20 Rôdeurs**. Ce n'est pas une mesure sur téléphone.

> En local, si un proxy HTTP est défini, lancer les tests e2e avec `NO_PROXY=localhost,127.0.0.1`.

**Limites des tests automatisés.** L'émulation WebKit ne remplace pas un iPhone réel (Safari, encoche, geste de retour, audio, performances). Les vérifications ci-dessous restent indispensables.

## Vérifications manuelles sur téléphone

À faire sur l'URL publiée, puis après « Ajouter à l'écran d'accueil ».

### Lancement et affichage
- [ ] Le jeu se charge en moins de 5 s en 4G.
- [ ] En portrait, l'écran « Tourne ton téléphone » s'affiche ; en paysage, le jeu reprend.
- [ ] Rien d'important n'est caché par l'encoche, l'îlot dynamique ou la barre d'accueil.
- [ ] Les pixels sont nets, sans flou ni pixels de tailles inégales.
- [ ] Android : JOUER passe en plein écran. iPhone : le plein écran n'est obtenu qu'en lançant le jeu depuis l'écran d'accueil.

### Contrôles
- [ ] Le joystick gauche apparaît sous le pouce et déplace le survivant dans toutes les directions.
- [ ] Toucher la moitié droite vise sans tirer ; toucher **TIR** tire, et glisser depuis TIR vise en tirant.
- [ ] Les deux pouces fonctionnent en même temps.
- [ ] RECH. recharge ; un chargeur vide se recharge tout seul si on maintient le tir.
- [ ] AUTO:OUI → pousser le joystick de visée à fond tire automatiquement. **Lequel préfères-tu ?**
- [ ] Aucun zoom, défilement ou retour arrière déclenché par erreur.

### Lisibilité (à comparer avec le bouton TAILLE : 220 / 250 / 280 / 320)
- [ ] Le survivant, les Rôdeurs, les tirs et les obstacles se distinguent à bout de bras.
- [ ] La taille la plus confortable est : ___ (cela fixera la hauteur interne et la taille définitive des sprites).
- [ ] Passer derrière une voiture ou un arbre rend le décor transparent.

### Combat et sensations
- [ ] Le Rôdeur contourne les obstacles, attaque au contact, recule et clignote quand il est touché, est étourdi (étoiles) après plusieurs impacts, tombe puis disparaît.
- [ ] Les barricades (en bas de l'écran au départ) passent de intact à endommagé puis détruit, et laissent passer une fois détruites.
- [ ] Le son fonctionne (bouton silencieux de l'iPhone désactivé).
- [ ] Performances : avec FPS activé et +10 deux fois (20 Rôdeurs), l'animation reste fluide.

### Persistance des paramètres
- [ ] Changer AUTO et TAILLE, fermer puis rouvrir : les réglages sont conservés.
