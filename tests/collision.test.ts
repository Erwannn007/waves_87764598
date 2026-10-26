import { describe, expect, it } from 'vitest';
import { pushOut, resolve, segmentBox, segmentCircle, separate, type Collider } from '../src/sim/collision';

describe('collisions logiques', () => {
  it('repousse un cercle hors d’un cercle', () => {
    const b = { x: 0.5, y: 0, r: 0.3 };
    expect(pushOut(b, { kind: 'circle', x: 0, y: 0, r: 0.4 })).toBe(true);
    expect(Math.hypot(b.x, b.y)).toBeCloseTo(0.7);
  });
  it('repousse un cercle hors d’un rectangle, y compris depuis l’intérieur', () => {
    const box: Collider = { kind: 'box', x: 0, y: 0, hx: 1, hy: 0.5 };
    const a = { x: 0, y: 0.7, r: 0.3 };
    pushOut(a, box);
    expect(a.y).toBeCloseTo(0.8);
    const inside = { x: 0.9, y: 0, r: 0.3 };
    pushOut(inside, box);
    expect(inside.x).toBeCloseTo(1.3);
  });
  it('ne bouge pas un corps sans contact', () => {
    const b = { x: 5, y: 5, r: 0.3 };
    expect(resolve(b, [{ kind: 'box', x: 0, y: 0, hx: 1, hy: 1 }])).toBe(false);
    expect(b).toEqual({ x: 5, y: 5, r: 0.3 });
  });
  it('sépare deux corps qui se chevauchent', () => {
    const a = { x: 0, y: 0, r: 0.3 }, b = { x: 0.4, y: 0, r: 0.3 };
    separate(a, b);
    expect(b.x - a.x).toBeCloseTo(0.6);
  });
  it('segment / cercle et segment / rectangle', () => {
    expect(segmentCircle(-2, 0, 2, 0, 0, 0, 0.5)).toBeCloseTo(0.375);
    expect(segmentCircle(-2, 1, 2, 1, 0, 0, 0.5)).toBeNull();
    expect(segmentBox(-3, 0, 3, 0, 0, 0, 1, 1)).toBeCloseTo(1 / 3);
    expect(segmentBox(-3, 2, 3, 2, 0, 0, 1, 1)).toBeNull();
  });
});
