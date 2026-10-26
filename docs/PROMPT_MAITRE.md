# PROMPT MAÎTRE — PROJET DE JEU SURVIVAL SHOOTER PSEUDO-ISOMÉTRIQUE

> Document de référence du projet. Toute session de développement doit le respecter.
> Les décisions validées en cours de route sont consignées dans `ROADMAP.md` et dans les documents de `docs/`.

## 0. TON RÔLE ET TA MISSION

Tu es mon développeur principal, game designer technique, directeur artistique technique et responsable qualité.

Tu travailles dans mon dépôt GitHub existant, qui héberge un site GitHub Pages. Je souhaite le transformer progressivement en un véritable jeu vidéo solo, jouable sur ordinateur, iOS et Android, avec la possibilité de l'ajouter à l'écran d'accueil des téléphones et de le lancer en plein écran.

Le projet est ambitieux. Je ne veux pas une simple démonstration, un prototype jetable ou une interface qui donne l'illusion d'un jeu sans véritable gameplay.

Je veux construire un jeu solo abouti, évolutif, cohérent et maintenable, inspiré de l'expérience de *Fortnite : Sauver le monde*, mais réalisé dans une direction artistique pixel art pseudo-isométrique.

**Règle fondamentale : ne développe pas l'intégralité du jeu en une seule opération.** Travaille par phases, valide chaque fondation, documente les décisions et attends mon approbation aux étapes indiquées.

Tu dois inspecter le dépôt avant de choisir la technologie, modifier le code ou remplacer une architecture existante.

---

# 1. VISION DU JEU

## 1.1 Concept

Créer un jeu de survie et d'action en vue pseudo-isométrique, avec :

- Un personnage entièrement animé.
- Des déplacements libres dans toutes les directions.
- Un système de double joystick sur mobile.
- Une caméra qui suit le joueur avec fluidité.
- Des armes à feu et des armes de mêlée.
- Plusieurs familles de zombies, inspirées notamment des ennemis emblématiques de Fortnite : Sauver le monde.
- Des ennemis originaux, des variantes spécialisées et des boss.
- Des missions avec objectifs et défense de zones.
- Des vagues d'ennemis et des récompenses.
- Des barricades, des pièges et des structures défensives.
- Une destruction partielle de certains éléments du décor.
- Un inventaire, un arsenal, une boutique et un système de skins.
- Une progression persistante, des arbres de compétences, de la fabrication et des améliorations.
- Une interface intégralement conçue dans le style pixel art.
- Une sauvegarde locale, sans compte ni serveur.

Le jeu est destiné à un usage personnel, mais le dépôt et le site peuvent être accessibles publiquement. Ne pars donc pas du principe que des ressources tierces peuvent être copiées ou redistribuées librement.

## 1.2 Philosophie de conception

Les priorités sont, dans cet ordre :

1. Une direction artistique exceptionnelle et cohérente.
2. Des animations convaincantes.
3. Des contrôles agréables sur mobile.
4. Un gameplay réellement fonctionnel.
5. Une architecture permettant d'ajouter du contenu sans réécrire les systèmes existants.
6. Une progression intéressante et persistante.
7. De bonnes performances sur les appareils mobiles.
8. Une expérience utilisateur soignée, jusque dans les menus et les interactions tactiles.

Ne sacrifie pas la qualité visuelle à la quantité de contenu. Un personnage, une arme et un zombie parfaitement réalisés valent davantage que des dizaines d'assets médiocres.

---

# 2. PHASE 0 — AUDIT OBLIGATOIRE DU DÉPÔT

**Commence uniquement par cette phase. Ne construis pas encore le jeu complet.**

## 2.1 Examiner le projet

Inspecte notamment :

- L'arborescence des fichiers.
- Le framework et le langage employés.
- Le fichier package.json, s'il existe.
- Les scripts de développement, de compilation et de déploiement.
- La configuration GitHub Pages.
- Les chemins de base et les routes.
- Les assets déjà présents.
- Les éventuels systèmes de navigation.
- Les dépendances et leur compatibilité.
- Les tests existants.
- Les éventuelles fonctionnalités qui doivent être préservées.

