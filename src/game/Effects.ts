// Effets visuels : particules (pool), flash de bouche, traceurs, étoiles d'étourdissement.
// Tout est dessiné en pixels pleins à la résolution interne, sans flou.
import Phaser from 'phaser';
import { C } from '../ui/theme';
import { DEPTH } from './World';

interface Particle {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  life: number;
  floorY: number;
}

export class Effects {
  private pool: Particle[] = [];
  private live: Particle[] = [];
  readonly g: Phaser.GameObjects.Graphics;
  private flashes: { x: number; y: number; dx: number; dy: number; t: number }[] = [];
  private stars: { x: number; y: number }[] = [];
  private time = 0;

  constructor(readonly scene: Phaser.Scene, readonly maxParticles = 400) {
    this.g = scene.add.graphics().setDepth(DEPTH.tracer);
  }

  private take(): Particle | null {
    let p = this.pool.pop();
    if (!p) {
      if (this.live.length >= this.maxParticles) return null;
      p = { img: this.scene.add.image(0, 0, 'props', 'px1').setOrigin(0, 0).setDepth(DEPTH.fx), x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, floorY: 0 };
    }
    p.img.setVisible(true);
    this.live.push(p);
    return p;
  }

  /** Gerbe de particules en coordonnées écran ; `floor` = ordonnée du sol (rebond / arrêt). */
  burst(x: number, y: number, n: number, color: number, opts: { speed?: number; dirX?: number; dirY?: number; spread?: number; gravity?: number; life?: number; big?: boolean; floor?: number } = {}): void {
    const { speed = 60, dirX = 0, dirY = -1, spread = Math.PI, gravity = 160, life = 0.35, big = false, floor = y + 6 } = opts;
    const base = Math.atan2(dirY, dirX);
    for (let i = 0; i < n; i++) {
      const p = this.take();
      if (!p) return;
      const a = base + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.8);
      Object.assign(p, { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: gravity, life: life * (0.6 + Math.random() * 0.6), floorY: floor });
      p.img.setFrame(big && Math.random() < 0.5 ? 'px2' : 'px1').setTint(color).setAlpha(1);
    }
  }

  muzzle(x: number, y: number, dx: number, dy: number): void {
    this.flashes.push({ x, y, dx, dy, t: 0.05 });
  }

  /** Étoiles d'étourdissement (positions écran), à fournir à chaque image. */
  stun(x: number, y: number): void {
    this.stars.push({ x, y });
  }

  update(dt: number, tracers: { x0: number; y0: number; x1: number; y1: number }[]): void {
    this.time += dt;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.img.setVisible(false);
        this.live.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > p.floorY && p.vy > 0) {
        p.y = p.floorY;
        p.vy *= -0.25;
        p.vx *= 0.5;
      }
      p.img.setPosition(Math.round(p.x), Math.round(p.y));
      if (p.life < 0.08) p.img.setAlpha(0.5);
    }
    const g = this.g;
    g.clear();
    for (const t of tracers) {
      g.lineStyle(1, C.tracer, 1).lineBetween(Math.round(t.x0), Math.round(t.y0), Math.round(t.x1), Math.round(t.y1));
      const mx = (t.x0 + t.x1) / 2, my = (t.y0 + t.y1) / 2;
      g.lineStyle(1, C.tracerCore, 1).lineBetween(Math.round(mx), Math.round(my), Math.round(t.x1), Math.round(t.y1));
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.t -= dt;
      if (f.t <= 0) { this.flashes.splice(i, 1); continue; }
      const x = Math.round(f.x), y = Math.round(f.y);
      g.fillStyle(C.flash).fillRect(x - 2, y, 5, 1).fillRect(x, y - 2, 1, 5);
      g.fillStyle(C.tracerCore).fillRect(x - 1, y, 3, 1).fillRect(x, y - 1, 1, 3);
      for (let k = 1; k <= 4; k++) g.fillStyle(k < 3 ? C.flash : C.action).fillRect(Math.round(x + f.dx * (k + 1)), Math.round(y + f.dy * (k + 1)), 1, 1);
    }
    for (const s of this.stars) {
      for (let k = 0; k < 3; k++) {
        const a = this.time * 6 + (k * Math.PI * 2) / 3;
        const x = Math.round(s.x + Math.cos(a) * 7), y = Math.round(s.y + Math.sin(a) * 2);
        g.fillStyle(0xffe678).fillRect(x, y, 1, 1);
        g.fillStyle(0xffb43c).fillRect(x + 1, y, 1, 1);
      }
    }
    this.stars.length = 0;
  }

  get particleCount(): number {
    return this.live.length;
  }
}
