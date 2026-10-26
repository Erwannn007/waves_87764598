// Exporte les assets du jeu (direction validée : isométrique 2:1, palette Cendres, ~40 px).
//   node tools/art-lab/export.mjs             → public/assets/gen/ + public/icons/
//   node tools/art-lab/export.mjs --blockout  → écrit aussi chaque image de maquette dans
//                                               assets-src/characters/<feuille>/blockout/
// Pipeline hybride : si assets-src/characters/<feuille>/art/<anim>_<DIR>_<nn>.png existe,
// cette image retouchée remplace la maquette correspondante.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from './encode.mjs';
import { blit, createImage, crop, FONT, getPx, hex, rect, scale, setPx } from './image.mjs';
import * as M from './models.mjs';
import { PALETTES, paletteColors } from './palettes.mjs';
import { camera, mv, project, render, Rig, rotZ } from './render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'public/assets/gen');
const ICONS = path.join(ROOT, 'public/icons');
const BLOCKOUT = process.argv.includes('--blockout');

// --- Paramètres de projection (source de vérité, recopiés dans characters.json pour le jeu) ---
export const ISO = {
  tileM: 1.5, // côté d'une tuile en mètres
  tileW: 64,
  tileH: 32,
  yawDeg: 45,
  pitchDeg: 30,
};
ISO.ppu = ISO.tileW / (ISO.tileM * Math.SQRT2); // ≈ 30,17 px/m → survivant ≈ 40 px
const pal = PALETTES.cendres;
const LIGHT_WORLD = [-0.55, -0.45, 1.1];
// Les personnages sont rendus avec une caméra de lacet 0 : on tourne la lumière de -45° pour rester cohérent.
const LIGHT_SPRITE = mv(rotZ((-ISO.yawDeg * Math.PI) / 180), LIGHT_WORLD);
const style = (light) => ({ outline: 'selout', black: pal.black, light, ambient: 0.22 });
const DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];
const dirYaw = (k) => Math.PI + (k * Math.PI) / 4;
const COLS = 16;


function renderSprite(rig, w, h, anchor) {
  return render({
    w, h, cam: camera(0, ISO.pitchDeg), ppu: ISO.ppu, anchor, materials: pal.mats,
    style: style(LIGHT_SPRITE), prims: rig.prims, decals: rig.decals,
  });
}

// --- Définition des feuilles de personnages ----------------------------------------------------

const SHEETS = {
  survivor_legs: {
    frame: [76, 60], anchor: [38, 54],
    anims: {
      idle: { ms: 1000, loop: true, poses: [{}] },
      walk: { ms: 100, loop: true, poses: [...Array(8)].map((_, i) => ({ phase: i / 8, stride: 1 })) },
      run: { ms: 80, loop: true, poses: [...Array(8)].map((_, i) => ({ phase: i / 8, stride: 1.45 })) },
    },
    rig: (yaw, pose) => M.survivor({ yaw, ...pose }).only('legs'),
  },
  survivor_upper: {
    frame: [76, 60], anchor: [38, 54],
    anims: {
      idle: { ms: 220, loop: true, poses: [0, 0.5, 1, 0.5].map((breathe) => ({ breathe })) },
      shoot: { ms: 45, loop: false, poses: [1, 0.6, 0.25, 0].map((recoil) => ({ recoil })) },
      reload: { ms: 0, loop: false, poses: [0.2, 0.5, 0.8, 1, 1, 0.8, 0.5, 0.2].map((reload) => ({ reload })) },
      hit: { ms: 70, loop: false, poses: [1, 0.75, 0.45, 0.15].map((hit) => ({ hit })) },
    },
    rig: (yaw, pose) => M.survivor({ yaw, ...pose }).only('upper'),
  },
  rodeur: {
    frame: [112, 80], anchor: [56, 52],
    anims: {
      idle: { ms: 200, loop: true, poses: [0, 0.25, 0.5, 0.75].map((phase) => ({ phase, stride: 0.15 })) },
      walk: { ms: 120, loop: true, poses: [...Array(8)].map((_, i) => ({ phase: i / 8, stride: 1 })) },
      attack: { ms: 90, loop: false, poses: [0.15, 0.35, 0.55, 0.75, 0.9, 1].map((attack) => ({ attack })) },
      hit: { ms: 70, loop: false, poses: [1, 0.6, 0.25].map((hit) => ({ hit })) },
      death: { ms: 90, loop: false, poses: [0.08, 0.2, 0.35, 0.52, 0.7, 0.86, 0.96, 1].map((death) => ({ death })) },
    },
    rig: (yaw, pose) => M.shambler({ yaw, ...pose }),
  },
};

