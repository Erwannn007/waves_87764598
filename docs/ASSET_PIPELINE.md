# Pipeline de production des assets

- **Statut :** proposition (Phase 1). Le test de la méthode 1 a bien été réalisé, et ses résultats sont mesurés ci-dessous.
- **Outils :** `tools/art-lab/` (Node.js pur, aucune dépendance). Commande : `node tools/art-lab/build.mjs`

---

## 1. Ce qui a été testé

J'ai construit un **moteur de rendu « volumes → pixel art »** (`tools/art-lab/render.mjs`) :

- Les personnages sont des **squelettes paramétriques** (`models.mjs`) composés d'ellipsoïdes, de capsules, de boîtes et de cylindres.
- Le rendu se fait par **lancer de rayons orthographique**, un rayon par pixel, sans anticrénelage.
- L'ombrage est **quantifié sur des rampes de palette** de 4 tons. Le métal reçoit un reflet de 1 px. Les matériaux émissifs ignorent l'ombre.
- Un post-traitement ajoute **les contours** (noirs ou sélectifs, extérieurs et intérieurs) et **nettoie les pixels orphelins**.
- Les détails ponctuels (yeux, bouche) sont des **décalques** soumis à un test de profondeur.
- Les animations sont des **poses paramétriques** : phase de marche, recul, rechargement, impact, attaque, chute.
- Les sorties sont des PNG et des GIF animés. Les encodeurs sont écrits à la main (`encode.mjs`).

Production obtenue : 3 propositions, chacune avec une scène, une planche de sprites et 3 GIF. Survivant : 8 directions, repos, marche, course, tir, rechargement, dégâts, visée indépendante, strafe et tir en marchant. Rôdeur : repos, marche, poursuite, attaque, impact, étourdissement, défaite et 8 directions. Génération complète : **environ 16 s**.

## 2. Résultats honnêtes

### Ce que la méthode 1 fait bien

- **Cohérence parfaite** de la perspective, de la lumière et de la palette entre toutes les directions et toutes les images.
- **8 directions gratuites**, ainsi que la **visée indépendante du déplacement**, puisque le buste et les jambes sont des repères séparés.
- **Proportions et timing** : excellent outil de *blockout* (maquette en volumes) pour valider l'échelle, la vitesse de marche et la lisibilité avant de dessiner.
- **Décor simple** (caisses, barils, barrières, arbres) : résultat déjà correct, proche d'assets définitifs après une petite retouche.
- **Interface** (boutons, panneaux, barres, icônes, cartes) : **bon résultat**, la méthode programmatique convient pleinement.
- **Skins** : un échange de matériaux suffit (`palettes.mjs`). Une variante de couleur ne coûte rien.

### Ce qu'elle ne fait pas (constaté sur les planches)

- **Formes de mannequin** : ce sont des sphères et des capsules. Il n'y a ni plis de vêtements, ni doigts, ni bottes dessinées. Les mains sont des boules.
- **Visages génériques** : 1 à 3 pixels. La tête du Rôdeur est une sphère sans caractère : pas d'arcade, pas de mâchoire marquée, pas d'expression.
- **Animations rigides** : pas d'anticipation, de *smear* ni de squash & stretch. L'attaque du Rôdeur reste peu lisible malgré une amplitude augmentée.
- **Crénelage** : les diagonales et les courbes produisent des escaliers irréguliers qu'un pixel artiste nettoierait à la main.
- **Flash d'impact** : une silhouette blanche pleine, fonctionnelle mais brute.
- **La première version était illisible** : des proportions réalistes donnaient des jambes en allumettes et un visage caché par la casquette. Il a fallu styliser fortement, ce qui confirme qu'un œil artistique reste indispensable.

**Verdict : la méthode 1 seule ne satisfait pas l'exigence de personnages « détaillés, expressifs, de qualité professionnelle ».** Le résultat correspond à un bon prototype indépendant, pas à la direction artistique « exceptionnelle » visée.

### Test de retouche manuelle (méthode 3, hybride)

Le sprite de base est exporté dans un **format texte** (une lettre par couleur de palette : `assets-src/retouch/*.base.txt`), retouché pixel par pixel, puis réimporté (`survivant_SE_repos_A.txt`). Sur l'image `methode-1-comparaison.png`, on voit le visage dégagé, les yeux, la bouche, la fermeture éclair, un pli de manche et une mèche.

- Le gain est **réel mais modeste**, et cela demande de nombreuses éditions ciblées pour une seule image.
- **Ce mode de retouche (Claude qui édite une grille de texte) n'est pas viable pour 300 à 600 images par personnage.** Il est utile pour des corrections ponctuelles et des icônes, pas pour une production.

## 3. Comparaison des trois méthodes

| Critère | 1. Programmatique | 2. Dessin / génération externe | 3. **Hybride** |
|---|---|---|---|
| Qualité des personnages | Prototype | Meilleure possible | Bonne à très bonne |
| Cohérence | Parfaite | Dépend de la discipline | Très bonne (base commune) |
| Coût par personnage | Très faible | Élevé | Moyen |
| Animations | Gratuites mais rigides | Expressives, coûteuses | Base gratuite, poses clés retouchées |
| Qui fait le travail | Claude | Toi, un artiste ou un outil d'IA d'image externe | Claude (base, outils, intégration) + une passe artistique |
| Adapté à | UI, effets, décor simple, maquettes | Personnages, boss, illustrations | Production en série |

## 4. Pipeline recommandé (méthode 3)

