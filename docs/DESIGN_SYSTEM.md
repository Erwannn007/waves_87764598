# Design system de l'interface — Waves

- **Version :** 0.1 (Phase 1)
- **Statut :** PROPOSITION. Référence visuelle : [`art/phase1/ui-kit-x3.png`](art/phase1/ui-kit-x3.png). Code de référence : `tools/art-lab/ui.mjs`.

L'interface est **dessinée en pixel art dans le canvas du jeu**, à la même résolution interne que la scène et avec le même facteur entier. Il n'y a pas d'interface HTML par-dessus le jeu, sauf exceptions justifiées (saisie de texte, import de fichier de sauvegarde).

---

## 1. Jetons de couleur

> **Variante « Cendres » en vigueur (2026-10-26)**, définie dans `src/ui/theme.ts` : fonds brun-noir (`panel #221e1a`, `panelRaised #332d27`, `bevel #4d443a`), texte sable (`#ece4d0`), **sélection et focus en vert maladif** (`accent #6f8f3e`, `accentLight #c9e08a`), action principale en orange (`#c8612a`). Le tableau ci-dessous est la version violette de la Phase 1, conservée pour mémoire.

| Jeton | Valeur | Usage |
|---|---|---|
| `ink` | `#0d0a14` | contours de l'UI, texte sur fond clair |
| `panelDeep` | `#15122a` | fonds pleins, creux |
| `panel` | `#241f40` | panneaux |
| `panelRaised` | `#332c5a` | boutons neutres, cartes surélevées |
| `bevel` | `#4a4280` | biseau clair |
| `text` | `#f2ecff` | texte principal |
| `textDim` | `#a59cc4` | texte secondaire, libellés |
| `textOff` | `#5d567e` | désactivé |
| `accent` / `accentLight` | `#9a3be0` / `#d47bff` | sélection, focus, Tempête |
| `action` / `actionLight` / `actionDark` | `#de6a22` / `#ffab45` / `#8a3514` | action principale (Jouer, Tir, Acheter) |
| `health` / `healthDark` | `#e0463c` / `#7a1e22` | santé |
| `shield` / `shieldDark` | `#3fa7ff` / `#1d4e8a` | bouclier |
| `ok` | `#5ec7b2` | succès, validé |
| Rareté | `common #9aa2b8` · `uncommon #5fbf4a` · `rare #3f8cff` · `epic #b25cff` · `legendary #ff9a2e` | cartes, bordures d'objets |

Règles :

- **Une seule action principale (orange) par écran.**
- Le violet signale la sélection et le focus, jamais une action.
- La rareté n'est jamais portée uniquement par la couleur : elle s'accompagne d'un libellé, et d'une forme de bordure en production, pour les daltoniens.

## 2. Typographie

- La police 3×5 des planches est **une police de travail**. Elle n'a ni minuscules ni accents, et ne convient pas au jeu.
- **Proposition :** créer une **police bitmap maison** pour éviter toute question de licence et maîtriser chaque pixel. Elle comprendra :
  - **Corps** : 5×7 avec minuscules et accents français (é è ê à ç ù ô î, majuscules accentuées), chasse variable.
  - **Titres** : 7×9 en gras.
  - **Chiffres de HUD** : 4×6 à chasse fixe, pour que les munitions ne « dansent » pas.
- **Alternative :** des polices pixel sous licence **SIL OFL** (par exemple Pixelify Sans, Silkscreen), converties en police bitmap. La licence et la couverture des accents seront vérifiées avant tout usage.
- Taille minimale : **7 px de hauteur de capitale** à la résolution interne pour le texte lu en jeu. La police 5×7 est réservée aux libellés et aux menus.

## 3. Grille, bordures, espacements