function buildSheet(id, def) {
  const [fw, fh] = def.frame;
  const perDir = Object.values(def.anims).reduce((n, a) => n + a.poses.length, 0);
  const total = perDir * DIRS.length;
  const rows = Math.ceil(total / COLS);
  const sheet = createImage(COLS * fw, rows * fh);
  const meta = { frameW: fw, frameH: fh, anchor: def.anchor, framesPerDir: perDir, dirs: DIRS, anims: {}, muzzle: {}, bob: {} };
  let offset = 0;
  for (const [name, a] of Object.entries(def.anims)) {
    meta.anims[name] = { offset, count: a.poses.length, frameMs: a.ms, loop: a.loop };
    offset += a.poses.length;
  }
  const artDir = path.join(ROOT, 'assets-src/characters', id, 'art');
  const blockDir = path.join(ROOT, 'assets-src/characters', id, 'blockout');
  if (BLOCKOUT) fs.mkdirSync(blockDir, { recursive: true });
  let overrides = 0;
  DIRS.forEach((dir, k) => {
    for (const [name, a] of Object.entries(def.anims)) {
      a.poses.forEach((pose, i) => {
        const rig = def.rig(dirYaw(k), pose);
        const r = renderSprite(rig, fw, fh, def.anchor);
        const file = `${name}_${dir}_${String(i).padStart(2, '0')}.png`;
        if (BLOCKOUT) fs.writeFileSync(path.join(blockDir, file), encodePNG(r.img));
        let img = r.img;
        const art = path.join(artDir, file);
        if (fs.existsSync(art)) {
          img = decodePNG(fs.readFileSync(art));
          if (img.w !== fw || img.h !== fh) throw new Error(`${art} : ${img.w}×${img.h}, attendu ${fw}×${fh}`);
          overrides++;
        }
        const idx = k * perDir + meta.anims[name].offset + i;
        blit(sheet, img, (idx % COLS) * fw, ((idx / COLS) | 0) * fh);
        if (id === 'survivor_upper' && name === 'idle' && i === 0 && rig.muzzle) {
          const [mx, my] = project(r.view, rig.muzzle);
          meta.muzzle[dir] = [Math.round(mx - def.anchor[0]), Math.round(my - def.anchor[1])];
        }
      });
    }
  });
  if (id === 'survivor_legs') {
    // Décalage vertical (px) à appliquer au buste pour suivre le rebond des hanches.
    const base = M.survivorHipZ({});
    const k = ISO.ppu * Math.cos((ISO.pitchDeg * Math.PI) / 180);
    for (const [name, a] of Object.entries(def.anims)) meta.bob[name] = a.poses.map((p) => -Math.round((M.survivorHipZ(p) - base) * k));
  }
  fs.writeFileSync(path.join(OUT, `${id}.png`), encodePNG(sheet));
  return { meta, overrides, total };
}

// --- Tuiles isométriques 64×32 ------------------------------------------------------------------

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function smooth(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}