Lis les fichiers pertinents avant de proposer des modifications.

Ne supprime aucun fichier et ne remplace pas l'architecture existante sans justification explicite.

## 2.2 Recommander la technologie

Évalue la meilleure solution pour un jeu 2D pseudo-isométrique destiné à GitHub Pages et aux navigateurs mobiles.

Examine notamment, si cela est pertinent :

- Phaser et TypeScript.
- Le moteur ou framework déjà présent.
- Les solutions de rendu, d'animation et de collision adaptées.
- La gestion des spritesheets et des atlas.
- Les possibilités de création d'une application web progressive (PWA).
- La compatibilité iOS et Android.
- Le stockage local.
- La facilité de tests automatisés.

Ne choisis pas une technologie simplement parce qu'elle est populaire. Compare les avantages, les limites, les risques de migration et les conséquences pour le projet.

Si la technologie existante convient, privilégie sa conservation.

## 2.3 Produire un rapport d'audit

Crée un rapport comprenant :

1. L'état actuel du dépôt.
2. La technologie utilisée.
3. Les éléments existants à préserver.
4. Les problèmes éventuels.
5. La technologie recommandée et sa justification.
6. L'architecture proposée.
7. Les risques techniques.
8. Le plan de développement par phases.
9. Les commandes nécessaires pour tester et lancer le projet.
10. Les éventuelles modifications requérant mon approbation.

Enregistre ce rapport dans un emplacement de documentation approprié, par exemple `docs/PROJECT_AUDIT.md`, si cela est compatible avec le dépôt.

À la fin de cette phase, arrête-toi et présente-moi tes conclusions.

**Ne lance pas une migration majeure sans mon approbation.**

---

# 3. PHASE 1 — CONSTRUIRE LA BIBLE ARTISTIQUE

Après validation de l'audit, établis la documentation artistique avant de produire les assets en série.

Le fichier principal sera, si la structure du dépôt le permet :

`docs/ART_BIBLE.md`

Crée également un catalogue des assets et une documentation du design system de l'interface.

## 3.1 Direction artistique

Le style retenu est :

**Pixel art détaillé, pseudo-isométrique, avec des personnages expressifs, des environnements riches et des animations de qualité professionnelle.**

La caméra est légèrement inclinée, avec une perspective cohérente donnant du volume aux personnages et aux bâtiments sans chercher à produire de véritables modèles 3D.

L'objectif n'est pas d'obtenir un rendu pixel art minimaliste. Les personnages doivent posséder des silhouettes distinctives, des vêtements reconnaissables, des armes visibles et des animations soignées.

Définis :

- Les règles de perspective.
- L'échelle relative des personnages et des décors.
- Les contours et leur épaisseur.
- La palette de couleurs.
- Les ombres et la lumière.
- Le traitement des matériaux.
- La densité de détails.
- Les effets de particules.
- Les conventions de transparence.
- Les règles de lisibilité sur petit écran.

N'impose pas arbitrairement des dimensions définitives de sprites avant d'avoir réalisé et fait valider le prototype artistique.

## 3.2 Cohérence des assets

Tous les éléments doivent sembler appartenir au même jeu :

- Personnages.
- Zombies.
- Armes.
- Projectiles.
- Effets d'impact.
- Décors.
- Bâtiments.
- Barricades.
- Pièges.
- Icônes.
- Boutons.
- Menus.
- Inventaires.
- Cartes de mission.

Ne mélange pas des styles incompatibles. Évite les contours incohérents, les palettes aléatoires, les sprites flous et les images étirées.

Chaque nouvelle famille d'assets doit respecter les conventions établies.

## 3.3 Fiche normalisée des assets

Prévois un format de référence comportant :

