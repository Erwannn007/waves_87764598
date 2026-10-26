import { describe, expect, it } from 'vitest';
import { dirIndex, PPU, screenDirToWorld, TILE_H, TILE_M, TILE_W, toScreen, toWorld } from '../src/core/iso';

describe('projection isométrique 2:1', () => {
  it('une tuile de 1,5 m fait 64×32 px', () => {
    const a = toScreen(0, 0), b = toScreen(TILE_M, 0), c = toScreen(0, TILE_M);
    expect(b.x - a.x).toBeCloseTo(TILE_W / 2);
    expect(b.y - a.y).toBeCloseTo(TILE_H / 2);
    expect(c.x - a.x).toBeCloseTo(TILE_W / 2);
    expect(c.y - a.y).toBeCloseTo(-TILE_H / 2);
  });
  it('écran ↔ sol est réversible', () => {
    for (const [x, y] of [[3.2, -1.4], [0, 0], [15.75, 15.75], [-7, 22]]) {
      const s = toScreen(x, y);
      const w = toWorld(s.x, s.y);
      expect(w.x).toBeCloseTo(x, 9);
      expect(w.y).toBeCloseTo(y, 9);
    }
  });
  it('un survivant de 1,55 m mesure environ 40 px', () => {
    expect(toScreen(0, 0).y - toScreen(0, 0, 1.55).y).toBeCloseTo(40.5, 0);
    expect(PPU).toBeCloseTo(30.17, 2);
  });
  it('joystick vers le haut de l’écran → déplacement qui monte à l’écran', () => {
    const d = screenDirToWorld(0, -1);
    const s = toScreen(d.x, d.y);
    expect(s.x).toBeCloseTo(0, 9);
    expect(s.y).toBeLessThan(0);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
    expect(screenDirToWorld(0, 0)).toEqual({ x: 0, y: 0 });
  });
  it('les 8 directions d’affichage suivent les directions écran', () => {
    const screenDirs: [number, number][] = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
    screenDirs.forEach(([sx, sy], k) => {
      const w = screenDirToWorld(sx, sy);
      expect(dirIndex(w.x, w.y)).toBe(k);
    });
  });
});
