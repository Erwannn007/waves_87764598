// HUD et commandes tactiles (scène superposée, sans défilement de caméra).
// Joystick gauche : déplacement. Moitié droite : visée. Le bouton TIR est lui-même un joystick :
// le toucher tire ET vise en glissant, ce qui permet le tir manuel avec un seul pouce.
import Phaser from 'phaser';
import { layout } from '../core/screen';
import { onSettingsChange, settings, updateSettings } from '../core/settings';
import { unlockAudio } from '../core/sfx';
import { controls } from '../game/controls';
import { C } from '../ui/theme';
import { Button, ButtonRouter, drawBar, drawPanel, Joystick, text } from '../ui/widgets';
import type { GameScene } from './GameScene';
import { VIEW_HEIGHTS } from './MenuScene';

export class HudScene extends Phaser.Scene {
  private router!: ButtonRouter;
  private left!: Joystick;
  private right!: Joystick;
  private fireBtn!: Button;
  private firePointer: number | null = null;
  private g!: Phaser.GameObjects.Graphics;
  private vignette!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.BitmapText;
  private ammoText!: Phaser.GameObjects.BitmapText;
  private reserveText!: Phaser.GameObjects.BitmapText;
  private infoText!: Phaser.GameObjects.BitmapText;
  private fpsText!: Phaser.GameObjects.BitmapText;
  private autoBtn!: Button;
  private sizeBtn!: Button;
  private fpsBtn!: Button;
  private unsub: (() => void) | null = null;

  constructor() {
    super('hud');
  }

  private get game_(): GameScene {
    return this.scene.get('game') as GameScene;
  }

