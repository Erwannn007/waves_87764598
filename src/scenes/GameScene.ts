// Scène de jeu : boucle de simulation (joueur, Rôdeurs, balles), caméra, rendu, effets.
import Phaser from 'phaser';
import type { AssetManifest } from '../core/assets';
import { depthOf, screenDirToWorld, toScreen, toWorld } from '../core/iso';
import { settings } from '../core/settings';
import { sfx, unlockAudio, vibrate, type SfxName } from '../core/sfx';
import type { EnemyDef, MapDef, WeaponDef } from '../data/schemas';
import { inflate, resolve, segmentCircle, segmentCollider, separate } from '../sim/collision';
import { spreadAngle } from '../sim/weapon';
import { controls } from '../game/controls';
import { Effects } from '../game/Effects';
import { Player } from '../game/Player';
import { Rodeur } from '../game/Rodeur';
import { World, type PropInstance } from '../game/World';
import { C } from '../ui/theme';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  travelled: number;
  def: WeaponDef;
  alive: boolean;
}

const BULLET_Z = 0.9;

export class GameScene extends Phaser.Scene {
  world!: World;
  player!: Player;
  zombies: Rodeur[] = [];
  bullets: Bullet[] = [];
  effects!: Effects;
  targetCount = 1;
  kills = 0;
  private respawnQueue: number[] = [];
  private assets!: AssetManifest;
  private map!: MapDef;
  private enemyDef!: EnemyDef;
  private camX = 0;
  private camY = 0;
  private flowT = 0;
  private deadT = 0;
  private emptyT = 0;
  private groanT = 2;
  private mouseDown = false;
  private mouseAimAt = -1;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  /** Signal de dégâts pour le HUD (vignette rouge). */
  hurtFlash = 0;

  constructor() {
    super('game');
  }