- Un identifiant unique.
- La catégorie de l'asset.
- Son nom.
- Sa source et sa référence visuelle.
- Ses dimensions natives.
- Son point d'ancrage.
- Sa perspective.
- Sa palette.
- Ses animations.
- Ses directions disponibles.
- Ses propriétés de collision.
- Son ordre de profondeur.
- Son ombre.
- Son état de validation.

Distingue clairement les assets provisoires des assets approuvés.

## 3.4 Validation artistique

Avant de produire de nombreux sprites, propose-moi la bible artistique et une première planche de référence.

Présente plusieurs variantes si un choix visuel important reste incertain.

Ne transforme pas automatiquement une proposition artistique en règle définitive. Attends mon approbation avant de figer les dimensions, les proportions et les conventions d'animation.

---

# 4. PIPELINE HYBRIDE DE PRODUCTION DES SPRITES

Je souhaite utiliser Claude Code pour automatiser autant que possible la création et l'intégration des assets.

Cependant, je ne veux pas que chaque personnage soit simplement constitué de rectangles et de formes géométriques programmées.

Tu dois comparer trois méthodes :

1. Génération entièrement programmatique.
2. Sprites dessinés ou générés, puis animés et organisés par des outils.
3. Pipeline hybride associant création artistique, scripts de traitement, atlas et intégration automatisée.

Privilégie le pipeline hybride si le prototype confirme qu'il offre le meilleur résultat.

Tu peux écrire des scripts pour :

- Générer des variations.
- Préparer les spritesheets.
- Vérifier la transparence.
- Extraire les frames.
- Construire des atlas.
- Convertir les formats.
- Contrôler les dimensions.
- Vérifier les palettes.
- Générer des aperçus d'animation.
- Détecter les frames manquantes.

Mais ces outils ne doivent pas dégrader la qualité artistique.

Si les sprites produits par le code sont insuffisamment expressifs, utilise une méthode de dessin ou de génération adaptée plutôt que de prétendre que le résultat est satisfaisant.

Ne crée pas artificiellement des animations en déformant un sprite unique si le résultat est visuellement mauvais.

---

# 5. PHASE 2 — PROTOTYPE ARTISTIQUE DE RÉFÉRENCE

Cette phase constitue le premier véritable jalon de production.

Le prototype doit être suffisamment abouti pour que je puisse juger le style et les animations avant d'engager la production à grande échelle.

## 5.1 Contenu minimal

Crée une scène comprenant :

- Un environnement pseudo-isométrique.
- Un survivant détaillé.
- Un zombie de référence inspiré du concept des Husks.
- Une arme à feu.
- Un système de visée.
- Un tir avec effets visuels.
- Une réaction du zombie aux impacts.
- Des éléments de décor.
- Des ombres cohérentes.
- Une interface temporaire permettant de tester la scène.

Le survivant et le zombie doivent être animés.

Le prototype doit permettre de juger les proportions, la perspective, la lisibilité, les couleurs, les mouvements et les effets de combat.

## 5.2 Animations à tester

Pour le survivant, vise les actions suivantes :

- Repos.
- Marche.
- Course.
- Déplacement dans huit directions.
- Orientation de l'arme.
- Visée indépendante du déplacement.
- Tir.
- Recul de l'arme.
- Rechargement.
- Réaction aux dégâts.

Pour le zombie :

- Repos.
- Déplacement.
- Poursuite.
- Attaque.
- Réaction aux impacts.
- Étourdissement, si pertinent.
- Défaite.

Le nombre exact de frames par animation sera décidé après le prototype.

Les animations doivent rester cohérentes et fluides, sans interpolation qui rendrait les pixels flous.

## 5.3 Critères de validation

Le prototype doit être évalué selon :

- La qualité du dessin.
- La cohérence pseudo-isométrique.
- La qualité des silhouettes.
- La fluidité des animations.
- La lisibilité des tirs.
- La qualité des effets.
- La lisibilité sur téléphone.
- Les performances.
- La facilité d'ajout de nouveaux sprites.

Prépare un écran ou un mode de démonstration permettant de comparer les animations.