- **Unité : 2 px internes.** Les marges valent 4, 6, 8 ou 12 px.
- Bordure standard : contour `ink` de 1 px aux **coins coupés** (pas de pixel d'angle), biseau clair en haut et à gauche, ombre en bas à droite.
- Panneaux et boutons sont des **9-slice** (9 morceaux redimensionnables) : coins fixes, bords répétés, centre plein. Aucune mise à l'échelle non entière.

## 4. Composants

| Composant | Description | Statut |
|---|---|---|
| Panneau | fond, biseau, ombre | dessiné (planche) |
| Bouton action / neutre | 5 états (§ 5) | dessiné |
| Barre (santé, bouclier, progression) | segmentée tous les 6 px, ombre inférieure | dessinée |
| Icônes 7×7 | cœur, bouclier, munitions, clé, pièce, cristal | dessinées (à agrandir en 9×9 pour le tactile) |
| Carte d'objet | bandeau de rareté, vignette, libellé | dessinée |
| Joystick virtuel | anneau semi-transparent + manette | dessiné |
| Onglets, liste défilante, info-bulle, dialogue de confirmation, toast, compteur de monnaie, nœud d'arbre de compétences, case d'inventaire | à concevoir | proposé (Phase 7) |

## 5. États interactifs

| État | Rendu |
|---|---|
| Normal | fond, biseau clair en haut, ombre de 1 px en dessous |
| Survolé (souris uniquement) | fond éclairci d'un ton |
| Pressé | bouton décalé de 1 px vers le bas, ombre supprimée, biseau inversé |
| Sélectionné / focus | cadre `accentLight` de 1 px, à 1 px du bouton |
| Désactivé | fond `panel`, texte `textOff`, pas d'ombre ; **le toucher affiche la raison** (« Ressources insuffisantes ») plutôt que de ne rien faire |
| Chargement | 3 points animés à la place du libellé ; bouton non cliquable |
| Erreur | cadre `health`, tremblement horizontal de 2 px pendant 150 ms, message sous le bouton |

Sur un écran tactile, il n'y a **pas de survol**. L'état « pressé » s'affiche au toucher et **l'action se déclenche au relâchement**, et seulement si le doigt est resté sur le bouton : on peut annuler en glissant hors du bouton.

## 6. Mouvement et retours

- Durées : **80 à 150 ms** pour les retours, **200 à 250 ms** au maximum pour les transitions d'écran. Aucune animation ne bloque une action.
- Mouvements par **pas entiers de pixel**, sans sous-pixel ni flou. Les fondus passent par des paliers d'opacité ou un **tramage**.
- **Retour haptique :** `navigator.vibrate` fonctionne sur Android Chrome, mais **pas sur iOS Safari**. Le retour visuel et sonore est donc **obligatoire** ; la vibration n'est qu'un bonus Android, désactivable dans les options.
- Son : chaque bouton a un son de toucher discret, et le son de validation diffère du son d'annulation.

## 7. Tactile et zones de sécurité

- **Cible tactile minimale : 44×44 pt** (recommandation Apple ; 48 dp chez Google). À la résolution interne d'environ 270 à 300 px de haut, sur un iPhone en paysage, cela fait **environ 32 px internes**.
  - ⚠️ Les boutons des planches (16 px de haut) et les boutons TIR et R du HUD provisoire sont **trop petits pour le tactile**. La zone de toucher sera agrandie au-delà du dessin, et les boutons d'action en jeu passeront à environ 36 px.
- Les **joysticks sont dynamiques** : ils apparaissent là où le pouce se pose, dans la moitié gauche (déplacement) ou droite (visée) de l'écran, et non à une position fixe.
- Les **zones de sécurité** (`env(safe-area-inset-*)`) sont respectées : rien d'interactif sous l'encoche, l'îlot dynamique ou la barre d'accueil. Les bords de l'écran (≈ 16 pt) sont exclus des joysticks, car iOS y capte le geste de retour.
- **Paysage en priorité.** En portrait, un écran « Tourne ton téléphone » est affiché (illustration pixel art), et la partie se met en pause. iOS ne permet pas de verrouiller l'orientation d'une PWA.

## 8. Mise en page du HUD (proposée)

```
┌──────────────────────────────────────────────────────────────┐
│ [♥ santé  ]        [ VAGUE 3/5 · objectif ]      [▮ 24/120]  │
│ [◆ bouclier]                                      [arme 1-4]  │
│                                                              │
│                         (jeu)                                │
│                                                              │
│   ( joystick                                   [R]  ( joystick│
│     déplacement )                            [ACTION] visée ) │
└──────────────────────────────────────────────────────────────┘
```

- **Implémenté dans le prototype :** le bouton **TIR est aussi un joystick de visée**. Le toucher déclenche le tir, glisser depuis TIR oriente le tir, et toucher ailleurs dans la moitié droite vise sans tirer. L'**auto-tir** (option AUTO) tire dès que le joystick de visée dépasse 70 %. Les deux modes sont à comparer sur téléphone.
- Proposition initiale : avec le joystick droit, **viser tire automatiquement** au-delà de 70 % d'inclinaison (comme la plupart des shooters à double joystick). Le bouton TIR reste disponible pour le tir manuel. **À valider en Phase 2.**
- Au clavier et à la souris : ZQSD/WASD pour se déplacer, la souris pour viser, clic gauche pour tirer, R pour recharger, 1 à 4 pour les armes, E pour interagir.

## 9. Écrans à concevoir (Phase 7)

Menu principal, sélection de mission, HUD, pause, résultats de mission, arsenal/inventaire, fabrication, arbre de compétences, boutique et skins, paramètres (audio, vibration, taille des commandes, export/import de sauvegarde, réinitialisation avec double confirmation).
