// Survivant : deux calques (jambes orientées selon le déplacement, buste selon la visée).
import Phaser from 'phaser';
import { frameAt, type SheetMeta } from '../core/assets';
import { depthOf, dirIndex, toScreen } from '../core/iso';
import type { WeaponDef } from '../data/schemas';
import { WeaponState } from '../sim/weapon';
import { DEPTH } from './World';

const WALK_SPEED = 2.9; // m/s
const RUN_SPEED = 4.3;
const FIRE_MOVE_FACTOR = 0.72;

export class Player {
  x: number;
  y: number;
  readonly r = 0.3;
  hp = 100;
  readonly maxHp = 100;
  weapon: WeaponState;
  aimX = 0;
  aimY = -1;
  moveDir = 0;
  aimDir = 0;
  private legsAnim = 'idle';
  private legsT = 0;
  private upperAnim = 'idle';
  private upperT = 0;
  private flashT = 0;
  dead = false;
  invulnT = 0;
  readonly legs: Phaser.GameObjects.Sprite;
  readonly upper: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, weapon: WeaponDef, readonly legsMeta: SheetMeta, readonly upperMeta: SheetMeta, private shadowAnchor: [number, number]) {
    this.x = x;
    this.y = y;
    this.weapon = new WeaponState(weapon);
    this.shadow = scene.add.image(0, 0, 'props', 'shadow_actor').setOrigin(0, 0).setAlpha(0.38).setDepth(DEPTH.shadow + 1);
    this.legs = scene.add.sprite(0, 0, 'survivor_legs', 0).setOrigin(0, 0);
    this.upper = scene.add.sprite(0, 0, 'survivor_upper', 0).setOrigin(0, 0);
    this.aimDir = dirIndex(this.aimX, this.aimY);
  }

  /** move : direction au sol × intensité (0..1) ; aim : direction au sol (null = garder). */
  update(dt: number, move: { x: number; y: number; m: number }, aim: { x: number; y: number } | null, firing: boolean): void {
    this.invulnT = Math.max(0, this.invulnT - dt);
    if (this.weapon.update(dt)) this.onReloaded?.();
    if (this.dead) return;
    const speed = (move.m > 0.85 ? RUN_SPEED : WALK_SPEED) * Math.min(1, move.m / 0.85) * (firing ? FIRE_MOVE_FACTOR : 1);
    this.x += move.x * speed * dt;
    this.y += move.y * speed * dt;
    if (aim) {
      this.aimX = aim.x;
      this.aimY = aim.y;
    } else if (move.m > 0.2 && !firing) {
      // Sans visée active, le buste suit progressivement la marche.
      this.aimX += (move.x - this.aimX) * Math.min(1, dt * 6);
      this.aimY += (move.y - this.aimY) * Math.min(1, dt * 6);
      const l = Math.hypot(this.aimX, this.aimY) || 1;
      this.aimX /= l;
      this.aimY /= l;
    }
    this.aimDir = dirIndex(this.aimX, this.aimY);
    const nextLegs = move.m < 0.12 ? 'idle' : move.m > 0.85 && !firing ? 'run' : 'walk';
    if (move.m >= 0.12) this.moveDir = dirIndex(move.x, move.y);
    else this.moveDir = this.aimDir;
    if (nextLegs !== this.legsAnim) {
      this.legsAnim = nextLegs;
      this.legsT = 0;
    }
    this.legsT += dt * 1000 * (nextLegs === 'walk' ? Math.max(0.6, move.m / 0.85) : 1);
    this.upperT += dt * 1000;
    const u = this.upperMeta.anims[this.upperAnim];
    const uDur = this.upperAnim === 'reload' ? this.weapon.def.reloadTime * 1000 : u.count * u.frameMs;
    if (this.weapon.reloading) this.setUpper('reload', false);
    else if (!u.loop && this.upperT >= uDur) this.setUpper('idle');
  }

  onReloaded?: () => void;

  setUpper(anim: string, restart = true): void {
    if (this.upperAnim === anim && !restart) return;
    this.upperAnim = anim;
    this.upperT = 0;
  }

  hurt(amount: number): boolean {
    if (this.dead || this.invulnT > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.flashT = 0.07;
    this.invulnT = 0.25;
    if (!this.weapon.reloading) this.setUpper('hit');
    if (this.hp <= 0) this.dead = true;
    return true;
  }

  respawn(x: number, y: number): void {
    Object.assign(this, { x, y, hp: this.maxHp, dead: false, invulnT: 1.5 });
    this.weapon = new WeaponState(this.weapon.def);
    this.setUpper('idle');
  }

  /** Point de départ des balles au sol et position écran de la bouche du canon. */
  muzzle(): { wx: number; wy: number; sx: number; sy: number } {
    const s = toScreen(this.x, this.y);
    const m = this.upperMeta.muzzle[this.upperMeta.dirs[this.aimDir]];
    return { wx: this.x + this.aimX * 0.55, wy: this.y + this.aimY * 0.55, sx: Math.round(s.x) + m[0], sy: Math.round(s.y) + m[1] + this.bob() };
  }

  private bob(): number {
    const a = this.legsMeta.anims[this.legsAnim];
    const i = Math.floor(this.legsT / a.frameMs) % a.count;
    return this.legsMeta.bob[this.legsAnim]?.[i] ?? 0;
  }

  render(dt: number): void {
    const s = toScreen(this.x, this.y);
    const sx = Math.round(s.x), sy = Math.round(s.y);
    const d = depthOf(this.x, this.y);
    const [lax, lay] = this.legsMeta.anchor;
    const [uax, uay] = this.upperMeta.anchor;
    this.legs.setFrame(frameAt(this.legsMeta, this.legsAnim, this.moveDir, this.legsT)).setPosition(sx - lax, sy - lay).setDepth(d);
    const dur = this.upperAnim === 'reload' ? this.weapon.def.reloadTime * 1000 : undefined;
    this.upper.setFrame(frameAt(this.upperMeta, this.upperAnim, this.aimDir, this.upperT, dur)).setPosition(sx - uax, sy - uay + this.bob()).setDepth(d + 0.01);
    this.shadow.setPosition(sx - this.shadowAnchor[0], sy - this.shadowAnchor[1]);
    this.flashT = Math.max(0, this.flashT - dt);
    const blink = this.invulnT > 0 && this.flashT === 0 && Math.floor(this.invulnT * 20) % 2 === 0;
    for (const sp of [this.legs, this.upper]) {
      if (this.flashT > 0) sp.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else sp.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      sp.setAlpha(this.dead ? 0.35 : blink ? 0.55 : 1);
    }
  }
}