  create(): void {
    Object.assign(controls, { move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, aimActive: false, fireHeld: false, reloadRequested: false });
    this.input.addPointer(3);
    this.router = new ButtonRouter(this);
    this.g = this.add.graphics();
    this.vignette = this.add.graphics().setDepth(100);
    this.left = new Joystick(this, 24);
    this.right = new Joystick(this, 24, C.accentLight);
    this.hpText = text(this, 0, 0, '', 1);
    this.ammoText = text(this, 0, 0, '', 2);
    this.reserveText = text(this, 0, 0, '', 1, C.textDim);
    this.infoText = text(this, 0, 0, '', 1, C.textDim);
    this.fpsText = text(this, 0, 0, '', 1, C.accentLight);
    this.fireBtn = new Button(this, 0, 0, 44, 44, 'TIR', () => undefined, 'action', 2);
    const reload = this.router.add(new Button(this, 0, 0, 34, 22, 'RECH.', () => { controls.reloadRequested = true; }));
    this.autoBtn = this.router.add(new Button(this, 0, 0, 52, 14, '', () => updateSettings({ autoFire: !settings.autoFire })));
    const plus1 = this.router.add(new Button(this, 0, 0, 22, 14, '+1', () => this.game_.setZombieCount(this.game_.targetCount + 1)));
    const plus10 = this.router.add(new Button(this, 0, 0, 26, 14, '+10', () => this.game_.setZombieCount(this.game_.targetCount + 10)));
    const reset = this.router.add(new Button(this, 0, 0, 26, 14, 'RAZ', () => this.game_.setZombieCount(1)));
    this.sizeBtn = this.router.add(new Button(this, 0, 0, 46, 14, '', () => {
      const i = VIEW_HEIGHTS.indexOf(settings.viewHeight);
      updateSettings({ viewHeight: VIEW_HEIGHTS[(i + 1) % VIEW_HEIGHTS.length] });
    }));
    this.fpsBtn = this.router.add(new Button(this, 0, 0, 26, 14, 'FPS', () => updateSettings({ showFps: !settings.showFps })));
    const menu = this.router.add(new Button(this, 0, 0, 30, 14, 'MENU', () => { this.scene.stop('game'); this.scene.start('menu'); }));
    for (const b of [reload, this.autoBtn, plus1, plus10, reset, this.sizeBtn, this.fpsBtn, menu]) b.touchPad = 5;
    this.layoutUi = () => {
      const { width: w, height: h } = this.scale;
      const s = layout.safe;
      const R = w - s.right, B = h - s.bottom, L = s.left;
      this.fireBtn.setRect(R - 56, B - 66);
      reload.setRect(R - 98, B - 40);
      const top = s.top + 4;
      menu.setRect(R - 34, top);
      this.fpsBtn.setRect(R - 64, top);
      this.sizeBtn.setRect(R - 114, top);
      this.autoBtn.setRect(R - 170, top);
      const cx = Math.round(w / 2);
      plus1.setRect(cx - 40, top + 26);
      plus10.setRect(cx - 14, top + 26);
      reset.setRect(cx + 16, top + 26);
      plus1.setRect(cx - 44, top + 26);
      this.left.hint = { x: L + 48, y: B - 44 };
      this.right.hint = { x: R - 130, y: B - 48 };
    };
    this.layoutUi();
    this.refreshLabels();
    this.unsub = onSettingsChange(() => this.refreshLabels());
    this.scale.on('resize', this.layoutUi, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.layoutUi, this); this.unsub?.(); });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      unlockAudio();
      if (p.wasTouch) controls.touchUsed = true;
      if (this.fireBtn.contains(p.x, p.y) && this.firePointer === null && p.wasTouch) {
        // TIR = joystick de visée + gâchette.
        this.firePointer = p.id;
        this.fireBtn.setState('pressed');
        if (!this.right.active) this.right.start(p);
        return;
      }
      if (this.router.down(p) || !p.wasTouch) return;
      if (p.x < this.scale.width / 2) { if (!this.left.active) this.left.start(p); }
      else if (!this.right.active) this.right.start(p);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.router.move(p);
      this.left.move(p);
      this.right.move(p);
    });
    const up = (p: Phaser.Input.Pointer) => {
      if (p.id === this.firePointer) {
        this.firePointer = null;
        this.fireBtn.setState('normal');
      }
      this.router.up(p);
      this.left.end(p);
      this.right.end(p);
    };
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    // Souris : clic sur TIR = tir au clic (pas de visée par glissement).
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (!p.wasTouch && this.fireBtn.contains(p.x, p.y)) this.firePointer = p.id; });
  }

  private layoutUi: () => void = () => undefined;

  private refreshLabels(): void {
    this.autoBtn.setText(`AUTO:${settings.autoFire ? 'OUI' : 'NON'}`);
    this.autoBtn.selected = settings.autoFire;
    this.autoBtn.redraw();
    this.sizeBtn.setText(`TAILLE ${settings.viewHeight}`);
    this.fpsBtn.selected = settings.showFps;
    this.fpsBtn.redraw();
  }

  update(): void {
    const game = this.game_;
    if (!game?.player) return;
    controls.move = this.left.value;
    // La visée garde sa dernière direction quand le pouce est près du centre.
    if (this.right.active && this.right.magnitude > 0.2) {
      controls.aim = this.right.value;
      controls.aimActive = true;
    } else if (!this.right.active) controls.aimActive = false;
    controls.fireHeld = this.firePointer !== null;
    if (this.firePointer !== null && !this.right.active) controls.aimActive = false;
    this.left.draw();
    this.right.draw();

    const { width: w, height: h } = this.scale;
    const s = layout.safe;
    const g = this.g;
    g.clear();
    const p = game.player;
    drawPanel(g, s.left + 4, s.top + 4, 100, 18);
    drawBar(g, s.left + 22, s.top + 9, 78, 8, p.hp / p.maxHp, C.health, C.healthDark);
    this.hpText.setText('PV').setPosition(s.left + 9, s.top + 10);
    const wpn = p.weapon;
    const ax = s.left + 108;
    drawPanel(g, ax, s.top + 4, 64, 18);
    this.ammoText.setText(String(wpn.ammo).padStart(2, '0')).setPosition(ax + 5, s.top + 8).setTint(wpn.ammo === 0 ? C.health : C.text);
    this.reserveText.setText(`/${wpn.reserve}`).setPosition(ax + 32, s.top + 13);
    if (wpn.reloading) drawBar(g, ax + 4, s.top + 24, 56, 4, wpn.reloadProgress, C.accentLight, C.accent);
    const alive = game.zombies.filter((z) => z.alive).length;
    const info = `RODEURS ${alive}/${game.targetCount}   ABATTUS ${game.kills}`;
    this.infoText.setText(info).setPosition(Math.round(w / 2 - this.infoText.width / 2), s.top + 46);
    this.fpsText.setVisible(settings.showFps).setText(`${Math.round(this.game.loop.actualFps)} IPS  ${game.effects.particleCount} PART.`).setPosition(s.left + 6, s.top + 30);
    if (p.dead) {
      const t = text(this, 0, 0, 'A TERRE', 3, C.health);
      t.setPosition(Math.round(w / 2 - t.width / 2), Math.round(h / 2 - 20));
      this.time.delayedCall(16, () => t.destroy());
    }
    // Vignette rouge brève quand le joueur est touché.
    this.vignette.clear();
    if (game.hurtFlash > 0) {
      const a = game.hurtFlash * 0.5;
      this.vignette.fillStyle(C.health, a).fillRect(0, 0, w, 3).fillRect(0, h - 3, w, 3).fillRect(0, 0, 3, h).fillRect(w - 3, 0, 3, h);
    }
  }
}