À la fin de cette phase, arrête-toi pour me présenter le résultat et recueillir mon avis.

**Ne commence pas la production massive des assets avant validation du prototype.**

---

# 6. PHASE 3 — ARCHITECTURE DU MOTEUR DE JEU

Une fois le prototype approuvé, conçois le moteur autour de systèmes indépendants.

Adapte l'architecture à la technologie validée lors de l'audit.

Évite de créer une architecture inutilement complexe, mais ne concentre pas toute la logique dans un fichier gigantesque.

## 6.1 Systèmes fondamentaux

Prévois des responsabilités distinctes pour :

- L'initialisation du jeu.
- Le chargement des ressources.
- La gestion des scènes.
- La caméra.
- Le rendu pseudo-isométrique.
- Le déplacement.
- Les collisions.
- La visée.
- Le combat.
- Les armes.
- Les projectiles.
- Les ennemis.
- L'intelligence artificielle.
- Les vagues.
- Les missions.
- Les objectifs.
- Les constructions.
- Les destructions.
- L'inventaire.
- La fabrication.
- Les compétences.
- Les récompenses.
- La boutique.
- Les skins.
- La sauvegarde.
- L'interface.
- Le son.

Ces responsabilités peuvent être regroupées en modules cohérents. Ne crée pas une multitude de fichiers artificiels sans utilité.

## 6.2 Déplacement et caméra

Le joueur doit pouvoir se déplacer librement dans toutes les directions.

La caméra doit suivre le personnage avec fluidité et sans tremblement.

Le déplacement doit rester indépendant de la visée.

Les collisions doivent être déterminées par des formes logiques, et non par les seuls pixels transparents des sprites.

Le rendu pseudo-isométrique doit distinguer :

- La position logique au sol.
- La position d'affichage du sprite.
- La profondeur de rendu.
- L'empreinte de collision.
- La hauteur visuelle des obstacles.

Cette séparation est indispensable pour éviter les problèmes de profondeur, les personnages flottants et les collisions incohérentes.

## 6.3 Données séparées du code

Les armes, les ennemis, les recettes, les skins et les compétences doivent être définis dans des données structurées.

Ajouter un fusil ne doit pas nécessiter de réécrire le moteur de combat.

Ajouter un zombie ne doit pas obliger à modifier les autres types d'ennemis.

Ajouter une recette ne doit pas nécessiter de réécrire le système de fabrication.

Prévois une validation des données et des valeurs par défaut raisonnables.

---

# 7. PHASE 4 — GAMEPLAY ET COMBATS

## 7.1 Commandes

Sur mobile, le schéma de contrôle prévu est :

- Joystick gauche : déplacement.
- Joystick droit : visée indépendante.
- Boutons tactiles : tir, rechargement et actions contextuelles.
- Accès rapide aux armes et objets.
- Commandes adaptées aux pouces et aux différentes tailles d'écran.

Sur ordinateur, prévois des contrôles adaptés au clavier et à la souris.

Les interactions tactiles doivent être fluides. Évite les boutons trop petits, les zones qui se chevauchent et les actions difficiles à déclencher.

## 7.2 Système d'armes

Prévois une architecture pouvant accueillir :

- Fusils d'assaut.
- Pistolets.
- Mitraillettes.
- Fusils à pompe.
- Fusils de précision.
- Armes explosives.
- Armes de mêlée.
- Armes spécialisées.

Chaque arme doit posséder des données propres :

- Dégâts.
- Cadence de tir.
- Chargeur.
- Munitions.
- Temps de rechargement.
- Dispersion.
- Portée.
- Type de projectile.
- Rareté.
- Effets visuels.
- Son.
- Animation.
- Éventuelles propriétés spéciales.

Ces caractéristiques doivent être configurables sans réécrire le système de combat.

Les armes doivent être visuellement reconnaissables et leur utilisation doit être satisfaisante.

## 7.3 Ennemis

Le bestiaire initial doit inclure :

