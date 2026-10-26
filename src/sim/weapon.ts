// État d'une arme : cadence, chargeur, réserve, rechargement. Logique pure, pilotée par les données.
import type { WeaponDef } from '../data/schemas';

export type FireResult = 'fired' | 'cooldown' | 'reloading' | 'empty';

export class WeaponState {
  ammo: number;
  reserve: number;
  private cooldown = 0;
  private reloadLeft = 0;

  constructor(readonly def: WeaponDef) {
    this.ammo = def.magazine;
    this.reserve = def.reserve;
  }

  get reloading(): boolean {
    return this.reloadLeft > 0;
  }

  /** 0 → 1 pendant le rechargement. */
  get reloadProgress(): number {
    return this.reloading ? 1 - this.reloadLeft / this.def.reloadTime : 0;
  }

  update(dt: number): boolean {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.reloadLeft > 0) {
      this.reloadLeft -= dt;
      if (this.reloadLeft <= 0) {
        this.reloadLeft = 0;
        const take = Math.min(this.def.magazine - this.ammo, this.reserve);
        this.ammo += take;
        this.reserve -= take;
        return true; // rechargement terminé
      }
    }
    return false;
  }

  tryFire(): FireResult {
    if (this.reloading) return 'reloading';
    if (this.cooldown > 0) return 'cooldown';
    if (this.ammo <= 0) {
      this.startReload();
      return 'empty';
    }
    this.ammo--;
    this.cooldown = 1 / this.def.fireRate;
    return 'fired';
  }

  startReload(): boolean {
    if (this.reloading || this.ammo >= this.def.magazine || this.reserve <= 0) return false;
    this.reloadLeft = this.def.reloadTime;
    return true;
  }
}

/** Angle de tir avec dispersion uniforme dans ±spread/2 (rng injectable pour les tests). */
export function spreadAngle(baseAngle: number, spreadDeg: number, rng: () => number = Math.random): number {
  return baseAngle + (rng() - 0.5) * ((spreadDeg * Math.PI) / 180);
}
