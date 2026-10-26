// État d'entrée partagé : écrit par le HUD (tactile) et par la scène de jeu (clavier, souris).
export const controls = {
  /** Déplacement en coordonnées écran, norme 0 → 1. */
  move: { x: 0, y: 0 },
  /** Visée en coordonnées écran (direction), norme 0 → 1 au joystick. */
  aim: { x: 0, y: 0 },
  aimActive: false,
  fireHeld: false,
  reloadRequested: false,
  touchUsed: false,
};