- Un ennemi standard de référence.
- Un ennemi rapide.
- Un ennemi résistant.
- Un ennemi à distance.
- Un ennemi spécialisé dans la destruction des défenses.
- Un boss.

Les ennemis emblématiques de Fortnite : Sauver le monde constituent une référence importante, notamment pour les Husks et leurs variantes.

Le jeu pourra également accueillir des personnages et références issus de la pop culture, ainsi que des créations originales. Privilégie les assets originaux ou les ressources dont les droits permettent l'utilisation envisagée. Ne récupère pas automatiquement les fichiers d'un jeu commercial.

Chaque ennemi doit avoir un rôle identifiable, des statistiques cohérentes, un comportement fonctionnel et des animations adaptées.

## 7.4 Vagues et missions

Le système de missions doit prendre en charge :

- Des objectifs.
- Des vagues de zombies.
- Des conditions de victoire.
- Des conditions de défaite.
- Des récompenses.
- Une difficulté croissante.
- Des objectifs de défense.
- Des transitions entre les étapes.

Les missions doivent être définies à partir de données réutilisables, plutôt que codées séparément les unes des autres.

---

# 8. PHASE 5 — CONSTRUCTIONS ET DESTRUCTION PARTIELLE

Le jeu doit permettre de préparer et de défendre des zones.

## 8.1 Constructions

Commence par :

- Des barricades.
- Des pièges.
- Des défenses spécialisées.
- Des structures à améliorer.

Chaque structure doit avoir un coût, une fonction, une résistance, une représentation visuelle et une méthode de placement.

Le système doit vérifier les collisions et empêcher les placements impossibles.

## 8.2 Destruction

La destruction sera partielle et contrôlée.

Les objets destructibles devront pouvoir passer entre plusieurs états visuels, par exemple :

1. Intact.
2. Endommagé.
3. Détruit.

Le changement d'état doit mettre à jour les collisions, les interactions et l'apparence.

Ne cherche pas à simuler la destruction complète de chaque pixel ou de tous les bâtiments. Privilégie des états prédéfinis, performants et visuellement convaincants.

Les objets détruits pourront laisser des débris ou des ressources lorsque cela est pertinent.

---

# 9. PHASE 6 — PROGRESSION, FABRICATION ET COLLECTION

Le jeu doit proposer une progression solo persistante.

## 9.1 Inventaire et arsenal

Prévois :

- Les armes possédées.
- Les objets consommables.
- Les ressources.
- Les composants de fabrication.
- Les équipements améliorables.
- Les skins.
- Les objets favoris.
- Les statistiques utiles.

L'interface doit permettre de comprendre rapidement ce que le joueur possède, ce qu'il peut utiliser et ce qu'il peut fabriquer.

## 9.2 Fabrication

Le système de fabrication doit prendre en charge :

- Les recettes.
- Les composants nécessaires.
- Les coûts.
- La vérification des ressources.
- La consommation des composants.
- La création de l'objet.
- Les éventuels prérequis.
- Les améliorations.

Les recettes doivent être définies dans des données.

Les transactions doivent être atomiques du point de vue logique : une fabrication ne doit jamais consommer les ressources sans créer l'objet correspondant.

## 9.3 Arbres de compétences

Prévois plusieurs orientations de progression, par exemple :

- Dégâts et maniement des armes.
- Résistance et survie.
- Mobilité.
- Fabrication et ressources.
- Construction et défense.

Les compétences doivent avoir des prérequis, des coûts, des effets définis et une présentation claire.

Les effets doivent réellement modifier le gameplay. Ne crée pas de compétences purement décoratives.

## 9.4 Boutique et skins

La boutique doit proposer une sélection d'objets achetables avec une monnaie virtuelle.

Elle doit comprendre :

- Des aperçus de skins.
- Des descriptions.
- Des niveaux de rareté.
- Le prix en monnaie du jeu.
- L'état possédé ou non possédé.
- Une confirmation d'achat.
- Une animation de récompense.
- L'équipement du skin.
- Un inventaire persistant.

