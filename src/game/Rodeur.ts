// Rôdeur : poursuite (ligne de vue directe ou champ de navigation), attaque avec préparation,
// réaction aux impacts, étourdissement, défaite puis dissolution.
import Phaser from 'phaser';
import { frameAt, type SheetMeta } from '../core/assets';
import { depthOf, dirIndex, toScreen } from '../core/iso';
import type { EnemyDef } from '../data/schemas';
import { DEPTH } from './World';

export type RodeurState = 'chase' | 'attack' | 'hit' | 'stun' | 'dead';

export class Rodeur {
  x: number;
  y: number;
  r: number;
  hp: number;
  state: RodeurState = 'chase';
  dir = 0;
  private anim = 'walk';
  private t = 0;
  private stateT = 0;
  private stagger = 0;
  private cooldown = 0;
  private struck = false;
  private flashT = 0;
  private kbx = 0;
  private kby = 0;
  /** Temps écoulé depuis la mort (dissolution puis suppression). */
  deadT = 0;
  removed = false;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly def: EnemyDef, readonly meta: SheetMeta, private shadowAnchor: [number, number]) {
    this.x = x;
    this.y = y;
    this.r = def.radius;
    this.hp = def.hp;
    this.shadow = scene.add.image(0, 0, 'props', 'shadow_actor').setOrigin(0, 0).setAlpha(0.38).setDepth(DEPTH.shadow + 1);
    this.sprite = scene.add.sprite(0, 0, def.sprite, 0).setOrigin(0, 0);
    this.t = Math.random() * 1000;
  }

  get alive(): boolean {
    return this.state !== 'dead';
  }

  private set(state: RodeurState, anim: string): void {
    this.state = state;
    this.anim = anim;
    this.t = 0;
    this.stateT = 0;
  }

  /**
   * steer : direction de déplacement souhaitée (au sol) ; target : position du joueur.
   * Renvoie 'strike' à l'image où le coup porte.
   */
  update(dt: number, steer: { x: number; y: number } | null, target: { x: number; y: number; alive: boolean }): 'strike' | null {
    this.t += dt * 1000;
    this.stateT += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    // Recul amorti.
    this.x += this.kbx * dt * 10;
    this.y += this.kby * dt * 10;
    this.kbx *= Math.exp(-dt * 10);
    this.kby *= Math.exp(-dt * 10);
    const dx = target.x - this.x, dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    let event: 'strike' | null = null;
    switch (this.state) {
      case 'dead':
        this.deadT += dt;
        return null;
      case 'hit':
        if (this.stateT > 0.18) this.set('chase', 'walk');
        break;
      case 'stun':
        if (this.stateT > this.def.stunTime) this.set('chase', 'walk');
        break;
      case 'attack': {
        const a = this.meta.anims.attack;
        if (!this.struck && this.stateT >= this.def.attackWindup) {
          this.struck = true;
          if (target.alive && dist <= this.def.attackRange + 0.35) event = 'strike';
        }
        if (this.t >= a.count * a.frameMs + 120) {
          this.cooldown = this.def.attackCooldown;
          this.set('chase', 'walk');
        }
        break;
      }
      case 'chase': {
        if (target.alive && dist <= this.def.attackRange && this.cooldown <= 0) {
          this.dir = dirIndex(dx, dy);
          this.struck = false;
          this.set('attack', 'attack');
          break;
        }
        if (!target.alive || dist > this.def.aggroRange) {
          this.anim = 'idle';
          break;
        }
        this.anim = 'walk';
        if (steer) {
          // Accélère en approche : marche traînante au loin, poursuite près du joueur.
          const speed = dist < 7 ? this.def.chaseSpeed : this.def.speed;
          this.x += steer.x * speed * dt;
          this.y += steer.y * speed * dt;
          this.dir = dirIndex(steer.x, steer.y);
        }
        break;
      }
    }
    return event;
  }

  /** Impact de balle. Renvoie true si le Rôdeur meurt. */
  hit(damage: number, dirX: number, dirY: number, knockback: number, stagger: number): boolean {
    if (!this.alive) return false;
    this.hp -= damage;
    this.flashT = 0.06;
    const kb = knockback * (1 - this.def.knockbackResist);
    this.kbx += dirX * kb;
    this.kby += dirY * kb;
    if (this.hp <= 0) {
      this.set('dead', 'death');
      this.dir = dirIndex(-dirX, -dirY); // tombe en arrière, dos au tireur
      return true;
    }
    this.stagger += stagger;
    if (this.state === 'stun') return false;
    if (this.stagger >= this.def.staggerThreshold) {
      this.stagger = 0;
      this.set('stun', 'hit');
    } else if (this.state !== 'attack') this.set('hit', 'hit');
    return false;
  }

  render(): { headX: number; headY: number } {
    const s = toScreen(this.x, this.y);
    const sx = Math.round(s.x), sy = Math.round(s.y);
    const [ax, ay] = this.meta.anchor;
    let frame: number;
    if (this.state === 'stun') frame = frameAt(this.meta, 'hit', this.dir, 70); // pose d'impact tenue
    else frame = frameAt(this.meta, this.anim, this.dir, this.t);
    this.sprite.setFrame(frame).setPosition(sx - ax, sy - ay).setDepth(this.alive ? depthOf(this.x, this.y) : depthOf(this.x, this.y) - 2);
    this.shadow.setPosition(sx - this.shadowAnchor[0], sy - this.shadowAnchor[1]).setVisible(this.alive);
    if (this.flashT > 0) this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    // Dissolution par paliers (pas de fondu continu) après 2,5 s au sol.
    if (!this.alive) {
      const k = this.deadT - 2.5;
      this.sprite.setAlpha(k <= 0 ? 1 : k < 0.2 ? 0.66 : k < 0.4 ? 0.33 : 0);
      if (k >= 0.4) this.removed = true;
    }
    return { headX: sx, headY: sy - 44 };
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
