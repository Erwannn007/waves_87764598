import { describe, expect, it } from 'vitest';
import weapons from '../src/data/weapons.json';
import { parseRecord, WeaponSchema } from '../src/data/schemas';
import { spreadAngle, WeaponState } from '../src/sim/weapon';

const ar = parseRecord(WeaponSchema, weapons, 'arme').ar_scavenger;

describe('arme (pilotée par les données)', () => {
  it('respecte la cadence de tir', () => {
    const w = new WeaponState(ar);
    expect(w.tryFire()).toBe('fired');
    expect(w.tryFire()).toBe('cooldown');
    w.update(1 / ar.fireRate + 1e-6);
    expect(w.tryFire()).toBe('fired');
    expect(w.ammo).toBe(ar.magazine - 2);
  });
  it('ne tire pas à vide et recharge automatiquement', () => {
    const w = new WeaponState(ar);
    w.ammo = 0;
    expect(w.tryFire()).toBe('empty');
    expect(w.reloading).toBe(true);
    expect(w.tryFire()).toBe('reloading');
  });
  it('recharge en exactement reloadTime et prélève la réserve', () => {
    const w = new WeaponState(ar);
    w.ammo = 10;
    expect(w.startReload()).toBe(true);
    expect(w.update(ar.reloadTime - 0.01)).toBe(false);
    expect(w.ammo).toBe(10);
    expect(w.update(0.02)).toBe(true);
    expect(w.ammo).toBe(ar.magazine);
    expect(w.reserve).toBe(ar.reserve - (ar.magazine - 10));
  });
  it('refuse un rechargement inutile ou impossible', () => {
    const w = new WeaponState(ar);
    expect(w.startReload()).toBe(false); // chargeur plein
    w.ammo = 0;
    w.reserve = 0;
    expect(w.startReload()).toBe(false); // réserve vide
  });
  it('recharge partiellement si la réserve est insuffisante', () => {
    const w = new WeaponState(ar);
    w.ammo = 0;
    w.reserve = 7;
    w.startReload();
    w.update(ar.reloadTime + 0.01);
    expect(w.ammo).toBe(7);
    expect(w.reserve).toBe(0);
  });
  it('la dispersion reste dans ±spread/2', () => {
    const half = (ar.spreadDeg * Math.PI) / 360;
    expect(spreadAngle(0, ar.spreadDeg, () => 0)).toBeCloseTo(-half);
    expect(spreadAngle(0, ar.spreadDeg, () => 1)).toBeCloseTo(half);
  });
  it('une nouvelle arme ne demande qu’une entrée de données', () => {
    const pistol = WeaponSchema.parse({ name: 'Pistolet', category: 'pistol', damage: 30, fireRate: 3, magazine: 12, reserve: 60, reloadTime: 1.2, range: 18, projectileSpeed: 40, automatic: false });
    const w = new WeaponState(pistol);
    expect(w.tryFire()).toBe('fired');
    expect(w.ammo).toBe(11);
    expect(pistol.pellets).toBe(1); // valeur par défaut
  });
});