Les achats seront simulés. Aucun paiement réel ni aucune connexion à un service commercial ne sont nécessaires.

La boutique doit être fonctionnelle, même si son catalogue initial est limité.

---

# 10. PHASE 7 — INTERFACE ET DESIGN SYSTEM

L'interface doit être intégralement en pixel art et respecter une charte commune.

Crée un document de référence pour :

- Les couleurs.
- La typographie.
- Les boutons.
- Les bordures.
- Les espacements.
- Les icônes.
- Les panneaux.
- Les cartes.
- Les états de sélection.
- Les transitions.
- Les animations.
- Les retours tactiles.
- Les menus.
- Le HUD.
- L'inventaire.
- La boutique.
- L'écran de fabrication.
- Les arbres de compétences.

## 10.1 États interactifs

Chaque composant interactif doit avoir des états cohérents :

- Normal.
- Survolé sur les appareils compatibles.
- Pressé.
- Sélectionné.
- Désactivé.
- En chargement, si nécessaire.
- En erreur, si nécessaire.

Sur les écrans tactiles, le comportement au toucher remplace les effets de survol lorsque ceux-ci ne sont pas disponibles.

Les animations doivent être brèves et utiles. Elles ne doivent pas retarder les actions ni nuire aux performances.

## 10.2 Responsive design

L'interface doit fonctionner sur :

- Les écrans d'ordinateur.
- Les téléphones iOS.
- Les téléphones Android.
- Les différentes résolutions.
- Les écrans avec encoche.
- Les modes plein écran compatibles.

Prévois une adaptation aux zones de sécurité et à l'orientation du téléphone.

Ne suppose pas qu'une interface conçue sur ordinateur sera automatiquement utilisable sur mobile.

---

# 11. PHASE 8 — SAUVEGARDE LOCALE

Le jeu est solo et ne nécessite ni compte, ni serveur, ni authentification.

Choisis le mécanisme de stockage après avoir évalué le volume de données et les contraintes du navigateur.

Une solution locale structurée, telle qu'IndexedDB, peut être préférable au simple localStorage si les besoins le justifient.

## 11.1 Données à sauvegarder

Prévois notamment :

- La progression du joueur.
- Les missions terminées.
- Les ressources.
- L'inventaire.
- Les armes.
- Les améliorations.
- Les compétences.
- Les skins possédés.
- Le skin équipé.
- La monnaie virtuelle.
- Les paramètres.
- Les statistiques pertinentes.

## 11.2 Fiabilité

La sauvegarde doit :

- Posséder une version de schéma.
- Être validée lors du chargement.
- Gérer les données absentes ou corrompues.
- Prévoir des migrations lorsque la structure évolue.
- Éviter les pertes de progression lors d'une mise à jour.
- Ne pas écraser une sauvegarde valide avec des données par défaut.
- Signaler les erreurs de stockage.

Prévois une fonction de réinitialisation volontaire, avec confirmation explicite.

N'introduis pas de serveur distant ou de compte en ligne.

La persistance doit fonctionner dans les limites des navigateurs : le stockage local peut être supprimé par l'utilisateur ou par le navigateur. Ne promets pas une conservation absolue.

---

# 12. PHASE 9 — GITHUB PAGES ET APPLICATION MOBILE

Le jeu doit rester compatible avec son hébergement existant.

## 12.1 Déploiement

Vérifie :

- Le chemin de base GitHub Pages.
- Le chargement des assets.
- Les routes et les chemins relatifs.
- Le processus de compilation.
- Le processus de déploiement.
- Les erreurs de console.
- Le fonctionnement du jeu depuis son URL publiée.

Ne suppose pas que les chemins fonctionnant en local fonctionneront automatiquement sous un sous-répertoire GitHub Pages.

## 12.2 PWA

Évalue la possibilité d'ajouter :

- Un manifeste web.
- Des icônes d'application.
- Un mode plein écran.
- Un nom et une identité visuelle.
- Un comportement adapté à l'écran d'accueil.
- Une stratégie de mise en cache compatible avec le jeu.

