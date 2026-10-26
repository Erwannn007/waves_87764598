# Bible artistique — Waves

- **Version :** 0.1 (Phase 1)
- **Statut : PROPOSITION, en attente de validation.** Les sections marquées 🔒 seront figées après validation du prototype (Phase 2). Avant cela, tout est révisable.
- **Planches de référence :** [`docs/art/phase1/`](art/phase1/README.md)

---

## 1. Intention

**Pixel art détaillé, pseudo-isométrique, lisible sur téléphone.** Des survivants colorés et reconnaissables face à des hordes sombres marquées par une énergie violette (la « Tempête »).

Le ton visé : de l'action énergique et un peu cartoon, pas du survival horror réaliste. Les ennemis sont inquiétants par leur silhouette et leur lumière, pas par le gore.

Trois piliers :

1. **Lisibilité d'abord.** En moins de 200 ms, on doit distinguer le joueur, les ennemis, les projectiles et les obstacles, même sur un écran de 6 pouces en plein combat.
2. **Une seule lumière, une seule perspective.** Tout ce qui est à l'écran partage la même direction de lumière, le même angle de caméra et la même famille de contours.
3. **Des silhouettes qui racontent.** Chaque famille d'ennemis se reconnaît en ombre chinoise. Chaque arme se reconnaît à sa forme, pas seulement à sa couleur.

## 2. Perspective et caméra

### 2.1 Les deux projections testées