/** u, v : coordonnées locales dans la tuile (0..tileM) ; s : graine de variante. */
const TILE_TYPES = {
  grass: { variants: 4, fn: (u, v, s) => {
    const n = hash(Math.floor(u * 9) + s * 31, Math.floor(v * 9) - s * 17);
    const edge = Math.min(u, v, ISO.tileM - u, ISO.tileM - v) / 0.35;
    let idx = smooth(u * 1.2 + s * 5, v * 1.2) > 0.6 && edge > 1 ? 3 : 2;
    const tuft = hash(Math.floor(u * 4) + s, Math.floor(v * 4) + s * 3);
    if (tuft > 0.9 && n > 0.5) idx += 1;
    if (tuft < 0.05) idx -= 1;
    return ['grass', idx];
  } },
  dirt: { variants: 3, fn: (u, v, s) => {
    const n = hash(Math.floor(u * 10) + s * 13, Math.floor(v * 10) + s * 7);
    let idx = smooth(u * 1.5 + s * 3, v * 1.5 - s) > 0.62 ? 1 : 2;
    if (n > 0.95) idx = 3;
    if (n < 0.03) idx = 0;
    return ['dirt', idx];
  } },
  asphalt: { variants: 4, fn: (u, v, s) => {
    const n = hash(Math.floor(u * 9) + s * 19, Math.floor(v * 9) + s * 23);
    if (s > 1 && Math.abs(smooth(u * 1.6 + s * 4, v * 1.6) - 0.5) < 0.02) return ['asphalt', 0];
    return ['asphalt', n > 0.985 ? 4 : n < 0.015 ? 1 : smooth(u + s * 9, v) > 0.66 ? 3 : 2];
  } },
  asphalt_lx: { variants: 1, fn: (u, v) => (Math.abs(v - ISO.tileM / 2) < 0.06 && u > 0.2 && u < 1.3 ? ['paint', 1] : TILE_TYPES.asphalt.fn(u, v, 0)) },
  asphalt_ly: { variants: 1, fn: (u, v) => (Math.abs(u - ISO.tileM / 2) < 0.06 && v > 0.2 && v < 1.3 ? ['paint', 1] : TILE_TYPES.asphalt.fn(u, v, 0)) },
  sidewalk: { variants: 3, fn: (u, v, s) => {
    const fu = u % 0.75, fv = v % 0.75;
    if (fu < 0.04 || fv < 0.04) return ['sidewalk', 1];
    const n = hash(Math.floor(u * 9) + s * 5, Math.floor(v * 9) + s * 11);
    if (s === 2 && Math.abs(u - v - 0.2) < 0.03) return ['sidewalk', 0];
    return ['sidewalk', n < 0.03 ? 2 : n > 0.99 ? 4 : 3];
  } },
};

function buildTiles() {
  const { tileW: W, tileH: H, tileM: T } = ISO;
  const list = [];
  for (const [type, def] of Object.entries(TILE_TYPES)) for (let s = 0; s < def.variants; s++) list.push([type, s]);
  const cols = 8;
  const sheet = createImage(cols * W, Math.ceil(list.length / cols) * H);
  const meta = { tileW: W, tileH: H, types: {} };
  list.forEach(([type, s], n) => {
    const tile = createImage(W, H);
    for (let j = 0; j < H; j++) {
      const half = j < H / 2 ? 2 * (j + 1) : 2 * (H - j);
      for (let i = W / 2 - half; i < W / 2 + half; i++) {
        // Projection inverse : écran (dx, dy) → sol. x + y = dx·T/(W/2) ; x − y = dy·T/(H/2).
        const sum = ((i + 0.5 - W / 2) * T) / (W / 2);
        const diff = ((j + 0.5 - H / 2) * T) / (H / 2);
        const x = (sum + diff) / 2 + T / 2;
        const y = (sum - diff) / 2 + T / 2;
        const [mat, idx] = TILE_TYPES[type].fn(Math.min(T - 1e-6, Math.max(0, x)), Math.min(T - 1e-6, Math.max(0, y)), s);
        const ramp = pal.mats[mat].ramp;
        setPx(tile, i, j, ramp[Math.max(0, Math.min(ramp.length - 1, idx))]);
      }
    }
    blit(sheet, tile, (n % cols) * W, ((n / cols) | 0) * H);
    (meta.types[type] ??= []).push(n);
  });
  fs.writeFileSync(path.join(OUT, 'tiles.png'), encodePNG(sheet));
  return meta;
}

// --- Décor : sprites + ombres portées, atlas « étagères » -------------------------------------