Teste spécifiquement les contraintes iOS et Android.

Ne prétends pas que la PWA est une application native. Certaines fonctionnalités et certains comportements varient selon le système d'exploitation et le navigateur.

Si une fonctionnalité n'est pas prise en charge, documente la limite et propose une solution de remplacement.

## 12.3 Performances

Surveille notamment :

- La fréquence d'images.
- Le nombre d'ennemis simultanés.
- Le nombre de particules.
- Les allocations répétées.
- Les chargements de ressources.
- Les fuites de mémoire.
- La taille des atlas.
- Les temps de chargement.

Utilise des optimisations adaptées, telles que la réutilisation d'objets ou la limitation des effets coûteux, lorsqu'elles apportent un bénéfice réel.

Ne complexifie pas prématurément le moteur.

---

# 13. PHASE 10 — TESTS ET CRITÈRES DE QUALITÉ

Chaque phase doit être validée avant de passer à la suivante.

## 13.1 Tests automatisés

Mets en place des tests pertinents pour :

- Les données des armes.
- Les dégâts.
- Les munitions.
- Le rechargement.
- Les collisions.
- Les vagues.
- Les conditions de victoire et de défaite.
- Les recettes de fabrication.
- Les coûts des compétences.
- Les transactions de la boutique.
- Les sauvegardes.
- Les migrations.
- Les données corrompues.
- Les chemins de ressources.

Utilise les outils déjà présents si cela est pertinent. Sinon, recommande une solution de test compatible avec le projet.

## 13.2 Tests manuels

Prévois une liste de vérification pour :

- Le lancement du jeu.
- Le déplacement.
- Le double joystick.
- La visée indépendante.
- Le tir.
- Le rechargement.
- Les animations.
- Les collisions.
- Les ennemis.
- Les défenses.
- La destruction.
- La fabrication.
- La boutique.
- La progression.
- La sauvegarde après rechargement de la page.
- L'ajout à l'écran d'accueil.
- Le déploiement GitHub Pages.

## 13.3 Définition de « terminé »

Une fonctionnalité n'est terminée que si :

1. Elle est implémentée.
2. Elle fonctionne dans le jeu.
3. Elle respecte la charte artistique.
4. Elle a été testée.
5. Les erreurs connues sont documentées.
6. Elle ne casse pas les fonctionnalités existantes.
7. Sa documentation est à jour lorsque nécessaire.

Ne déclare jamais un test réussi si tu ne l'as pas exécuté ou si son résultat n'est pas vérifiable.

Ne masque pas les erreurs et ne remplace pas les fonctionnalités manquantes par des éléments décoratifs.

---

# 14. ORGANISATION DU TRAVAIL ET DOCUMENTATION

Maintiens une documentation adaptée à la structure du dépôt, comprenant au minimum :

- Le rapport d'audit.
- La bible artistique.
- Le design system.
- L'architecture technique.
- Le catalogue des assets.
- Le plan de développement.
- Les critères de validation.
- Les instructions de lancement.
- Les instructions de déploiement.
- Les limites connues.

Un fichier `ROADMAP.md` ou équivalent doit indiquer :

- Les phases.
- Les tâches.
- Leur statut.
- Les dépendances.
- Les critères d'acceptation.
- Les décisions en attente.
- Les problèmes connus.

Marque clairement les tâches comme proposées, en cours, terminées ou bloquées.

N'affirme pas qu'une fonctionnalité existe si elle n'a été ni implémentée ni testée.

---

# 15. RÈGLES DE CONDUITE POUR CLAUDE CODE

Ces règles s'appliquent à tout le projet.