| | 3/4 orthogonal (propositions A et C) | Isométrique 2:1 (proposition B) |
|---|---|---|
| Sol | Grille droite, profondeur écrasée (inclinaison de la caméra d'environ 42°, facteur vertical ≈ 0,67) | Grille en losanges 2:1 (inclinaison de 30°, rotation de 45°) |
| Bâtiments | On voit la façade avant et le toit | On voit deux façades et le toit |
| Déplacement libre + visée à 360° | **Naturel** : haut de l'écran = nord | Les 8 directions de l'écran ne suivent pas les axes de la grille, ce qui demande plus de réflexion pour les constructions |
| Placement de barricades | Grille droite, simple | Grille en losanges : plus « jeu de stratégie », plus complexe à lire au doigt |
| Production d'assets | Plus simple : façades de face | Chaque objet doit être dessiné en diagonale |
| Rendu | Plus « shooter vu de dessus » | Plus « diorama », plus riche en volume |

**Recommandation : 3/4 orthogonal.** C'est le meilleur compromis pour un shooter à double joystick avec un système de construction. L'iso 2:1 est plus beau en image fixe, mais il coûte plus cher en production et rend les contrôles et le placement moins lisibles.

### 2.2 Perspective « trichée » des personnages (proposée)

Le décor est vu sous environ 42° et les personnages sous environ 35°, donc un peu plus de face. Le visage et l'arme restent ainsi visibles sans écraser le sol. C'est une convention classique du pixel art vue de dessus. Les planches A et C l'appliquent déjà.

### 2.3 Directions 🔒

- **8 directions d'affichage** pour les personnages : S, SE, E, NE, N, NO, O, SO.
- Le déplacement et la visée restent **continus** (angles libres). Seul l'affichage est arrondi au 45° le plus proche.
- **Haut et bas du corps séparés** quand la production sera dessinée : jambes orientées selon le déplacement, buste et arme selon la visée. Les planches montrent la combinaison « marche N, visée E ».
- **Miroir** (O = E retourné) : à décider. Le miroir économise 3 directions sur 8 en dessin manuel, mais il fait passer l'arme dans l'autre main. Avec la méthode programmatique, les 8 directions ne coûtent rien.

## 3. Échelle 🔒 (à valider au prototype)

| | A | B | C |
|---|---|---|---|
| Hauteur du survivant | ~34 px | ~40 px | ~56 px |
| Résolution interne de référence | 480×270 | 480×270 | 640×360 |
| Largeur de monde visible | ~18 m | ~16 m | ~14,5 m |
| Taille physique sur iPhone en paysage* | ~8 mm | ~9,5 mm | ~10 mm |

\* Estimée pour un écran d'environ 64 mm de haut en paysage. **À mesurer sur ton téléphone** pendant la Phase 2.

**Règles d'échelle proposées :**

- 1 mètre de monde ≈ 1 tuile de sol. La taille exacte de la tuile en pixels découle de la hauteur du personnage retenue.
- Proportions stylisées d'environ **4,5 têtes**. Le test a montré qu'en dessous de 40 px, des proportions réalistes (7 têtes) donnent des jambes en allumettes et un visage invisible.
- Les **armes sont surdimensionnées** d'environ 30 % par rapport au réel, pour rester reconnaissables.
- Un ennemi standard fait la taille du joueur. Un tank fait 1,3 à 1,5 fois cette taille, un boss 2 à 3 fois.

**Recommandation :** une échelle **intermédiaire entre A et C** (environ 44 à 48 px, avec une résolution interne d'environ 300 px de haut). À 34 px, le visage et l'arme sont trop petits pour être expressifs. À 56 px, on voit peu d'espace pour anticiper les vagues, et le coût de production augmente fortement. À trancher sur téléphone.

### 3.1 Résolution interne et mise à l'échelle 🔒

- Rendu à une **résolution interne basse**, puis agrandissement par un **facteur entier** (×2, ×3, ×4). Jamais de facteur fractionnaire, qui déformerait les pixels.
- **La hauteur interne est fixe et la largeur s'adapte** au format de l'écran (16:9 à 19,5:9). Le surplus de largeur montre plus de monde au lieu d'ajouter des bandes noires.
- Le facteur est choisi pour que la hauteur interne reste dans la plage visée (par exemple 270 à 300). Le reste vertical éventuel (quelques pixels) est comblé par le décor.

## 4. Lumière et ombres 🔒

- **Une seule lumière** venant du **haut à gauche**, légèrement devant. Le même vecteur est utilisé pour tous les assets (`LIGHT` dans `tools/art-lab/build.mjs`).
- **Quatre tons par matériau** : ombre profonde, ombre, ton moyen, lumière. Plus un contour.
- **Ombres de contact** sous les personnages et les ennemis : ellipse sombre semi-transparente (environ 35 %). Elle ancre le personnage au sol et évite qu'il ait l'air de flotter.
- **Ombres portées dures** pour le décor statique : arbres, caisses, lampadaires. Elles sont rasterisées dans la tuile ou le sprite de décor, jamais calculées en temps réel.
- Pas de dégradé lisse ni de flou. Le **tramage** (dithering) n'est autorisé que sur de grandes surfaces (ciel, eau, brouillard de tempête), jamais sur les personnages.

## 5. Contours

Deux styles ont été testés :

| Style | Rendu | Usage |
|---|---|---|
| **Noir** (prop. A) | Très lisible, plus « rétro » ; les petites tailles s'en sortent bien | Recommandé en dessous de 40 px |
| **Sélectif** (prop. B et C) : couleur plus sombre que la teinte de l'objet | Plus riche et plus moderne ; moins « découpé » | Recommandé à partir de 44 px |

Règles proposées dans les deux cas :

- Contour de **1 px**, extérieur à la silhouette, sur 4 voisins (pas de diagonales).
- **Contours intérieurs** uniquement là où une partie passe devant une autre (bras devant le buste, arme devant le corps).
- Les sources de lumière (cristaux de Tempête, yeux, lampes, flashs) **n'ont pas de contour**.
- Le décor de sol (tuiles) n'a pas de contour. Seuls les objets debout en ont.

## 6. Palette

Deux palettes candidates (voir `palettes-x3.png`), structurées en rampes de 4 tons avec un **décalage de teinte** : ombres tirées vers le violet, lumières vers le chaud.

| | **Tempête** (A, C) | **Cendres** (B) |
|---|---|---|
| Ambiance | Saturée, contrastée, « action » | Désaturée, poussiéreuse, plus sombre |
| Rôdeurs | Peau gris-violet, énergie **violette** | Peau verdâtre, énergie **verte** |
| Lisibilité du joueur | Excellente (orange contre violet et vert) | Bonne, un peu moins de contraste |

**Recommandation : Tempête.** C'est l'esprit « tempête violette » voulu, avec le meilleur contraste joueur/ennemis.

**Règles de couleur proposées 🔒 :**

- **Orange et teal sont réservés aux survivants**, au joueur et aux actions positives (bouton de tir).
- **Violet émissif** : Tempête et ennemis uniquement. C'est la couleur du danger.
- **Rouge** : santé et explosifs. **Bleu** : bouclier. **Jaune pâle** : projectiles et flashs du joueur.
- Le décor reste **moins saturé** que les personnages : verts éteints, gris, bruns.
- La palette sera figée en un fichier unique d'environ 64 couleurs maximum. Un script vérifiera que chaque asset l'utilise (voir `ASSET_PIPELINE.md`).

## 7. Matériaux

| Matériau | Traitement |
|---|---|
| Tissu | Tons mats, 3 à 4 tons, plis indiqués par 1 à 2 pixels sombres (à la main) |
| Peau | Rampe chaude ; joues et nez en ton clair sur les grandes tailles |
| Métal (armes) | Rampe froide + **un reflet spéculaire de 1 px** (déjà présent dans le moteur de test) |
| Bois | Rampe brune, veines horizontales, arêtes plus sombres |
| Béton, asphalte | Grandes plaques de ton, fissures en ton sombre, rares gravillons. **Pas de bruit pixel par pixel** : le test a montré qu'il rend le sol illisible. |
| Énergie de Tempête | Émissive : pas d'ombre, cœur presque blanc, halo violet ; scintille de 2 à 3 images |

## 8. Densité de détail

- **Personnages :** le détail est concentré sur le visage, les mains et l'arme. Les grandes surfaces restent calmes, car le mouvement les rendrait bruyantes.
- **Décor :** moins détaillé que les personnages, pour que l'action ressorte. Les détails vont aux bords des objets (arêtes, coins usés), pas au centre.
- **Règle du plissement des yeux :** une capture d'écran floutée doit encore laisser distinguer joueur, ennemis et obstacles.

## 9. Effets et particules

| Effet | Convention proposée |
|---|---|
| Flash de bouche | 1 à 2 images, croix plus traînée orientée, cœur blanc et halo jaune ; pas de contour |
| Projectiles | **Traceur** de 1 px jaune pâle, plus une traînée plus courte et transparente ; visible même sur l'asphalte |
| Impact sur un ennemi | 4 à 6 étincelles + 3 à 4 particules violettes ; **flash blanc du sprite pendant 1 image** (≈ 60 ms) |
| Impact sur le décor | Éclats de la couleur du matériau, poussière grise |
| Douilles | 1 à 2 px laiton, éjectées latéralement, disparaissent après 1 s |
| Étourdissement | 3 étoiles jaunes qui tournent au-dessus de la tête |
| Mort d'un ennemi | Chute, puis dissolution en particules violettes (à concevoir en Phase 2) |

Le flash blanc testé couvre toute la silhouette. Il est lisible en mouvement (GIF) mais violent en image fixe. **Proposition :** le limiter à 1 image, ou ne blanchir que les tons clairs.

Les particules sont des **pixels pleins**, sans alpha partiel, sauf pour la fumée et les traînées. Les effets lumineux pourront utiliser un mélange additif, à évaluer selon les performances mobiles.

## 10. Transparence

- Les sprites sont en PNG avec **une transparence binaire** (alpha 0 ou 255). Aucun pixel semi-transparent dans les personnages, le décor ou l'UI.
- Le semi-transparent est réservé aux **effets** (ombres de contact, fumée, traînées) et aux **joysticks**. Ces valeurs viennent du code (alpha du rendu), pas des fichiers.
- Une **marge transparente d'au moins 1 px** entoure chaque image dans les atlas, pour éviter les fuites de couleur entre sprites voisins.

## 11. Lisibilité sur petit écran

- **Contraste joueur/ennemis** : le joueur a des couleurs chaudes et claires, les ennemis des couleurs sombres avec des yeux émissifs.
- **Indicateur du joueur** (cercle ou chevron au sol), à tester en Phase 2 si le joueur se perd dans la mêlée.
- **Hors-champ** : flèches au bord de l'écran pour les ennemis proches non visibles (UI).
- Rien d'important dans les 10 % inférieurs de l'écran, sous les pouces.
- Les projectiles ennemis prennent une couleur réservée (violet clair), différente des projectiles du joueur (jaune).

## 12. Animation (conventions proposées, à valider au prototype)

| Animation | Images (proposition) | IPS (images par seconde) | Remarques |
|---|---|---|---|
| Repos | 4 | 6 | respiration (± 1 px) |
| Marche | 8 | 10 | |
| Course | 8 | 12 | buste penché, amplitude plus grande |
| Tir | 3–4 | 15 | recul de l'arme, flash à la 1re image |
| Rechargement | 8 | 10 | durée calée sur la statistique de l'arme |
| Dégâts | 3–4 | 10 | flash, recul du buste |
| Ennemi : attaque | 6 | 10 | anticipation (armé), coup, retour |
| Ennemi : défaite | 8 | 10 | chute, puis maintien de la dernière image |

- **Aucune interpolation entre les images** (pas de tweening ni de déformation d'un sprite unique). Chaque image est une pose complète.
- Le **timing est de la donnée** (durée par image), pas du code. Le recul et le rechargement doivent pouvoir suivre la cadence de l'arme.
- Les principes à appliquer en production dessinée, **absents du test programmatique** : anticipation, images de « smear » (traînées de mouvement) sur les attaques, squash & stretch léger, pose de contact marquée dans la marche.

## 13. Bestiaire : règles d'originalité

Le jeu s'inspire du **concept** des Husks de *Fortnite : Sauver le monde* : des créatures nées d'une tempête, en hordes, avec des archétypes spécialisés. Il **ne reprend ni leurs noms, ni leurs designs, ni leurs assets**.

| Archétype | Nom provisoire | Silhouette (principe) |
|---|---|---|
| Standard | **Rôdeur** (prototype) | Voûté, bras longs, cristal de Tempête sur l'épaule, yeux luminescents |
| Rapide | Coureur | Maigre, penché vers l'avant, à quatre pattes en course |
| Résistant | Cogneur | Massif, épaules énormes, petite tête, carapace de cristal |
| À distance | Cracheur | Gorge ou dos gonflé d'énergie, projectile violet en arc |
| Briseur de défenses | Sapeur | Outil ou bras-masse, charge contre les structures |
| Boss | Colosse | 2 à 3 fois la taille, cristaux géants, plusieurs phases |

Signature commune à la famille : **cristaux de Tempête émissifs et yeux luminescents.** Elle est déjà dans le Rôdeur du prototype.

## 14. Statut des décisions

| Sujet | Statut |
|---|---|
| Projection (3/4 ou iso) | ⏳ à décider (recommandation : 3/4) |
| Hauteur du personnage et résolution interne | ⏳ à décider sur téléphone (recommandation : 44–48 px, ~300 px de haut) |
| Style de contour | ⏳ lié à l'échelle |
| Palette | ⏳ à décider (recommandation : Tempête) |
| Méthode de production des personnages | ⏳ voir `ASSET_PIPELINE.md` |
| Lumière haut-gauche, 4 tons, ombres de contact | proposé |
| 8 directions, haut et bas du corps séparés | proposé |
| Nombre d'images par animation | proposé, figé après le prototype |