const PROPS = {
  crate: { build: (r) => M.crate(r, 0, 0, 0.8), collider: { type: 'box', hx: 0.4, hy: 0.4 } },
  crate_small: { build: (r) => M.crate(r, 0, 0, 0.6, 0.3), collider: { type: 'circle', r: 0.36 } },
  barrel: { build: (r) => M.barrel(r, 0, 0), collider: { type: 'circle', r: 0.3 } },
  jersey: { build: (r) => M.jersey(r, 0, 0), collider: { type: 'box', hx: 1.0, hy: 0.3 } },
  jersey_y: { build: (r) => M.jersey(r, 0, 0, Math.PI / 2), collider: { type: 'box', hx: 0.3, hy: 1.0 } },
  car: { build: (r) => M.carWreck(r, 0, 0), collider: { type: 'box', hx: 1.1, hy: 0.88 } },
  car_y: { build: (r) => M.carWreck(r, 0, 0, Math.PI / 2 + 0.15), collider: { type: 'box', hx: 0.95, hy: 1.12 } },
  tree_dead: { build: (r) => M.deadTree(r, 0, 0), collider: { type: 'circle', r: 0.18 } },
  lamp: { build: (r) => M.lamp(r, 0, 0), collider: { type: 'circle', r: 0.1 } },
  rubble: { build: (r) => M.rubble(r, 0, 0), collider: { type: 'circle', r: 0.45 } },
  barricade_intact: { build: (r) => M.barricadeState(r, 0, 0, 'intact'), collider: { type: 'box', hx: 0.9, hy: 0.14 } },
  barricade_damaged: { build: (r) => M.barricadeState(r, 0, 0, 'damaged'), collider: { type: 'box', hx: 0.9, hy: 0.14 } },
  barricade_destroyed: { build: (r) => M.barricadeState(r, 0, 0, 'destroyed'), collider: null },
};

function bbox(img) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++)
      if (img.data[(y * img.w + x) * 4 + 3] > 0) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
  return x1 < 0 ? null : { x: x0 - 1, y: y0 - 1, w: x1 - x0 + 3, h: y1 - y0 + 3 };
}

function buildProps() {
  const cam = camera(ISO.yawDeg, ISO.pitchDeg);
  const W = 240, H = 240, A = [120, 170];
  const items = [];
  for (const [id, def] of Object.entries(PROPS)) {
    const rig = new Rig(10);
    def.build(rig);
    for (const p of rig.prims) p.shadow = true;
    const spr = render({ w: W, h: H, cam, ppu: ISO.ppu, anchor: A, materials: pal.mats, style: style(LIGHT_WORLD), prims: rig.prims });
    const sh = render({
      w: W, h: H, cam, ppu: ISO.ppu, anchor: A, materials: pal.mats, style: { ...style(LIGHT_WORLD), outline: 'none' }, prims: [], shadowPrims: rig.prims,
      ground: (x, y, i, j, shadowed) => (shadowed ? { ramp: [pal.black], idx: 0, shadowHandled: true } : null),
    });
    // L'ombre ne doit pas recouvrir l'objet lui-même : on retire les pixels déjà couverts par le sprite.
    for (let k = 0; k < W * H; k++) if (spr.img.data[k * 4 + 3] > 0) sh.img.data[k * 4 + 3] = 0;
    for (const [suffix, img] of [['', spr.img], ['_shadow', sh.img]]) {
      const b = bbox(img);
      if (!b) continue;
      items.push({ name: id + suffix, img: crop(img, b.x, b.y, b.w, b.h), anchor: [A[0] - b.x, A[1] - b.y] });
    }
  }
  // Ombre de contact des personnages : ellipse 2:1 d'un rayon de 0,32 m.
  const rx = Math.round(0.32 * ISO.ppu), ry = Math.round(rx / 2);
  const ell = createImage(rx * 2 + 1, ry * 2 + 1);
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i / rx) ** 2 + (j / ry) ** 2 <= 1) setPx(ell, i + rx, j + ry, pal.black);
  items.push({ name: 'shadow_actor', img: ell, anchor: [rx, ry] });
  // Particule de 1 px et de 2 px (teintées en jeu).
  const p1 = createImage(1, 1); setPx(p1, 0, 0, [255, 255, 255]);
  const p2 = createImage(2, 2); rect(p2, 0, 0, 2, 2, [255, 255, 255]);
  items.push({ name: 'px1', img: p1, anchor: [0, 0] }, { name: 'px2', img: p2, anchor: [1, 1] });

  // Empaquetage par étagères (largeur max 1024), 1 px de marge.
  items.sort((a, b) => b.img.h - a.img.h);
  const maxW = 1024;
  let x = 0, y = 0, rowH = 0;
  for (const it of items) {
    if (x + it.img.w + 1 > maxW) { x = 0; y += rowH + 1; rowH = 0; }
    it.x = x; it.y = y;
    x += it.img.w + 1;
    rowH = Math.max(rowH, it.img.h);
  }
  const atlas = createImage(maxW, y + rowH);
  const frames = {};
  const anchors = {};
  for (const it of items) {
    blit(atlas, it.img, it.x, it.y);
    frames[it.name] = { frame: { x: it.x, y: it.y, w: it.img.w, h: it.img.h }, rotated: false, trimmed: false, sourceSize: { w: it.img.w, h: it.img.h }, spriteSourceSize: { x: 0, y: 0, w: it.img.w, h: it.img.h } };
    anchors[it.name] = it.anchor;
  }
  fs.writeFileSync(path.join(OUT, 'props.png'), encodePNG(atlas));
  fs.writeFileSync(path.join(OUT, 'props.json'), JSON.stringify({ frames, meta: { image: 'props.png', size: { w: atlas.w, h: atlas.h }, scale: '1' } }));
  return { anchors, colliders: Object.fromEntries(Object.entries(PROPS).map(([k, d]) => [k, d.collider])) };
}

