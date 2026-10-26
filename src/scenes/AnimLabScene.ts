// AnimationLab : inspection des animations par personnage, direction, vitesse, image par image.
import Phaser from 'phaser';
import type { AssetManifest, SheetMeta } from '../core/assets';
import { layout } from '../core/screen';
import { C } from '../ui/theme';
import { Button, ButtonRouter, text } from '../ui/widgets';

interface Preset {
  label: string;
  layers: { sheet: string; anim: string; aimOffset?: number }[];
}

const SUBJECTS: Record<string, Preset[]> = {
  SURVIVANT: [
    { label: 'REPOS', layers: [{ sheet: 'survivor_legs', anim: 'idle' }, { sheet: 'survivor_upper', anim: 'idle' }] },
    { label: 'MARCHE', layers: [{ sheet: 'survivor_legs', anim: 'walk' }, { sheet: 'survivor_upper', anim: 'idle' }] },
    { label: 'COURSE', layers: [{ sheet: 'survivor_legs', anim: 'run' }, { sheet: 'survivor_upper', anim: 'idle' }] },
    { label: 'TIR', layers: [{ sheet: 'survivor_legs', anim: 'idle' }, { sheet: 'survivor_upper', anim: 'shoot' }] },
    { label: 'RECHARGE', layers: [{ sheet: 'survivor_legs', anim: 'idle' }, { sheet: 'survivor_upper', anim: 'reload' }] },
    { label: 'DEGATS', layers: [{ sheet: 'survivor_legs', anim: 'idle' }, { sheet: 'survivor_upper', anim: 'hit' }] },
    { label: 'STRAFE', layers: [{ sheet: 'survivor_legs', anim: 'walk' }, { sheet: 'survivor_upper', anim: 'shoot', aimOffset: 2 }] },
  ],
  RODEUR: [
    { label: 'REPOS', layers: [{ sheet: 'rodeur', anim: 'idle' }] },
    { label: 'MARCHE', layers: [{ sheet: 'rodeur', anim: 'walk' }] },
    { label: 'ATTAQUE', layers: [{ sheet: 'rodeur', anim: 'attack' }] },
    { label: 'IMPACT', layers: [{ sheet: 'rodeur', anim: 'hit' }] },
    { label: 'DEFAITE', layers: [{ sheet: 'rodeur', anim: 'death' }] },
  ],
};
const SPEEDS = [0.25, 0.5, 1];

export class AnimLabScene extends Phaser.Scene {
  private router!: ButtonRouter;
  private subject = 'SURVIVANT';
  private preset = 0;
  private dir = 1;
  private speed = 2;
  private playing = true;
  private t = 0;
  private big: Phaser.GameObjects.Sprite[] = [];
  private row: Phaser.GameObjects.Sprite[][] = [];
  private info!: Phaser.GameObjects.BitmapText;
  private assets!: AssetManifest;

  constructor() {
    super('animlab');
  }

  create(): void {
    this.assets = this.registry.get('assets');
    this.router = new ButtonRouter(this);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.router.down(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.router.move(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.router.up(p));
    this.scale.on('resize', this.build, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.build, this));
    this.build();
  }

