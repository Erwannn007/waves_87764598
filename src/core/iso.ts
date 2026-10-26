// Projection isométrique 2:1. Le monde est exprimé en mètres sur le sol (x, y) avec une hauteur z.
// Ces constantes doivent correspondre à ISO dans tools/art-lab/export.mjs (vérifié par les tests).
export const TILE_M = 1.5;
export const TILE_W = 64;
export const TILE_H = 32;
export const PITCH_DEG = 30;
/** Pixels par mètre (horizontal) : une tuile de 1,5 m mesure 64 px de large. */
export const PPU = TILE_W / (TILE_M * Math.SQRT2);

const KX = PPU * Math.SQRT1_2; // (x + y) → écran x
const KY = PPU * Math.SQRT1_2 * Math.sin((PITCH_DEG * Math.PI) / 180); // (x − y) → écran y
const KZ = PPU * Math.cos((PITCH_DEG * Math.PI) / 180); // hauteur → écran y

export interface Vec2 {
  x: number;
  y: number;
}

/** Position au sol (et hauteur) → pixel écran dans l'espace du monde affiché. */
export function toScreen(x: number, y: number, z = 0): Vec2 {
  return { x: (x + y) * KX, y: (x - y) * KY - z * KZ };
}

/** Pixel écran → point au sol (z = 0). */
export function toWorld(sx: number, sy: number): Vec2 {
  const sum = sx / KX;
  const diff = sy / KY;
  return { x: (sum + diff) / 2, y: (sum - diff) / 2 };
}

/** Direction à l'écran (ex. joystick) → direction au sol normalisée. Le vecteur nul reste nul. */
export function screenDirToWorld(dx: number, dy: number): Vec2 {
  const w = toWorld(dx, dy);
  const l = Math.hypot(w.x, w.y);
  return l < 1e-9 ? { x: 0, y: 0 } : { x: w.x / l, y: w.y / l };
}

/**
 * Index de direction d'affichage (0 = S, 1 = SE, 2 = E … 7 = SO) pour une direction au sol.
 * Les sprites sont rendus face caméra pour l'index 0 ; la caméra iso est tournée de 45°.
 */
export function dirIndex(dx: number, dy: number): number {
  const yaw = Math.atan2(-dx, dy);
  const k = Math.round((yaw - Math.PI / 4 - Math.PI) / (Math.PI / 4));
  return ((k % 8) + 8) % 8;
}

/** Profondeur de tri : plus la valeur est grande, plus l'objet est proche de la caméra. */
export const depthOf = (x: number, y: number): number => (x - y) * KY;
