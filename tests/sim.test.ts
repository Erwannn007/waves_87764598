import { describe, expect, it } from 'vitest';
import { Destructible } from '../src/sim/destructible';
import { FlowField } from '../src/sim/flowfield';

describe('structure destructible', () => {
  it('passe par intact → endommagé → détruit', () => {
    const d = new Destructible(100);
    expect(d.state).toBe('intact');
    expect(d.damage(30)).toBeNull();
    expect(d.damage(30)).toBe('damaged');
    expect(d.damage(100)).toBe('destroyed');
    expect(d.hp).toBe(0);
    expect(d.damage(10)).toBeNull();
  });
});

describe('champ de navigation', () => {
  it('contourne un mur', () => {
    const f = new FlowField(10, 10, 1);
    // Mur vertical en x = 5, ouvert en haut (y = 9).
    f.rasterize([{ kind: 'box', x: 5.5, y: 4, hx: 0.5, hy: 4.6 }], 0);
    f.compute(8.5, 1.5);
    let x = 1.5, y = 1.5;
    for (let i = 0; i < 60; i++) {
      const d = f.direction(x, y);
      if (!d) break;
      x += d.x * 0.5;
      y += d.y * 0.5;
      expect(f.blocked[f.cellOf(x, y)]).toBe(0);
    }
    expect(Math.hypot(x - 8.5, y - 1.5)).toBeLessThan(1);
  });
  it('renvoie null si la cible est inaccessible', () => {
    const f = new FlowField(6, 6, 1);
    f.rasterize([{ kind: 'box', x: 3, y: 3, hx: 0.5, hy: 3 }], 0);
    f.compute(5.5, 3);
    expect(f.direction(0.5, 3)).toBeNull();
  });
});
