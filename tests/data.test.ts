import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { frameAt, type AssetManifest } from '../src/core/assets';
import { PPU, TILE_H, TILE_M, TILE_W } from '../src/core/iso';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, SETTINGS_KEY, type KeyValueStore } from '../src/core/settings';
import enemies from '../src/data/enemies.json';
import map from '../src/data/map.json';
import { EnemySchema, MapSchema, parseRecord, WeaponSchema } from '../src/data/schemas';
import weapons from '../src/data/weapons.json';

describe('données de jeu', () => {
  it('les fichiers fournis sont valides', () => {
    expect(() => parseRecord(WeaponSchema, weapons, 'arme')).not.toThrow();
    expect(() => parseRecord(EnemySchema, enemies, 'ennemi')).not.toThrow();
    expect(() => MapSchema.parse(map)).not.toThrow();
  });
  it('une donnée invalide est rejetée avec un message explicite', () => {
    expect(() => parseRecord(WeaponSchema, { bad: { name: 'X', damage: -1 } }, 'arme')).toThrow(/arme « bad »/);
    const broken = { ...map, tiles: [...map.tiles.slice(0, -1), 'Z'.repeat(map.width)] };
    expect(MapSchema.safeParse(broken).success).toBe(false);
  });
  it('le joueur et les apparitions sont dans la carte', () => {
    const m = MapSchema.parse(map);
    for (const p of [m.player, ...m.spawns]) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(m.width * TILE_M);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(m.height * TILE_M);
    }
  });
});

describe('manifeste d’assets', () => {
  const path = 'public/assets/gen/assets.json';
  const has = fs.existsSync(path);
  it.skipIf(!has)('la projection des assets correspond à celle du jeu', () => {
    const a = JSON.parse(fs.readFileSync(path, 'utf8')) as AssetManifest;
    expect(a.iso.ppu).toBeCloseTo(PPU, 9);
    expect([a.iso.tileW, a.iso.tileH, a.iso.tileM]).toEqual([TILE_W, TILE_H, TILE_M]);
    for (const p of MapSchema.parse(map).props) expect(a.props.colliders[p.hp ? `${p.id}_intact` : p.id]).not.toBeUndefined();
    const legs = a.characters.survivor_legs;
    expect(frameAt(legs, 'walk', 2, 0)).toBe(2 * legs.framesPerDir + legs.anims.walk.offset);
    expect(frameAt(legs, 'walk', 0, legs.anims.walk.frameMs * legs.anims.walk.count)).toBe(legs.anims.walk.offset); // boucle
    const death = a.characters.rodeur.anims.death;
    expect(frameAt(a.characters.rodeur, 'death', 0, 1e6)).toBe(death.offset + death.count - 1); // tient la dernière image
  });
});

describe('paramètres persistés', () => {
  const mem = (init: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } => ({
    data: { ...init },
    getItem(k) { return k in this.data ? this.data[k] : null; },
    setItem(k, v) { this.data[k] = v; },
  });
  it('absent → valeurs par défaut', () => {
    expect(loadSettings(mem())).toEqual({ settings: DEFAULT_SETTINGS, status: 'absent' });
  });
  it('aller-retour', () => {
    const s = mem();
    saveSettings(s, { ...DEFAULT_SETTINGS, autoFire: true, viewHeight: 220 });
    expect(loadSettings(s).settings.autoFire).toBe(true);
    expect(loadSettings(s).settings.viewHeight).toBe(220);
  });
  it('corrompu → défauts, l’original est conservé et une copie de secours est créée', () => {
    const s = mem({ [SETTINGS_KEY]: '{pas du json' });
    const r = loadSettings(s);
    expect(r.status).toBe('corrupt');
    expect(r.settings).toEqual(DEFAULT_SETTINGS);
    expect(s.data[SETTINGS_KEY]).toBe('{pas du json');
    expect(Object.keys(s.data).some((k) => k.startsWith(`${SETTINGS_KEY}.corrupt.`))).toBe(true);
  });
  it('version inconnue → traitée comme corrompue (jamais écrasée silencieusement)', () => {
    const s = mem({ [SETTINGS_KEY]: JSON.stringify({ version: 99 }) });
    expect(loadSettings(s).status).toBe('corrupt');
  });
  it('stockage indisponible → défauts sans plantage', () => {
    const throwing: KeyValueStore = { getItem() { throw new Error('bloqué'); }, setItem() { throw new Error('bloqué'); } };
    expect(loadSettings(throwing).status).toBe('unavailable');
    expect(saveSettings(throwing, DEFAULT_SETTINGS)).toBe(false);
  });
});
