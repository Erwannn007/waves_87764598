// Chargement : manifeste d'assets, puis feuilles de sprites, tuiles, décor, police.
// Les données de jeu sont validées ici ; toute erreur est affichée à l'écran (jamais silencieuse).
import Phaser from 'phaser';
import type { AssetManifest } from '../core/assets';
import { PPU } from '../core/iso';
import enemiesJson from '../data/enemies.json';
import mapJson from '../data/map.json';
import { EnemySchema, MapSchema, parseRecord, WeaponSchema } from '../data/schemas';
import weaponsJson from '../data/weapons.json';

const GEN = 'assets/gen/';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.json('assets', `${GEN}assets.json`);
    this.load.bitmapFont('font', `${GEN}font.png`, `${GEN}font.xml`);
  }

  create(): void {
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const assets = this.cache.json.get('assets') as AssetManifest;
    try {
      if (Math.abs(assets.iso.ppu - PPU) > 1e-6) throw new Error(`Projection incohérente : assets ${assets.iso.ppu}, jeu ${PPU}`);
      this.registry.set('assets', assets);
      this.registry.set('weapons', parseRecord(WeaponSchema, weaponsJson, 'arme'));
      this.registry.set('enemies', parseRecord(EnemySchema, enemiesJson, 'ennemi'));
      this.registry.set('map', MapSchema.parse(mapJson));
    } catch (e) {
      this.fail(e);
      return;
    }
    for (const [id, m] of Object.entries(assets.characters)) this.load.spritesheet(id, `${GEN}${id}.png`, { frameWidth: m.frameW, frameHeight: m.frameH });
    this.load.spritesheet('tiles', `${GEN}tiles.png`, { frameWidth: assets.tiles.tileW, frameHeight: assets.tiles.tileH });
    this.load.atlas('props', `${GEN}props.png`, `${GEN}props.json`);
    this.load.on('progress', (p: number) => {
      bar.clear().fillStyle(0x332d27).fillRect(width / 2 - 60, height / 2, 120, 4).fillStyle(0xc9e08a).fillRect(width / 2 - 60, height / 2, Math.round(120 * p), 4);
    });
    this.load.on('loaderror', (f: Phaser.Loader.File) => this.fail(new Error(`Échec du chargement : ${f.url}`)));
    this.load.once('complete', () => this.scene.start('menu'));
    this.load.start();
  }

  private fail(e: unknown): void {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(msg);
    this.add.bitmapText(8, 8, 'font', `ERREUR : ${msg}`.toUpperCase().slice(0, 300), 6).setMaxWidth(this.scale.width - 16).setTint(0xc8463c);
  }
}