  private build(): void {
    this.children.removeAll(true);
    this.router.buttons.length = 0;
    const { width: w, height: h } = this.scale;
    const s = layout.safe;
    this.add.graphics().fillStyle(0x2a2621).fillRect(0, 0, w, h).fillStyle(0x24201c).fillRect(0, Math.round(h * 0.25), w, Math.round(h * 0.75));
    const L = s.left + 4, T = s.top + 4;
    let x = L;
    for (const name of Object.keys(SUBJECTS)) {
      const b = this.router.add(new Button(this, x, T, 58, 14, name, () => { this.subject = name; this.preset = 0; this.t = 0; this.build(); }));
      b.selected = name === this.subject;
      b.redraw();
      x += 62;
    }
    this.router.add(new Button(this, w - s.right - 50, T, 46, 14, 'RETOUR', () => this.scene.start('menu')));
    x = L;
    SUBJECTS[this.subject].forEach((pr, i) => {
      const bw = pr.label.length * 4 + 10;
      const b = this.router.add(new Button(this, x, T + 20, bw, 14, pr.label, () => { this.preset = i; this.t = 0; this.build(); }));
      b.selected = i === this.preset;
      b.redraw();
      x += bw + 4;
    });
    const dirs = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];
    x = L;
    dirs.forEach((d, i) => {
      const b = this.router.add(new Button(this, x, T + 40, 20, 14, d, () => { this.dir = i; this.build(); }));
      b.selected = i === this.dir;
      b.redraw();
      x += 23;
    });
    x += 8;
    SPEEDS.forEach((sp, i) => {
      const b = this.router.add(new Button(this, x, T + 40, 30, 14, `X${sp}`, () => { this.speed = i; this.build(); }));
      b.selected = i === this.speed;
      b.redraw();
      x += 33;
    });
    this.router.add(new Button(this, x + 6, T + 40, 34, 14, this.playing ? 'PAUSE' : 'LIRE', () => { this.playing = !this.playing; this.build(); }));
    this.router.add(new Button(this, x + 44, T + 40, 34, 14, 'IMAGE>', () => { this.playing = false; this.t += this.frameMs(); this.build(); }));

    const preset = SUBJECTS[this.subject][this.preset];
    // Aperçu agrandi (facteur entier) sous la barre d'outils, sans la chevaucher.
    const k = Math.max(2, Math.min(4, Math.floor((h - s.top - s.bottom - 80) / 50)));
    const bigY = h - s.bottom - 16;
    this.big = preset.layers.map((l) => {
      const m = this.meta(l.sheet);
      return this.add.sprite(Math.round(w * 0.22), bigY, l.sheet, 0).setOrigin(m.anchor[0] / m.frameW, m.anchor[1] / m.frameH).setScale(k);
    });
    this.row = dirs.map((_, i) =>
      preset.layers.map((l) => {
        const m = this.meta(l.sheet);
        const cx = Math.round(w * 0.42 + (i % 4) * Math.min(56, (w * 0.56) / 4));
        const cy = Math.round(h * (i < 4 ? 0.55 : 0.9));
        return this.add.sprite(cx, cy, l.sheet, 0).setOrigin(m.anchor[0] / m.frameW, m.anchor[1] / m.frameH).setScale(h >= 300 ? 2 : 1);
      }),
    );
    this.info = text(this, L, h - s.bottom - 10, '', 1, C.textDim);
  }

  private meta(sheet: string): SheetMeta {
    return this.assets.characters[sheet];
  }

  private frameMs(): number {
    const l = SUBJECTS[this.subject][this.preset].layers.at(-1)!;
    return this.meta(l.sheet).anims[l.anim].frameMs || 120;
  }

  update(_t: number, dms: number): void {
    if (this.playing) this.t += dms * SPEEDS[this.speed];
    const preset = SUBJECTS[this.subject][this.preset];
    const frameOf = (l: Preset['layers'][number], dir: number) => {
      const m = this.meta(l.sheet);
      const a = m.anims[l.anim];
      const ms = a.frameMs || 120;
      let i = Math.floor(this.t / ms);
      i = a.loop ? i % a.count : i % (a.count + 6) >= a.count ? a.count - 1 : i % (a.count + 6);
      const d = l.aimOffset ? (dir + l.aimOffset) % 8 : dir;
      return { frame: d * m.framesPerDir + a.offset + i, i, count: a.count };
    };
    let last = { i: 0, count: 0 };
    preset.layers.forEach((l, li) => {
      const f = frameOf(l, this.dir);
      this.big[li].setFrame(f.frame);
      last = f;
      this.row.forEach((sprites, d) => sprites[li].setFrame(frameOf(l, d).frame));
    });
    this.info.setText(`${this.subject} ${preset.label}  IMAGE ${last.i + 1}/${last.count}  VITESSE X${SPEEDS[this.speed]}`);
  }
}
