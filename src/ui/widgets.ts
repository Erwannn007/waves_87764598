// Widgets pixel art dessinés à la résolution interne : boutons à états, panneaux, barres, joysticks.
import Phaser from 'phaser';
import { sfx } from '../core/sfx';
import { C } from './theme';

export type ButtonState = 'normal' | 'hover' | 'pressed' | 'selected' | 'disabled';
type Kind = 'action' | 'neutral';

export function text(scene: Phaser.Scene, x: number, y: number, str: string, scale = 1, color: number = C.text): Phaser.GameObjects.BitmapText {
  return scene.add.bitmapText(x, y, 'font', str.toUpperCase(), 6).setScale(scale).setTint(color);
}

export function drawPanel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number = C.panel): void {
  g.fillStyle(C.ink).fillRect(x + 1, y, w - 2, h).fillRect(x, y + 1, w, h - 2);
  g.fillStyle(fill).fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(C.bevel).fillRect(x + 2, y + 1, w - 4, 1).fillRect(x + 1, y + 2, 1, h - 4);
  g.fillStyle(C.panelDeep).fillRect(x + 2, y + h - 2, w - 4, 1);
}

export function drawBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, frac: number, fill: number, dark: number): void {
  g.fillStyle(C.ink).fillRect(x, y, w, h);
  g.fillStyle(C.panelDeep).fillRect(x + 1, y + 1, w - 2, h - 2);
  const fw = Math.round((w - 2) * Math.max(0, Math.min(1, frac)));
  g.fillStyle(fill).fillRect(x + 1, y + 1, fw, h - 2);
  g.fillStyle(dark).fillRect(x + 1, y + h - 2, fw, 1);
  g.fillStyle(C.ink);
  for (let i = x + 7; i < x + w - 1; i += 6) g.fillRect(i, y + 1, 1, h - 2);
}

export class Button {
  readonly g: Phaser.GameObjects.Graphics;
  readonly label: Phaser.GameObjects.BitmapText;
  state: ButtonState = 'normal';
  selected = false;
  disabled = false;
  visible = true;
  /** Marge tactile autour du dessin (cible minimale ≈ 44 pt). */
  touchPad = 4;
  pointerId: number | null = null;

  constructor(
    readonly scene: Phaser.Scene,
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    labelText: string,
    readonly onClick: () => void,
    readonly kind: Kind = 'neutral',
    private labelScale = 1,
  ) {
    this.g = scene.add.graphics();
    this.label = text(scene, 0, 0, labelText, labelScale);
    this.redraw();
  }

  setText(t: string): this {
    this.label.setText(t.toUpperCase());
    this.redraw();
    return this;
  }

  setRect(x: number, y: number, w = this.w, h = this.h): this {
    Object.assign(this, { x, y, w, h });
    this.redraw();
    return this;
  }

  setVisible(v: boolean): this {
    this.visible = v;
    this.g.setVisible(v);
    this.label.setVisible(v);
    return this;
  }

  setDepth(d: number): this {
    this.g.setDepth(d);
    this.label.setDepth(d + 1);
    return this;
  }

  contains(px: number, py: number): boolean {
    const p = this.touchPad;
    return this.visible && px >= this.x - p && px < this.x + this.w + p && py >= this.y - p && py < this.y + this.h + p;
  }

  redraw(): void {
    const { g, x, y, w, h } = this;
    const st: ButtonState = this.disabled ? 'disabled' : this.state === 'normal' && this.selected ? 'selected' : this.state;
    let fill: number = this.kind === 'action' ? C.action : C.panelRaised;
    let light: number = this.kind === 'action' ? C.actionLight : C.bevel;
    let dark: number = this.kind === 'action' ? C.actionDark : C.panelDeep;
    let txt: number = C.text;
    let dy = 0;
    if (st === 'hover') { fill = light; light = C.text; }
    if (st === 'pressed') { dy = 1; [light, dark] = [dark, light]; }
    if (st === 'disabled') { fill = C.panel; light = C.panelRaised; dark = C.panelDeep; txt = C.textOff; }
    g.clear();
    if (st !== 'pressed') g.fillStyle(C.ink).fillRect(x + 1, y + h, w - 2, 1);
    g.fillStyle(C.ink).fillRect(x + 1, y + dy, w - 2, h).fillRect(x, y + 1 + dy, w, h - 2);
    g.fillStyle(fill).fillRect(x + 1, y + 1 + dy, w - 2, h - 2);
    g.fillStyle(light).fillRect(x + 2, y + 1 + dy, w - 4, 1);
    g.fillStyle(dark).fillRect(x + 2, y + h - 2 + dy, w - 4, 1);
    if (this.selected) {
      g.fillStyle(C.accentLight);
      g.fillRect(x - 2, y - 2, w + 4, 1).fillRect(x - 2, y + h + 1, w + 4, 1).fillRect(x - 2, y - 2, 1, h + 4).fillRect(x + w + 1, y - 2, 1, h + 4);
    }
    const tw = this.label.width;
    const th = 5 * this.labelScale;
    this.label.setPosition(Math.round(x + (w - tw) / 2), Math.round(y + (h - th) / 2) + dy).setTint(txt);
  }