// --- Police bitmap 3×5 (BMFont XML) -------------------------------------------------------------

function buildFont() {
  const chars = Object.keys(FONT);
  const cw = 4, chh = 6, cols = 16;
  const img = createImage(cols * cw, Math.ceil(chars.length / cols) * chh);
  const entries = chars.map((ch, n) => {
    const g = FONT[ch].replaceAll(' ', '');
    const x0 = (n % cols) * cw, y0 = ((n / cols) | 0) * chh;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '#') setPx(img, x0 + i, y0 + j, [255, 255, 255]);
    return `<char id="${ch.charCodeAt(0)}" x="${x0}" y="${y0}" width="3" height="5" xoffset="0" yoffset="0" xadvance="4" page="0" chnl="15"/>`;
  });
  fs.writeFileSync(path.join(OUT, 'font.png'), encodePNG(img));
  fs.writeFileSync(path.join(OUT, 'font.xml'), `<?xml version="1.0"?><font><info face="pix3x5" size="6"/><common lineHeight="7" base="5" scaleW="${img.w}" scaleH="${img.h}" pages="1"/><pages><page id="0" file="font.png"/></pages><chars count="${entries.length}">${entries.join('')}</chars></font>`);
}

// --- Icônes de l'application --------------------------------------------------------------------

function buildIcons() {
  fs.mkdirSync(ICONS, { recursive: true });
  const base = createImage(32, 32, hex('#14110f'));
  for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) {
    const d = Math.hypot(i - 15.5, j - 13);
    if (d < 13) setPx(base, i, j, d < 9 ? hex('#2a3a24') : hex('#1f2a1e'));
  }
  const rig = M.shambler({ yaw: dirYaw(1) });
  const r = render({ w: 64, h: 80, cam: camera(0, ISO.pitchDeg), ppu: ISO.ppu * 1.55, anchor: [32, 76], materials: pal.mats, style: style(LIGHT_SPRITE), prims: rig.prims, decals: rig.decals });
  const b = bbox(r.img);
  blit(base, crop(r.img, b.x + ((b.w - 32) >> 1), b.y - 1, 32, 32), 0, 3);
  for (const [name, k] of [['icon-192.png', 6], ['icon-512.png', 16]]) fs.writeFileSync(path.join(ICONS, name), encodePNG(scale(base, k)));
  // 180×180 pour iOS : 32×5 = 160 centré sur 180.
  const apple = createImage(180, 180, hex('#14110f'));
  blit(apple, scale(base, 5), 10, 10);
  fs.writeFileSync(path.join(ICONS, 'apple-touch-icon.png'), encodePNG(apple));
}

function main() {
  const t0 = Date.now();
  fs.mkdirSync(OUT, { recursive: true });
  const chars = {};
  let overrides = 0;
  for (const [id, def] of Object.entries(SHEETS)) {
    const r = buildSheet(id, def);
    chars[id] = r.meta;
    overrides += r.overrides;
    console.log(`  ${id} : ${r.total} images${r.overrides ? `, dont ${r.overrides} retouchées` : ''}`);
  }
  const tiles = buildTiles();
  const props = buildProps();
  buildFont();
  buildIcons();
  const manifest = {
    generatedBy: 'tools/art-lab/export.mjs',
    iso: ISO,
    palette: 'cendres',
    paletteColors: [...paletteColors(pal).keys()],
    characters: chars,
    tiles,
    props,
    overrides,
  };
  fs.writeFileSync(path.join(OUT, 'assets.json'), JSON.stringify(manifest, null, 1));
  console.log(`assets exportés en ${((Date.now() - t0) / 1000).toFixed(1)} s → public/assets/gen/`);
}

main();