```
  ┌─────────────────────┐   ┌──────────────────────┐   ┌───────────────────────┐
  │ 1. Maquette (Claude)│──▶│ 2. Passe artistique   │──▶│ 3. Contrôle + atlas   │
  │ rig → PNG par image │   │ éditeur pixel art     │   │ scripts (Claude)      │
  │ 8 dir. × animations │   │ sur les poses clés    │   │ palette, taille,      │
  │ (calque de référence)│  │ (calque de référence) │   │ ancres, images        │
  └─────────────────────┘   └──────────────────────┘   │ manquantes → atlas    │
                                                        └──────────┬────────────┘
                                                                   ▼
                                                        ┌───────────────────────┐
                                                        │ 4. Intégration jeu    │
                                                        │ JSON d'animation +    │
                                                        │ AnimationLab, test    │
                                                        └───────────────────────┘
```

1. **Maquette** : Claude rend chaque personnage en 8 directions et toutes ses animations, à la taille finale, avec la palette finale. Le résultat sert de **calque de référence** : proportions, perspective et timing sont déjà justes.
2. **Passe artistique** : dans un éditeur pixel art, on redessine **par-dessus** la maquette, en priorité sur les **poses clés** (contacts de marche, image d'impact, pic d'attaque) et le **visage**. Options, par ordre de qualité/coût :
   - a. **Toi**, dans **Aseprite** (payant, ~20 €, standard du secteur, prévisualisation de l'animation) ou **Pixelorama** / **LibreSprite** (gratuits).
   - b. **Générateur d'images IA externe**, à partir de la maquette, puis nettoyage. Attention : le résultat est rarement fidèle à la palette et à la grille de pixels, donc il faut toujours repasser derrière. Vérifie aussi les conditions d'utilisation de l'outil.
   - c. **Commande à un pixel artiste** : budget et délai à prévoir.
   - d. **Repli** : investir davantage dans la méthode 1 (membres effilés, vêtements en couches, visages dessinés à la main par direction en tampons de 8×8, images de *smear* ajoutées en effets). On gagnerait en qualité, mais on resterait en deçà d'un rendu dessiné.
3. **Contrôle automatique** (scripts à écrire en Phase 2) :
   - les couleurs appartiennent à la palette figée ;
   - l'alpha est binaire (0 ou 255) ;
   - les dimensions et le point d'ancrage sont constants pour une même animation ;
   - aucune image ni direction ne manque par rapport à la fiche de l'asset ;
   - une marge transparente est présente ;
   - aperçu GIF généré automatiquement.
4. **Atlas** : empaquetage en atlas ≤ 2048×2048 avec JSON Phaser, généré par script. Les sources (`assets-src/`) ne sont jamais servies au navigateur.

## 5. Arborescence et nommage proposés

```
assets-src/                         # sources, non publiées dans le jeu
  characters/survivor/
    survivor.asset.json             # fiche normalisée (voir ASSET_CATALOG.md)
    blockout/                       # rendus de maquette (générés)
    art/<anim>_<dir>_<nn>.png       # images retouchées (une image par fichier)
  enemies/rodeur/…
  props/…
  ui/…
  retouch/                          # format texte pour petites retouches
public/assets/atlas/                # atlas générés (servis au navigateur)
tools/art-lab/                      # rendu de maquettes et planches
tools/assets/                       # contrôles et empaquetage (Phase 2)
```

Nommage : `<id>_<animation>_<direction>_<image>.png`, par exemple `survivor_walk_SE_03.png`, en minuscules sans accents. Les directions s'écrivent en majuscules : `S SE E NE N NW W SW`.

## 7. Pipeline hybride opérationnel (Phase 2)

Commande : `npm run assets` (export) et `npm run assets:check` (contrôle). Les deux s'exécutent automatiquement avant chaque build et en CI.

1. **Maquettes :** `npm run art:blockout` écrit chaque image de maquette dans `assets-src/characters/<feuille>/blockout/<anim>_<DIR>_<nn>.png`. Les feuilles sont `survivor_legs`, `survivor_upper` et `rodeur`. Ces fichiers ne sont pas versionnés, car ils se régénèrent.
2. **Retouche :** on copie une image dans `assets-src/characters/<feuille>/art/` sous **le même nom** et on la redessine dans un éditeur pixel art, à la même taille de cadre, au même point d'ancrage et avec la palette Cendres.
3. **Remplacement automatique :** à l'export suivant, l'image retouchée **remplace** la maquette dans la feuille. L'export indique le nombre d'images retouchées. Aucune modification du code du jeu n'est nécessaire.
4. **Contrôle :** `assets:check` refuse les couleurs hors palette, l'alpha non binaire, les images vides et les sprites qui touchent le bord du cadre (rognés).

Cadres actuels (hypothèse ~40 px, **non figés**) : survivant 76×60 (ancre 38,54), Rôdeur 112×80 (ancre 56,52), tuiles 64×32.

## 6. Ce que je recommande de décider maintenant

1. **Méthode des personnages :** hybride 2a (toi dans un éditeur sur la maquette), 2b (IA externe + nettoyage), 2c (artiste) ou 2d (programmatique poussé, qualité plafonnée).
2. **Pour le prototype de la Phase 2**, je propose de livrer d'abord **la version programmatique améliorée (2d)**, jouable immédiatement sur téléphone. Elle permet de valider le jeu (contrôles, échelle, lisibilité) pendant que la passe artistique se prépare. Comme le format d'échange est identique, remplacer les images ensuite ne demande **aucune modification du code du jeu**.