  setState(s: ButtonState): void {
    if (this.state !== s) {
      this.state = s;
      this.redraw();
    }
  }
}

/**
 * Route les pointeurs d'une scène vers ses boutons : pressé au toucher, déclenché au relâchement
 * seulement si le doigt est resté sur le bouton (on peut annuler en glissant hors du bouton).
 * Renvoie true si le pointeur a été pris par un bouton.
 */
export class ButtonRouter {
  readonly buttons: Button[] = [];
  constructor(readonly scene: Phaser.Scene) {}

  add(b: Button): Button {
    this.buttons.push(b);
    return b;
  }

  down(p: Phaser.Input.Pointer): boolean {
    for (const b of this.buttons) {
      if (b.disabled || !b.contains(p.x, p.y) || b.pointerId !== null) continue;
      b.pointerId = p.id;
      b.setState('pressed');
      return true;
    }
    return false;
  }

  move(p: Phaser.Input.Pointer): void {
    for (const b of this.buttons) {
      if (b.pointerId === p.id) b.setState(b.contains(p.x, p.y) ? 'pressed' : 'normal');
      else if (b.pointerId === null && !p.wasTouch && !b.disabled) b.setState(b.contains(p.x, p.y) ? 'hover' : 'normal');
    }
  }

  up(p: Phaser.Input.Pointer): boolean {
    for (const b of this.buttons) {
      if (b.pointerId !== p.id) continue;
      b.pointerId = null;
      const inside = b.contains(p.x, p.y);
      b.setState(inside && !p.wasTouch ? 'hover' : 'normal');
      if (inside) {
        sfx.ui();
        b.onClick();
      }
      return true;
    }
    return false;
  }

  /** Bouton tenu (pour le tir continu). */
  held(b: Button): boolean {
    return b.pointerId !== null && b.state === 'pressed';
  }
}

/** Joystick virtuel dynamique : apparaît sous le pouce, valeur normalisée dans le disque unité. */
export class Joystick {
  readonly g: Phaser.GameObjects.Graphics;
  pointerId: number | null = null;
  ox = 0;
  oy = 0;
  value = { x: 0, y: 0 };
  hint = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, readonly radius: number, private ring: number = C.text) {
    this.g = scene.add.graphics();
  }

  get active(): boolean {
    return this.pointerId !== null;
  }
  get magnitude(): number {
    return Math.hypot(this.value.x, this.value.y);
  }

  start(p: Phaser.Input.Pointer): void {
    this.pointerId = p.id;
    this.ox = p.x;
    this.oy = p.y;
    this.value = { x: 0, y: 0 };
  }

  move(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pointerId) return;
    let dx = p.x - this.ox, dy = p.y - this.oy;
    const d = Math.hypot(dx, dy);
    // Au-delà du rayon, l'origine suit le doigt (le joystick « glisse » au lieu de saturer).
    if (d > this.radius * 1.4) {
      const k = (d - this.radius * 1.4) / d;
      this.ox += dx * k;
      this.oy += dy * k;
      dx = p.x - this.ox;
      dy = p.y - this.oy;
    }
    const m = Math.min(1, Math.hypot(dx, dy) / this.radius);
    const a = Math.atan2(dy, dx);
    // Zone morte de 15 %, puis remise à l'échelle 0 → 1.
    const v = m < 0.15 ? 0 : (m - 0.15) / 0.85;
    this.value = { x: Math.cos(a) * v, y: Math.sin(a) * v };
  }

  end(p: Phaser.Input.Pointer): boolean {
    if (p.id !== this.pointerId) return false;
    this.pointerId = null;
    this.value = { x: 0, y: 0 };
    return true;
  }

  draw(): void {
    const g = this.g;
    g.clear();
    const cx = Math.round(this.active ? this.ox : this.hint.x);
    const cy = Math.round(this.active ? this.oy : this.hint.y);
    const alpha = this.active ? 0.65 : 0.22;
    g.lineStyle(1, this.ring, alpha).strokeCircle(cx, cy, this.radius);
    g.lineStyle(1, C.ink, alpha * 0.6).strokeCircle(cx, cy, this.radius - 1);
    const kr = Math.round(this.radius * 0.42);
    const kx = Math.round(cx + this.value.x * (this.radius - kr * 0.5));
    const ky = Math.round(cy + this.value.y * (this.radius - kr * 0.5));
    g.fillStyle(C.ink, alpha).fillCircle(kx, ky + 1, kr);
    g.fillStyle(C.textDim, alpha + 0.1).fillCircle(kx, ky, kr);
    g.fillStyle(C.text, alpha + 0.15).fillRect(kx - kr + 3, ky - kr + 2, kr, 2);
  }
}