1. Inspecte les fichiers avant de les modifier.
2. Préserve les fonctionnalités existantes.
3. Évite les changements massifs et non justifiés.
4. Explique les décisions techniques importantes.
5. Privilégie les changements ciblés et vérifiables.
6. Ne duplique pas inutilement le code.
7. Ne crée pas de fausses fonctionnalités.
8. Ne laisse pas de boutons sans comportement.
9. Ne simule pas une sauvegarde si elle n'existe pas.
10. Ne prétends pas qu'une fonctionnalité est compatible mobile sans l'avoir vérifiée.
11. Ne télécharge pas automatiquement des assets protégés depuis des jeux commerciaux.
12. Privilégie les assets originaux, les créations générées et les ressources dont les conditions d'utilisation sont compatibles avec le projet.
13. Documente les dépendances et les choix d'architecture.
14. N'ajoute pas de services distants sans autorisation.
15. Ne supprime jamais une sauvegarde ou des données de l'utilisateur sans confirmation.
16. Ne lance pas de commande destructive sans vérifier ses conséquences.
17. Ne modifie pas le déploiement existant sans avoir compris son fonctionnement.
18. Ne fige pas les dimensions artistiques avant validation du prototype.
19. Ne commence pas une phase majeure tant que ses critères d'acceptation ne sont pas satisfaits.
20. Si une difficulté importante apparaît, expose-la clairement et propose plusieurs solutions.

Si un choix peut être fait sans risque et sans modifier la vision du projet, prends une décision raisonnable et documente-la. Si une décision risque d'entraîner une migration, une perte de données ou un changement artistique majeur, demande mon approbation.

---

# 16. MÉTHODE DE TRAVAIL PAR PHASES

Suis cet ordre :

**Phase 0 — Audit du dépôt et recommandation technique.**

Arrête-toi pour présenter le rapport et attendre mon approbation.

**Phase 1 — Bible artistique, design system et organisation des assets.**

Présente les règles visuelles et les propositions de référence. Attends ma validation des décisions artistiques importantes.

**Phase 2 — Prototype artistique et technique.**

Construis une scène de référence limitée mais jouable. Présente le résultat et attends mon approbation avant la production en série.

**Phase 3 — Architecture et moteur de jeu.**

Construis les fondations réutilisables et valide les contrôles, les collisions et le rendu.

**Phase 4 — Combat, armes, zombies et missions.**

Construis une boucle de gameplay complète.

**Phase 5 — Défenses, construction et destruction partielle.**

Valide les structures, les collisions et les états visuels.

**Phase 6 — Progression, fabrication, compétences, inventaire et boutique.**

Valide les données, les transactions et la persistance.

**Phase 7 — Interface finale et expérience mobile.**

Applique la charte à tous les écrans et teste les interactions tactiles.

**Phase 8 — Sauvegarde, PWA et compatibilité GitHub Pages.**

Teste la persistance et le déploiement réel.

**Phase 9 — Tests, équilibrage, optimisation et finition.**

Corrige les problèmes avant de considérer la version solo comme terminée.

Les phases peuvent être ajustées si l'audit révèle une contrainte importante, mais chaque changement doit être justifié et documenté.

---

# 17. CE QUE TU DOIS FAIRE MAINTENANT

Commence par la **Phase 0 uniquement**.

Inspecte mon dépôt existant.

Ne génère pas immédiatement des dizaines de fichiers de jeu. Ne remplace pas mon architecture. Ne choisis pas arbitrairement les dimensions des sprites.

Présente-moi :

1. Un résumé de l'état actuel du dépôt.
2. Les technologies et dépendances utilisées.
3. La meilleure stratégie technique pour ce projet.
4. Les risques et les contraintes.
5. Le plan de développement proposé.
6. Les fichiers de documentation à créer.
7. Les premières étapes nécessaires pour arriver au prototype artistique.

Si tu peux créer le rapport d'audit sans risque pour le projet, fais-le.

Puis arrête-toi et attends mon approbation avant d'engager des changements majeurs.

**L'objectif final est un véritable jeu solo, soigné, cohérent, jouable et évolutif. La priorité immédiate est de poser des fondations solides et de prouver la qualité artistique avec un prototype avant de passer à l'échelle.**
