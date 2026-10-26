// Menu : titre, accès au jeu, à l'AnimationLab et aux réglages testés sur téléphone.
import Phaser from 'phaser';
import type { AssetManifest } from '../core/assets';
import { frameAt } from '../core/assets';
import { isIOS, isStandalone, layout } from '../core/screen';
import { settings, updateSettings } from '../core/settings';
import { unlockAudio } from '../core/sfx';
import { C } from '../ui/theme';
import { Button, ButtonRouter, text } from '../ui/widgets';

export const VIEW_HEIGHTS = [220, 250, 280, 320] as const;

export function requestFullscreen(): void {
  // Android : plein écran + verrouillage paysage. iOS (iPhone) : API absente → passer par l'écran d'accueil.
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen && !isIOS()) {
    el.requestFullscreen({ navigationUI: 'hide' })
      .then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
      .catch(() => undefined);
  }
}

export class MenuScene extends Phaser.Scene {
  private router!: ButtonRouter;
  private t = 0;
  private sprites: { s: Phaser.GameObjects.Sprite; sheet: string; anim: string; dir: number }[] = [];

  constructor() {
    super('menu');
  }

  create(): void {
    this.router = new ButtonRouter(this);
    this.build();
    this.scale.on('resize', this.rebuild, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.rebuild, this));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { unlockAudio(); this.router.down(p); });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.router.move(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.router.up(p));
  }

  private rebuild(): void {
    this.children.removeAll(true);
    this.router.buttons.length = 0;
    this.sprites = [];
    this.build();
  }

  private build(): void {
    const { width: w, height: h } = this.scale;
    const s = layout.safe;
    const g = this.add.graphics();
    g.fillStyle(C.panelDeep).fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) g.fillStyle(0x1b1713).fillRect(0, y, w, 1);
    const cx = Math.round(w / 2);
    const title = text(this, 0, s.top + 18, 'WAVES', 6, C.accentLight);
    title.setX(Math.round(cx - title.width / 2));
    const sub = text(this, 0, s.top + 54, 'PROTOTYPE 0.2 - ISO 2:1 - PALETTE CENDRES', 1, C.textDim);
    sub.setX(Math.round(cx - sub.width / 2));

    const assets = this.registry.get('assets') as AssetManifest;
    const add = (sheet: string, anim: string, dir: number, x: number, scale: number) => {
      const m = assets.characters[sheet];
      const spr = this.add.sprite(x, Math.round(h * 0.62), sheet, frameAt(m, anim, dir, 0)).setOrigin(m.anchor[0] / m.frameW, m.anchor[1] / m.frameH).setScale(scale);
      this.sprites.push({ s: spr, sheet, anim, dir });
    };
    const k = h > 300 ? 3 : 2;
    add('survivor_legs', 'walk', 2, Math.round(w * 0.2), k);
    add('survivor_upper', 'idle', 2, Math.round(w * 0.2), k);
    add('rodeur', 'walk', 6, Math.round(w * 0.8), k);

    const bw = 96, bh = 20;
    const by = Math.round(h * 0.42);
    this.router.add(new Button(this, cx - bw / 2, by, bw, bh, 'JOUER', () => { requestFullscreen(); this.scene.start('game'); }, 'action', 2));
    this.router.add(new Button(this, cx - bw / 2, by + 28, bw, 16, 'ANIMATIONLAB', () => this.scene.start('animlab')));
    const auto = this.router.add(new Button(this, cx - bw / 2, by + 50, bw, 16, `AUTO-TIR : ${settings.autoFire ? 'OUI' : 'NON'}`, () => {
      updateSettings({ autoFire: !settings.autoFire });
      auto.setText(`AUTO-TIR : ${settings.autoFire ? 'OUI' : 'NON'}`);
    }));
    const size = this.router.add(new Button(this, cx - bw / 2, by + 72, bw, 16, `TAILLE : ${settings.viewHeight}`, () => {
      const i = VIEW_HEIGHTS.indexOf(settings.viewHeight);
      updateSettings({ viewHeight: VIEW_HEIGHTS[(i + 1) % VIEW_HEIGHTS.length] });
      size.setText(`TAILLE : ${settings.viewHeight}`);
    }));
    const hint = isIOS() && !isStandalone() ? 'IPHONE : PARTAGER > SUR L ECRAN D ACCUEIL POUR LE PLEIN ECRAN' : 'CLAVIER : ZQSD/WASD - SOURIS : VISER/TIRER - R : RECHARGER';
    const ht = text(this, 0, h - s.bottom - 12, hint, 1, C.textOff);
    ht.setX(Math.round(cx - ht.width / 2));
  }

  update(_t: number, dms: number): void {
    this.t += dms;
    const assets = this.registry.get('assets') as AssetManifest;
    for (const e of this.sprites) e.s.setFrame(frameAt(assets.characters[e.sheet], e.anim, e.dir, this.t));
  }
}
