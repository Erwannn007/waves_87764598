# Limites connues (prototype 0.2)

## Art
- **Les sprites sont des maquettes programmatiques** (méthode 1, palette Cendres), pas encore la passe artistique du pipeline hybride. Formes simplifiées, visages minimalistes, animations sans anticipation ni *smear*. Le chemin de remplacement par des images retouchées existe déjà (voir `docs/ASSET_PIPELINE.md` § 7).
- Les transitions entre types de sol sont nettes, d'une tuile à l'autre (pas de tuiles de raccord).
- Tri de profondeur par point d'ancrage unique : un personnage qui frôle un long objet (voiture) peut, à quelques pixels près, être dessiné du mauvais côté.
- La police 3×5 n'a ni minuscules ni accents : les textes du jeu sont en majuscules sans accents.

## Gameplay (volontairement hors périmètre)
- Pas de missions, de vagues, de construction, d'inventaire, de boutique ni de progression. Le joueur réapparaît au centre après 2,5 s.
- Les Rôdeurs n'attaquent pas les barricades : ils les contournent (le briseur de défenses viendra plus tard).
- Une seule arme ; munitions de réserve limitées à 210, sans ramassage.

## Plateformes
- **iPhone :** pas d'API plein écran dans Safari ; il faut ajouter le jeu à l'écran d'accueil. Pas de verrouillage d'orientation (un écran d'invite le remplace), pas de vibration, et le son est coupé si le bouton silencieux est activé.
- **Android :** plein écran et verrouillage paysage tentés au toucher de JOUER, selon ce que le navigateur autorise.
- **Pas de service worker** dans le prototype, donc pas de mode hors ligne. C'est volontaire : un cache mal maîtrisé pourrait te faire tester une ancienne version. Il arrive en Phase 8.
- Le stockage local (paramètres) peut être effacé par le navigateur ou par l'utilisateur. Sur iOS, l'app installée et Safari ont des stockages séparés.

## Outillage
- Les tests e2e scriptés du multi-touch ne tournent que sur Chromium. Sur WebKit, seuls le chargement et le tap sont testés.
- Les mesures de performance sur téléphone réel restent à faire (voir `docs/TESTING.md`).