  create(): void {
    this.assets = this.registry.get('assets');
    this.map = this.registry.get('map');
    const weapons = this.registry.get('weapons') as Record<string, WeaponDef>;
    const enemies = this.registry.get('enemies') as Record<string, EnemyDef>;
    this.enemyDef = enemies.rodeur;
    this.zombies = [];
    this.bullets = [];
    this.kills = 0;
    this.respawnQueue = [];
    this.cameras.main.setBackgroundColor(0x0e0c0a);
    this.world = new World(this, this.map, this.assets);
    const sa = this.assets.props.anchors.shadow_actor;
    this.player = new Player(this, this.map.player.x, this.map.player.y, weapons.ar_scavenger, this.assets.characters.survivor_legs, this.assets.characters.survivor_upper, sa);
    this.player.onReloaded = () => sfx.reloadEnd();
    this.effects = new Effects(this);
    for (let i = 0; i < this.targetCount; i++) this.spawnZombie();
    const s = toScreen(this.player.x, this.player.y);
    this.camX = s.x;
    this.camY = s.y;

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,Z,Q,UP,DOWN,LEFT,RIGHT,R,F,SHIFT') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown-R', () => this.requestReload());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      unlockAudio();
      if (!p.wasTouch && p.leftButtonDown()) this.mouseDown = true;
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => { if (!p.wasTouch) this.mouseDown = false; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (!p.wasTouch) this.mouseAimAt = this.time.now; });
    this.scene.launch('hud');
    this.events.once('shutdown', () => this.scene.stop('hud'));
    (window as unknown as { __waves?: unknown }).__waves = this;
  }

  requestReload(): void {
    if (this.player.weapon.startReload()) sfx.reloadStart();
  }

  setZombieCount(n: number): void {
    this.targetCount = Math.max(1, Math.min(40, n));
    const alive = this.zombies.filter((z) => z.alive).length + this.respawnQueue.length;
    for (let i = alive; i < this.targetCount; i++) this.spawnZombie();
  }

  spawnZombie(): void {
    const far = this.map.spawns.filter((p) => Math.hypot(p.x - this.player.x, p.y - this.player.y) > 9);
    const list = far.length ? far : this.map.spawns;
    const sp = list[Math.floor(Math.random() * list.length)];
    const z = new Rodeur(this, sp.x + (Math.random() - 0.5) * 3, sp.y + (Math.random() - 0.5) * 3, this.enemyDef, this.assets.characters.rodeur, this.assets.props.anchors.shadow_actor);
    this.zombies.push(z);
  }

  private readInput(): { move: { x: number; y: number; m: number }; aim: { x: number; y: number } | null; firing: boolean } {
    const k = this.keys;
    let mx = controls.move.x, my = controls.move.y;
    const kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.Q.isDown || k.LEFT.isDown ? 1 : 0);
    const ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.Z.isDown || k.UP.isDown ? 1 : 0);
    if (kx || ky) {
      const l = Math.hypot(kx, ky);
      const run = k.SHIFT.isDown ? 1 : 0.8;
      mx = (kx / l) * run;
      my = (ky / l) * run;
    }
    const m = Math.min(1, Math.hypot(mx, my));
    const dir = screenDirToWorld(mx, my);
    let aim: { x: number; y: number } | null = null;
    let firing = controls.fireHeld;
    if (controls.aimActive) {
      aim = screenDirToWorld(controls.aim.x, controls.aim.y);
      if (settings.autoFire && Math.hypot(controls.aim.x, controls.aim.y) > 0.7) firing = true;
    } else if (!controls.touchUsed && this.mouseAimAt >= 0) {
      const p = this.input.activePointer;
      const cam = this.cameras.main;
      const w = toWorld(p.x + cam.scrollX, p.y + cam.scrollY + Math.round(BULLET_Z * 26));
      const dx = w.x - this.player.x, dy = w.y - this.player.y;
      const l = Math.hypot(dx, dy);
      if (l > 0.2) aim = { x: dx / l, y: dy / l };
      firing ||= this.mouseDown;
    }
    return { move: { x: dir.x, y: dir.y, m }, aim, firing };
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    const p = this.player;
    const input = this.readInput();
    if (controls.reloadRequested) {
      controls.reloadRequested = false;
      this.requestReload();
    }
    p.update(dt, input.move, input.aim, input.firing && !p.dead);
    resolve(p, this.world.colliders);
    if (input.firing && !p.dead) this.fire();
    this.emptyT -= dt;

    // Rôdeurs.
    this.flowT -= dt;
    if (this.flowT <= 0) {
      this.world.updateFlow(p.x, p.y, 0.32);
      this.flowT = 0.15;
    }
    const colliders = this.world.colliders;
    const target = { x: p.x, y: p.y, alive: !p.dead };
    for (const z of this.zombies) {
      let steer: { x: number; y: number } | null = null;
      if (z.alive) {
        const dx = p.x - z.x, dy = p.y - z.y;
        const d = Math.hypot(dx, dy) || 1;
        // Ligne de vue testée avec des obstacles élargis du rayon du Rôdeur (sinon il accroche les coins).
        const clear = !colliders.some((c) => c.tag !== 'wall' && segmentCollider(z.x, z.y, p.x, p.y, inflate(c, z.r)) !== null);
        steer = (clear ? null : this.world.flow.direction(z.x, z.y)) ?? { x: dx / d, y: dy / d };
      }
      if (z.update(dt, steer, target) === 'strike') {
        sfx.swipe();
        if (p.hurt(this.enemyDef.attackDamage)) {
          sfx.hurt();
          vibrate(40);
          this.hurtFlash = 1;
          this.cameras.main.shake(90, 0.006);
        }
      }
      if (z.alive) resolve(z, colliders);
    }
    for (let i = 0; i < this.zombies.length; i++) {
      const a = this.zombies[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < this.zombies.length; j++) if (this.zombies[j].alive) separate(a, this.zombies[j]);
      if (!p.dead) separate(p, a, 0.25);
    }
    this.groanT -= dt;
    if (this.groanT <= 0 && this.zombies.some((z) => z.alive)) {
      sfx.groan();
      this.groanT = 2.5 + Math.random() * 3;
    }
    for (const z of this.zombies) if (z.removed) z.destroy();
    this.zombies = this.zombies.filter((z) => !z.removed);
    this.respawnQueue = this.respawnQueue.map((t) => t - dt);
    while (this.respawnQueue.length && this.respawnQueue[0] <= 0) {
      this.respawnQueue.shift();
      this.spawnZombie();
    }

    // Mort du joueur : réapparition au centre (prototype).
    if (p.dead) {
      this.deadT += dt;
      if (this.deadT > 2.5) {
        this.deadT = 0;
        p.respawn(this.map.player.x, this.map.player.y);
      }
    }

    const tracers = this.updateBullets(dt);
    this.renderFrame(dt, input.aim);
    this.effects.update(dt, tracers);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3);
  }

  private fire(): void {
    const p = this.player;
    const res = p.weapon.tryFire();
    if (res === 'empty') {
      if (this.emptyT <= 0) {
        sfx.empty();
        this.emptyT = 0.3;
      }
      if (p.weapon.reloading) sfx.reloadStart();
      return;
    }
    if (res !== 'fired') return;
    const def = p.weapon.def;
    const m = p.muzzle();
    const base = Math.atan2(p.aimY, p.aimX);
    for (let i = 0; i < def.pellets; i++) {
      const a = spreadAngle(base, def.spreadDeg);
      this.bullets.push({ x: m.wx, y: m.wy, vx: Math.cos(a) * def.projectileSpeed, vy: Math.sin(a) * def.projectileSpeed, travelled: 0, def, alive: true });
    }
    p.setUpper('shoot');
    const sd = toScreen(p.aimX, p.aimY);
    const l = Math.hypot(sd.x, sd.y) || 1;
    this.effects.muzzle(m.sx, m.sy, sd.x / l, sd.y / l);
    // Douille éjectée sur le côté.
    this.effects.burst(m.sx - (sd.x / l) * 10, m.sy + 2, 1, 0xd8a84a, { speed: 50, dirX: -sd.y / l, dirY: -0.8, spread: 0.6, gravity: 260, life: 0.6, floor: m.sy + 22 });
    (sfx[def.sfx as SfxName] ?? sfx.shot_ar)();
  }

  private updateBullets(dt: number): { x0: number; y0: number; x1: number; y1: number }[] {
    const tracers: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const blockers = this.world.bulletBlockers();
    for (const b of this.bullets) {
      if (!b.alive) continue;
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      let bestT = Infinity;
      let hitZ: Rodeur | null = null;
      let hitP: PropInstance | null = null;
      let hitWall = false;
      for (const z of this.zombies) {
        if (!z.alive) continue;
        const t = segmentCircle(b.x, b.y, nx, ny, z.x, z.y, z.r + 0.05);
        if (t !== null && t < bestT) { bestT = t; hitZ = z; hitP = null; }
      }
      for (const pr of blockers) {
        const t = segmentCollider(b.x, b.y, nx, ny, pr.collider!);
        if (t !== null && t < bestT) { bestT = t; hitP = pr; hitZ = null; }
      }
      for (const w of this.world.walls) {
        const t = segmentCollider(b.x, b.y, nx, ny, w);
        if (t !== null && t < bestT) { bestT = t; hitWall = true; hitZ = null; hitP = null; }
      }
      const t = Math.min(1, bestT);
      const hx = b.x + (nx - b.x) * t, hy = b.y + (ny - b.y) * t;
      const s0 = toScreen(b.x - b.vx * 0.03, b.y - b.vy * 0.03, BULLET_Z);
      const s1 = toScreen(hx, hy, BULLET_Z);
      tracers.push({ x0: s0.x, y0: s0.y, x1: s1.x, y1: s1.y });
      b.travelled += Math.hypot(hx - b.x, hy - b.y);
      b.x = hx;
      b.y = hy;
      const dir = Math.hypot(b.vx, b.vy);
      const ux = b.vx / dir, uy = b.vy / dir;
      const sdir = toScreen(ux, uy);
      const floor = toScreen(hx, hy).y;
      if (hitZ) {
        b.alive = false;
        const died = hitZ.hit(b.def.damage, ux, uy, b.def.knockback, b.def.stagger);
        sfx.hitFlesh();
        this.effects.burst(s1.x, s1.y, 4, C.spark, { speed: 70, dirX: -sdir.x, dirY: -sdir.y, spread: 1.6, gravity: 120, life: 0.18 });
        this.effects.burst(s1.x, s1.y, died ? 14 : 6, Math.random() < 0.5 ? C.ichor : C.ichorDark, { speed: 55, dirX: sdir.x, dirY: sdir.y - 0.5, spread: 1.4, life: 0.5, big: true, floor });
        if (died) {
          this.kills++;
          sfx.death();
          this.respawnQueue.push(2 + Math.random());
        }
      } else if (hitP) {
        b.alive = false;
        const state = this.world.damageProp(hitP, b.def.damage * b.def.structureDamage);
        const wood = hitP.id === 'barricade';
        if (state) sfx.breakWood();
        else (wood ? sfx.hitWood : sfx.hitWorld)();
        this.effects.burst(s1.x, s1.y, state ? 18 : 4, wood ? C.wood : 0xa9abb5, { speed: state ? 70 : 45, dirX: -sdir.x, dirY: -sdir.y, spread: 2, life: 0.45, big: !!state, floor });
        if (state) this.flowT = 0;
      } else if (hitWall || b.travelled >= b.def.range) {
        b.alive = false;
      }
    }
    this.bullets = this.bullets.filter((b) => b.alive);
    return tracers;
  }

  private renderFrame(dt: number, aim: { x: number; y: number } | null): void {
    const p = this.player;
    p.render(dt);
    for (const z of this.zombies) {
      const h = z.render();
      if (z.state === 'stun') this.effects.stun(h.headX, h.headY);
    }
    const ps = toScreen(p.x, p.y);
    this.world.updateOcclusion(ps.x, ps.y - 20, depthOf(p.x, p.y));
    // Caméra : suit le joueur avec amortissement et une légère avance dans la direction visée.
    const { width: w, height: h } = this.scale;
    let tx = ps.x, ty = ps.y - 16;
    if (aim) {
      const a = toScreen(aim.x, aim.y);
      const l = Math.hypot(a.x, a.y) || 1;
      tx += (a.x / l) * 24;
      ty += (a.y / l) * 16;
    }
    const k = 1 - Math.exp(-dt * 8);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    this.cameras.main.setScroll(Math.round(this.camX - w / 2), Math.round(this.camY - h / 2));
  }
}
