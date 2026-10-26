// Carte du prototype : tuiles, décor, collisions logiques, structures destructibles, navigation.
import Phaser from 'phaser';
import type { AssetManifest } from '../core/assets';
import { depthOf, TILE_M, TILE_W, TILE_H, toScreen } from '../core/iso';
import type { MapDef } from '../data/schemas';
import type { Collider } from '../sim/collision';
import { Destructible } from '../sim/destructible';
import { FlowField } from '../sim/flowfield';

export const DEPTH = { ground: -1_000_000, shadow: -900_000, fx: 900_000, tracer: 950_000 } as const;
/** Décors trop bas pour arrêter les balles. */
const LOW_PROPS = new Set(['rubble']);
/** Décors hauts qui deviennent semi-transparents quand le joueur passe derrière. */
const TALL_PROPS = new Set(['tree_dead', 'lamp', 'car', 'car_y']);

export interface PropInstance {
  id: string;
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image | null;
  collider: Collider | null;
  destructible: Destructible | null;
  tall: boolean;
}

function hash(i: number, j: number): number {
  let h = (i * 374761393 + j * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export class World {
  readonly width: number;
  readonly height: number;
  readonly props: PropInstance[] = [];
  readonly walls: Collider[] = [];
  readonly flow: FlowField;
  private dirty = true;

  constructor(readonly scene: Phaser.Scene, readonly map: MapDef, readonly assets: AssetManifest) {
    this.width = map.width * TILE_M;
    this.height = map.height * TILE_M;
    this.flow = new FlowField(this.width, this.height, 0.5);
    this.buildGround();
    this.buildProps();
    const t = 2;
    this.walls.push(
      { kind: 'box', x: this.width / 2, y: -t / 2, hx: this.width / 2 + t, hy: t / 2, tag: 'wall' },
      { kind: 'box', x: this.width / 2, y: this.height + t / 2, hx: this.width / 2 + t, hy: t / 2, tag: 'wall' },
      { kind: 'box', x: -t / 2, y: this.height / 2, hx: t / 2, hy: this.height / 2 + t, tag: 'wall' },
      { kind: 'box', x: this.width + t / 2, y: this.height / 2, hx: t / 2, hy: this.height / 2 + t, tag: 'wall' },
    );
  }

  private buildGround(): void {
    const { tiles, legend } = this.map;
    for (let j = 0; j < this.map.height; j++)
      for (let i = 0; i < this.map.width; i++) {
        const type = legend[tiles[j][i]];
        const variants = this.assets.tiles.types[type];
        if (!variants) throw new Error(`type de tuile inconnu : ${type}`);
        const frame = variants[Math.floor(hash(i, j) * variants.length)];
        const c = toScreen((i + 0.5) * TILE_M, (j + 0.5) * TILE_M);
        this.scene.add.image(Math.round(c.x - TILE_W / 2), Math.round(c.y - TILE_H / 2), 'tiles', frame).setOrigin(0, 0).setDepth(DEPTH.ground + c.y);
      }
  }

  private buildProps(): void {
    for (const p of this.map.props) {
      const destructible = p.hp ? new Destructible(p.hp) : null;
      const key = destructible ? `${p.id}_intact` : p.id;
      const def = this.assets.props.colliders[key];
      if (def === undefined) throw new Error(`décor inconnu : ${key}`);
      const s = toScreen(p.x, p.y);
      const sprite = this.placeImage(key, s.x, s.y).setDepth(depthOf(p.x, p.y));
      const shadowKey = `${key}_shadow`;
      const shadow = this.assets.props.anchors[shadowKey] ? this.placeImage(shadowKey, s.x, s.y).setAlpha(0.38).setDepth(DEPTH.shadow) : null;
      const collider: Collider | null = def
        ? def.type === 'box'
          ? { kind: 'box', x: p.x, y: p.y, hx: def.hx!, hy: def.hy!, tag: p.id }
          : { kind: 'circle', x: p.x, y: p.y, r: def.r!, tag: p.id }
        : null;
      this.props.push({ id: p.id, x: p.x, y: p.y, sprite, shadow, collider, destructible, tall: TALL_PROPS.has(p.id) });
    }
  }

  placeImage(frame: string, sx: number, sy: number): Phaser.GameObjects.Image {
    const [ax, ay] = this.assets.props.anchors[frame];
    return this.scene.add.image(Math.round(sx) - ax, Math.round(sy) - ay, 'props', frame).setOrigin(0, 0);
  }

  /** Obstacles pour le déplacement (murs + décor + structures non détruites). */
  get colliders(): Collider[] {
    const out = [...this.walls];
    for (const p of this.props) if (p.collider) out.push(p.collider);
    return out;
  }

  /** Obstacles qui arrêtent les balles. */
  bulletBlockers(): PropInstance[] {
    return this.props.filter((p) => p.collider && !LOW_PROPS.has(p.id));
  }

  /** Applique des dégâts à une structure ; met à jour sprite, ombre, collision et navigation. */
  damageProp(p: PropInstance, amount: number): string | null {
    if (!p.destructible) return null;
    const state = p.destructible.damage(amount);
    if (!state) return null;
    const key = `${p.id}_${state}`;
    const s = toScreen(p.x, p.y);
    const [ax, ay] = this.assets.props.anchors[key];
    p.sprite.setFrame(key).setPosition(Math.round(s.x) - ax, Math.round(s.y) - ay);
    const shadowKey = `${key}_shadow`;
    if (p.shadow) {
      if (this.assets.props.anchors[shadowKey]) {
        const [sx, sy] = this.assets.props.anchors[shadowKey];
        p.shadow.setFrame(shadowKey).setPosition(Math.round(s.x) - sx, Math.round(s.y) - sy);
      } else p.shadow.setVisible(false);
    }
    if (this.assets.props.colliders[key] === null) p.collider = null;
    this.dirty = true;
    return state;
  }

  /** Recalcule le champ de navigation vers la cible (et la grille d'obstacles si elle a changé). */
  updateFlow(tx: number, ty: number, agentRadius: number): void {
    if (this.dirty) {
      this.flow.rasterize(this.colliders, agentRadius);
      this.flow.targetCell = -1;
      this.dirty = false;
    }
    this.flow.compute(tx, ty);
  }

  /** Estompe les grands décors qui masquent un point écran (le joueur reste visible). */
  updateOcclusion(sx: number, sy: number, depth: number): void {
    for (const p of this.props) {
      if (!p.tall) continue;
      const b = p.sprite;
      const inside = sx > b.x && sx < b.x + b.width && sy > b.y && sy < b.y + b.height && p.sprite.depth > depth;
      p.sprite.setAlpha(inside ? 0.45 : 1);
    }
  }
}
