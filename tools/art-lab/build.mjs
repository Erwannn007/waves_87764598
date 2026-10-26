// Génère les planches de la Phase 1 dans docs/art/phase1/.
// Usage : node tools/art-lab/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeGIF, encodePNG } from './encode.mjs';
import { blit, createImage, getPx, hex, rect, scale, setPx, text, textWidth } from './image.mjs';
import { barrel, barricade, crate, jersey, lamp, shambler, survivor, tree } from './models.mjs';
import { PALETTES, paletteColors } from './palettes.mjs';
import { camera, project, render, Rig, v } from './render.mjs';
import { bar, button, card, icon, joystick, panel, UI } from './ui.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'docs/art/phase1');
const RAD = Math.PI / 180;
const CHAR_HEIGHT_M = 1.55;

export const PROPOSALS = {
  A: { id: 'A', name: '3/4 TACTIQUE', env: { yaw: 0, pitch: 42 }, charPitch: 35, charPx: 34, outline: 'black', palette: 'tempete', internal: [480, 270] },
  B: { id: 'B', name: 'ISOMETRIQUE 2:1', env: { yaw: 45, pitch: 30 }, charPitch: 30, charPx: 40, outline: 'selout', palette: 'cendres', internal: [480, 270] },
  C: { id: 'C', name: '3/4 DETAILLE', env: { yaw: 0, pitch: 42 }, charPitch: 35, charPx: 56, outline: 'selout', palette: 'tempete', internal: [640, 360] },
};

const LIGHT = [-0.55, -0.45, 1.1];
const DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];
const dirYaw = (k) => Math.PI + (k * Math.PI) / 4;

const setup = (P) => {
  const pal = PALETTES[P.palette];
  const ppu = P.charPx / (CHAR_HEIGHT_M * Math.cos(P.charPitch * RAD));
  const style = { outline: P.outline, black: pal.black, light: LIGHT, ambient: 0.22 };
  return { pal, ppu, style };
};

const whiteMats = (mats) => Object.fromEntries(Object.entries(mats).map(([k, m]) => [k, { ...m, ramp: mats.white.ramp, emissive: false, metal: false }]));

/** Rend un sprite isolé (fond transparent, ancre aux pieds). */
function sprite(P, rig, { flash = false } = {}) {
  const { pal, ppu, style } = setup(P);
  const w = Math.ceil(P.charPx * 1.9);
  const h = Math.ceil(P.charPx * 1.5);
  const anchor = [w >> 1, h - Math.round(P.charPx * 0.16)];
  const r = render({ w, h, cam: camera(0, P.charPitch), ppu, anchor, materials: flash ? whiteMats(pal.mats) : pal.mats, style, prims: rig.prims, decals: flash ? [] : rig.decals });
  r.anchor = anchor;
  r.muzzle = rig.muzzle ? project(r.view, rig.muzzle) : null;
  return r;
}

function muzzleFlash(img, x, y, size, dir = [1, 0]) {
  const core = [255, 255, 236];
  const mid = [255, 214, 92];
  const outer = [255, 132, 40];
  x = Math.round(x);
  y = Math.round(y);
  for (let i = -size; i <= size; i++) {
    setPx(img, x + i, y, Math.abs(i) < size / 2 ? core : mid);
    setPx(img, x, y + i, Math.abs(i) < size / 2 ? core : mid);
  }
  for (let i = 1; i <= size + 2; i++) setPx(img, x + Math.round(dir[0] * i), y + Math.round(dir[1] * i), i <= size ? mid : outer);
  setPx(img, x + 1, y + 1, outer);
  setPx(img, x - 1, y - 1, outer);
  setPx(img, x + 1, y - 1, mid);
  setPx(img, x - 1, y + 1, mid);
}

function line(img, x0, y0, x1, y1, color, a = 255) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPx(img, x0, y0, color, a);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// --- Animations --------------------------------------------------------------------------------

const SURVIVOR_ANIMS = {
  idle: { fps: 6, frames: [0, 1, 2, 1].map((b) => ({ breathe: b / 2 })) },
  walk: { fps: 10, frames: [...Array(8)].map((_, i) => ({ phase: i / 8, stride: 1 })) },
  run: { fps: 12, frames: [...Array(8)].map((_, i) => ({ phase: i / 8, stride: 1.45 })) },
  shoot: { fps: 15, frames: [1, 0.6, 0.25, 0].map((recoil, i) => ({ recoil, muzzle: i === 0 })) },
  reload: { fps: 10, frames: [0.2, 0.5, 0.8, 1, 1, 0.8, 0.5, 0.2].map((reload) => ({ reload })) },
  hit: { fps: 10, frames: [1, 0.75, 0.45, 0.15].map((hit, i) => ({ hit, flash: i === 0 })) },
};
const ZOMBIE_ANIMS = {
  idle: { fps: 5, frames: [0, 0.25, 0.5, 0.75].map((phase) => ({ phase, stride: 0.15 })) },
  walk: { fps: 8, frames: [...Array(8)].map((_, i) => ({ phase: i / 8, stride: 1 })) },
  attack: { fps: 10, frames: [0.15, 0.35, 0.55, 0.75, 0.9, 1].map((attack) => ({ attack })) },
  hit: { fps: 10, frames: [1, 0.6, 0.25].map((hit, i) => ({ hit, flash: i === 0 })) },
  stun: { fps: 8, frames: [0.3, 0.5, 0.3, 0.1, 0.3, 0.5].map((hit, i) => ({ hit, phase: i / 6, stride: 0.2, stun: true })) },
  death: { fps: 10, frames: [0.08, 0.2, 0.35, 0.52, 0.7, 0.86, 0.96, 1].map((death, i) => ({ death, flash: i === 0 })) },
};

function survivorFrame(P, yaw, f, aimYaw) {
  const r = sprite(P, survivor({ yaw, aimYaw, ...f }), { flash: f.flash });
  if (f.muzzle && r.muzzle) {
    const dir = [-Math.sin(aimYaw ?? yaw), 0];
    muzzleFlash(r.img, r.muzzle[0], r.muzzle[1], P.charPx > 45 ? 3 : 2, dir);
  }
  return r;
}
const zombieFrame = (P, yaw, f) => sprite(P, shambler({ yaw, ...f }), { flash: f.flash });

// Étourdissement : petites étoiles qui tournent au-dessus de la tête.
function stunStars(img, cx, cy, t) {
  for (let s = 0; s < 3; s++) {
    const a = t * Math.PI * 2 + (s * Math.PI * 2) / 3;
    const x = Math.round(cx + Math.cos(a) * 6);
    const y = Math.round(cy + Math.sin(a) * 2);
    setPx(img, x, y, [255, 230, 120]);
    setPx(img, x + 1, y, [255, 180, 60]);
  }
}

// --- Scène de référence ------------------------------------------------------------------------

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

function groundFn(mats) {
  return (x, y) => {
    const n = hash(Math.floor(x * 9), Math.floor(y * 9));
    if (y > -1 && y < 2.5) {
      if (Math.abs(y - 0.75) < 0.06 && ((x % 2) + 2) % 2 < 1.1) return { ramp: mats.paint.ramp, idx: 2 };
      // Bitume : grandes plaques usées et rares gravillons, plutôt qu'un bruit pixel par pixel.
      const patch = smooth(x * 0.5, y * 0.5);
      const crack = Math.abs(smooth(x * 1.3 + 7, y * 1.3) - 0.5) < 0.015;
      if (crack) return { ramp: mats.asphalt.ramp, idx: 0 };
      return { ramp: mats.asphalt.ramp, idx: n > 0.985 ? 4 : n < 0.015 ? 1 : patch > 0.62 ? 3 : 2 };
    }
    if ((y >= 2.5 && y < 2.62) || (y <= -1 && y > -1.12)) return { ramp: mats.sidewalk.ramp, idx: 4 };
    if ((y >= 2.62 && y < 4.1) || (y <= -1.12 && y > -2.6)) {
      const fx = ((x % 1) + 1) % 1, fy = (((y - 0.12) % 1) + 1) % 1;
      if (fx < 0.05 || fy < 0.05) return { ramp: mats.sidewalk.ramp, idx: 1 };
      return { ramp: mats.sidewalk.ramp, idx: n < 0.03 ? 2 : n > 0.99 ? 4 : smooth(x * 0.7, y * 0.7) > 0.7 ? 2 : 3 };
    }
    const patch = smooth(x * 0.45, y * 0.45);
    let idx = patch > 0.55 ? 3 : 2;
    // Touffes : petits motifs verticaux plutôt que du bruit isolé.
    const tuft = hash(Math.floor(x * 4), Math.floor(y * 4));
    if (tuft > 0.93 && hash(Math.floor(x * 9), Math.floor(y * 9) + 1) > 0.5) idx += 1;
    if (tuft < 0.04) idx -= 1;
    return { ramp: mats.grass.ramp, idx };
  };
}

function scene(P, { hud = false } = {}) {
  const { pal, ppu, style } = setup(P);
  const [W, H] = P.internal;
  const cam = camera(P.env.yaw, P.env.pitch);
  const props = [];
  let id = 10;
  const add = (fn, x, y, ...args) => {
    const rig = new Rig(id);
    fn(rig, x, y, ...args);
    for (const p of rig.prims) p.shadow = true;
    props.push({ id, x, y, prims: rig.prims });
    id++;
  };
  add(crate, -4.2, 3.3, 0.8, 0.1);
  add(crate, -3.3, 3.5, 0.7, -0.2);
  add(jersey, -1.4, 3.3);
  add(lamp, 1.4, 3.7);
  add(barrel, 3.6, 3.2);
  add(barrel, 4.3, 3.5);
  add(tree, -6.6, 5.4);
  add(tree, 6.4, 5.8);
  add(barricade, 2.6, -1.9, 0.08);
  add(crate, 5.6, -3.1, 0.8, 0.3);
  add(tree, -5.8, -4.6);
  const target = [0.4, 0.6, 0];
  const env = render({
    w: W, h: H, cam, ppu, anchor: [W / 2, H / 2], target, materials: pal.mats, style,
    prims: props.flatMap((p) => p.prims), ground: groundFn(pal.mats),
    blobs: [],
  });
  const baseDepth = {};
  for (const p of props) baseDepth[p.id] = 60 + project(env.view, [p.x, p.y, 0])[2];

  // Personnages : directions arrondies à 45°, comme en jeu.
  const camYaw = P.env.yaw * RAD;
  const snapYaw = (wx, wy) => {
    const world = Math.atan2(-wx, wy) - camYaw;
    return Math.round(world / (Math.PI / 4)) * (Math.PI / 4);
  };
  const surv = { x: -1.8, y: 0.2 };
  const zombies = [
    { x: 1.6, y: 1.0, pose: { phase: 0.25, stride: 1, hit: 0.8 } },
    { x: 3.9, y: 1.9, pose: { phase: 0.6, stride: 1 } },
    { x: 4.6, y: -0.3, pose: { attack: 0.55 } },
    { x: 0.9, y: -2.2, pose: { death: 1 }, yaw: 1 },
  ];
  const actors = [];
  const aim = snapYaw(zombies[0].x - surv.x, zombies[0].y - surv.y);
  actors.push({ ...surv, r: survivorFrame(P, snapYaw(1, -0.2), { phase: 0.3, stride: 1, recoil: 1 }, aim), kind: 's' });
  for (const z of zombies) {
    const yaw = z.yaw ?? snapYaw(surv.x - z.x, surv.y - z.y);
    actors.push({ x: z.x, y: z.y, r: zombieFrame(P, yaw, z.pose), kind: 'z' });
  }
  const img = env.img;
  // Ombres de contact (ellipses) sous les personnages, puis personnages triés par profondeur.
  for (const a of actors) {
    const [px, py] = project(env.view, [a.x, a.y, 0]);
    a.px = Math.round(px);
    a.py = Math.round(py);
    a.depth = 60 + project(env.view, [a.x, a.y, 0])[2];
    const rx = Math.round(P.charPx * 0.26), ry = Math.max(2, Math.round(rx * 0.45));
    for (let j = -ry; j <= ry; j++)
      for (let i = -rx; i <= rx; i++) if ((i / rx) ** 2 + (j / ry) ** 2 <= 1) setPx(img, a.px + i, a.py + j, pal.black, 90);
  }
  actors.sort((a, b) => b.depth - a.depth);
  for (const a of actors) {
    const s = a.r;
    const ox = a.px - s.anchor[0], oy = a.py - s.anchor[1];
    for (let j = 0; j < s.img.h; j++)
      for (let i = 0; i < s.img.w; i++) {
        const c = getPx(s.img, i, j);
        if (!c || c[3] === 0) continue;
        const X = ox + i, Y = oy + j;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const o = env.obj[Y * W + X];
        if (o >= 10 && baseDepth[o] < a.depth) continue; // un décor plus proche masque le personnage
        setPx(img, X, Y, c);
      }
    if (a.kind === 's') {
      a.muzzleXY = [ox + s.muzzle[0], oy + s.muzzle[1]];
    }
  }
  // Effets : traceur, flash de bouche, étincelles d'impact, douille.
  const s = actors.find((a) => a.kind === 's');
  const z = actors.find((a) => a.kind === 'z' && a.x === zombies[0].x);
  const [mx, my] = s.muzzleXY;
  const hx = z.px, hy = z.py - Math.round(P.charPx * 0.55);
  const len = Math.hypot(hx - mx, hy - my);
  const ux = (hx - mx) / len, uy = (hy - my) / len;
  line(img, mx + ux * 6, my + uy * 6, mx + ux * len * 0.7, my + uy * len * 0.7, [255, 214, 92]);
  line(img, mx + ux * 10, my + uy * 10 - 1, mx + ux * len * 0.55, my + uy * len * 0.55 - 1, [255, 250, 220], 160);
  muzzleFlash(img, mx, my, P.charPx > 45 ? 3 : 2, [ux, uy]);
  const sparks = [[-2, -1], [-3, 1], [-1, -3], [-4, -2], [-2, 2], [0, -4]];
  for (const [dx, dy] of sparks) setPx(img, hx + dx, hy + dy, dy < -2 ? [255, 250, 220] : [255, 190, 70]);
  for (const [dx, dy] of [[2, -1], [3, 0], [2, 2], [4, -2]]) setPx(img, hx + dx, hy + dy, pal.mats.storm.ramp[2]);
  setPx(img, s.px + 4, s.py - Math.round(P.charPx * 0.5), [230, 180, 70]);
  setPx(img, s.px + 6, s.py - Math.round(P.charPx * 0.4), [200, 140, 50]);
  if (hud) drawHud(img, W, H);
  return img;
}

function drawHud(img, W, H) {
  // HUD provisoire : santé/bouclier en haut à gauche, objectif, munitions, joysticks, actions.
  panel(img, 6, 6, 92, 26);
  icon(img, 'heart', 10, 10, UI.health);
  bar(img, 20, 10, 74, 7, 0.72, UI.health, UI.healthDark);
  icon(img, 'shield', 10, 20, UI.shield);
  bar(img, 20, 20, 74, 7, 0.4, UI.shield, UI.shieldDark);
  panel(img, (W >> 1) - 50, 6, 100, 17);
  text(img, 'VAGUE 3/5', (W >> 1) - 46, 9, UI.accentLight);
  text(img, 'ZOMBIES 12', (W >> 1) - 46, 16 - 1, UI.textDim);
  panel(img, W - 70, 6, 64, 17);
  icon(img, 'ammo', W - 66, 11, UI.actionLight);
  text(img, '24/120', W - 56, 12, UI.text);
  joystick(img, 46, H - 46, 26, [0.5, -0.3]);
  joystick(img, W - 46, H - 46, 26, [0.7, -0.2]);
  button(img, W - 108, H - 32, 30, 16, 'TIR', 'normal');
  button(img, W - 108, H - 54, 30, 16, 'R', 'normal', 'neutral');
}

// --- Planches ----------------------------------------------------------------------------------

function sheet(P) {
  const cell = sprite(P, survivor()).img;
  const cw = cell.w, ch = cell.h;
  const rows = [];
  rows.push(['SURVIVANT - REPOS 8 DIRECTIONS', DIRS.map((_, k) => survivorFrame(P, dirYaw(k), SURVIVOR_ANIMS.idle.frames[0]).img)]);
  rows.push(['MARCHE SE', SURVIVOR_ANIMS.walk.frames.map((f) => survivorFrame(P, dirYaw(1), f).img)]);
  rows.push(['MARCHE N  - VISEE E (INDEPENDANTE)', SURVIVOR_ANIMS.walk.frames.map((f) => survivorFrame(P, dirYaw(4), f, dirYaw(2)).img)]);
  rows.push(['TIR / RECHARGEMENT / DEGATS', [...SURVIVOR_ANIMS.shoot.frames.slice(0, 2), ...SURVIVOR_ANIMS.reload.frames.slice(1, 4), ...SURVIVOR_ANIMS.hit.frames.slice(0, 3)].map((f) => survivorFrame(P, dirYaw(1), f).img)]);
  rows.push(['RODEUR - REPOS 8 DIRECTIONS', DIRS.map((_, k) => zombieFrame(P, dirYaw(k), {}).img)]);
  rows.push(['RODEUR - MARCHE SW', ZOMBIE_ANIMS.walk.frames.map((f) => zombieFrame(P, dirYaw(7), f).img)]);
  rows.push(['RODEUR - ATTAQUE / IMPACT / DEFAITE', [...ZOMBIE_ANIMS.attack.frames.filter((_, i) => i % 2 === 0), ZOMBIE_ANIMS.hit.frames[0], ZOMBIE_ANIMS.hit.frames[1], ...ZOMBIE_ANIMS.death.frames.filter((_, i) => i % 3 === 1)].map((f) => zombieFrame(P, dirYaw(7), f).img)]);
  const lab = 9;
  const out = createImage(8 * cw + 8, rows.length * (ch + lab) + 4, hex('#3b4636'));
  rows.forEach(([label, imgs], r) => {
    const y = r * (ch + lab) + 2;
    text(out, label, 4, y + 1, [230, 230, 220]);
    imgs.forEach((im, i) => {
      rect(out, 4 + i * cw, y + lab - 1, cw - 1, ch, (i + r) % 2 ? hex('#45523f') : hex('#3f4b3a'));
      blit(out, im, 4 + i * cw, y + lab - 1);
    });
  });
  return out;
}

/** GIF : plusieurs animations côte à côte, sur une boucle commune de `cycle` images. */
function animGif(P, cells, cycle, k) {
  const sample = cells[0].frames[0].img;
  const cw = sample.w, ch = sample.h + 8;
  const cols = Math.min(cells.length, 4);
  const rows = Math.ceil(cells.length / cols);
  const frames = [];
  for (let t = 0; t < cycle; t++) {
    const im = createImage(cols * cw, rows * ch, hex('#3f4b3a'));
    cells.forEach((c, i) => {
      const x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
      text(im, c.label, x + 2, y + 2, [230, 230, 220]);
      const f = c.frames[Math.min(c.frames.length - 1, Math.floor((t * c.fps) / 10) % (c.hold ? c.frames.length + c.hold : c.frames.length))];
      blit(im, f.img, x, y + 8);
      if (c.post) c.post(im, x, y + 8, t);
    });
    frames.push(scale(im, k));
  }
  return encodeGIF(frames, 10);
}

const renderAnim = (P, anim, fn) => ({ fps: anim.fps, frames: anim.frames.map(fn) });

function gifs(P, dir) {
  const k = P.charPx > 45 ? 3 : 4;
  const walk8 = DIRS.map((d, i) => ({ label: d, ...renderAnim(P, SURVIVOR_ANIMS.walk, (f) => survivorFrame(P, dirYaw(i), f)) }));
  fs.writeFileSync(path.join(dir, 'survivant-marche-8dir.gif'), animGif(P, walk8, 40, k));
  const sd = dirYaw(1);
  const actions = [
    { label: 'REPOS', ...renderAnim(P, SURVIVOR_ANIMS.idle, (f) => survivorFrame(P, sd, f)) },
    { label: 'COURSE', ...renderAnim(P, SURVIVOR_ANIMS.run, (f) => survivorFrame(P, dirYaw(2), f)) },
    { label: 'TIR', ...renderAnim(P, SURVIVOR_ANIMS.shoot, (f) => survivorFrame(P, sd, f)) },
    { label: 'RECHARGE', ...renderAnim(P, SURVIVOR_ANIMS.reload, (f) => survivorFrame(P, sd, f)) },
    { label: 'DEGATS', ...renderAnim(P, SURVIVOR_ANIMS.hit, (f) => survivorFrame(P, sd, f)), hold: 4 },
    { label: 'VISEE LIBRE', fps: 10, frames: [...Array(8)].map((_, i) => survivorFrame(P, dirYaw(0), { phase: i / 8, stride: 1 }, dirYaw(i))) },
    { label: 'STRAFE', fps: 10, frames: [...Array(8)].map((_, i) => survivorFrame(P, dirYaw(2), { phase: i / 8, stride: 1 }, dirYaw(0))) },
    { label: 'TIR MARCHE', fps: 10, frames: [...Array(8)].map((_, i) => survivorFrame(P, dirYaw(6), { phase: i / 8, stride: 1, recoil: i % 2 ? 0.2 : 1, muzzle: i % 2 === 0 }, dirYaw(1))) },
  ];
  fs.writeFileSync(path.join(dir, 'survivant-actions.gif'), animGif(P, actions, 40, k));
  const zd = dirYaw(7);
  const zs = [
    { label: 'REPOS', ...renderAnim(P, ZOMBIE_ANIMS.idle, (f) => zombieFrame(P, zd, f)) },
    { label: 'MARCHE', ...renderAnim(P, ZOMBIE_ANIMS.walk, (f) => zombieFrame(P, zd, f)) },
    { label: 'POURSUITE', fps: 13, frames: ZOMBIE_ANIMS.walk.frames.map((f) => zombieFrame(P, dirYaw(6), { ...f, stride: 1.3 })) },
    { label: 'ATTAQUE', ...renderAnim(P, ZOMBIE_ANIMS.attack, (f) => zombieFrame(P, zd, f)), hold: 3 },
    { label: 'IMPACT', ...renderAnim(P, ZOMBIE_ANIMS.hit, (f) => zombieFrame(P, zd, f)), hold: 4 },
    {
      label: 'ETOURDI', ...renderAnim(P, ZOMBIE_ANIMS.stun, (f) => zombieFrame(P, zd, f)),
      post: (im, x, y, t) => stunStars(im, x + (sample(P).img.w >> 1) + Math.round(P.charPx * 0.12), y + sample(P).anchor[1] - Math.round(P.charPx * 1.05), t / 10),
    },
    { label: 'DEFAITE', ...renderAnim(P, ZOMBIE_ANIMS.death, (f) => zombieFrame(P, zd, f)), hold: 8 },
    { label: 'MARCHE 8DIR', fps: 10, frames: [...Array(16)].map((_, i) => zombieFrame(P, dirYaw(i >> 1), { phase: (i % 8) / 8, stride: 1 })) },
  ];
  fs.writeFileSync(path.join(dir, 'rodeur-actions.gif'), animGif(P, zs, 40, k));
}
const sampleCache = new Map();
function sample(P) {
  if (!sampleCache.has(P.id)) sampleCache.set(P.id, sprite(P, shambler()));
  return sampleCache.get(P.id);
}

function uiKit() {
  const im = createImage(300, 170, UI.panelDeep);
  text(im, 'BOUTONS : NORMAL / SURVOL / PRESSE / SELECTION / DESACTIVE', 6, 4, UI.textDim);
  ['normal', 'hover', 'pressed', 'selected', 'disabled'].forEach((s, i) => button(im, 8 + i * 58, 14, 50, 16, 'JOUER', s));
  ['normal', 'hover', 'pressed', 'selected', 'disabled'].forEach((s, i) => button(im, 8 + i * 58, 38, 50, 16, 'ARSENAL', s, 'neutral'));
  text(im, 'PANNEAU / BARRES / ICONES', 6, 62, UI.textDim);
  panel(im, 6, 70, 120, 44);
  icon(im, 'heart', 12, 76, UI.health);
  bar(im, 22, 76, 98, 7, 0.72, UI.health, UI.healthDark);
  icon(im, 'shield', 12, 86, UI.shield);
  bar(im, 22, 86, 98, 7, 0.4, UI.shield, UI.shieldDark);
  ['heart', 'shield', 'ammo', 'wrench', 'coin', 'crystal'].forEach((n, i) => icon(im, n, 12 + i * 12, 99, [UI.health, UI.shield, UI.actionLight, UI.textDim, UI.legendary, UI.accentLight][i]));
  text(im, 'CARTES DE RARETE', 134, 62, UI.textDim);
  const rar = [['common', 'COMMUN'], ['uncommon', 'PEU C.'], ['rare', 'RARE'], ['epic', 'EPIQUE'], ['legendary', 'LEGEND.']];
  rar.forEach(([r, l], i) =>
    card(im, 134 + i * 33, 70, 31, 44, r, l.slice(0, 6), (img, x, y, w, h) => {
      rect(img, x + 3, y + h / 2 - 1, w - 8, 4, hex('#44475a'));
      rect(img, x + 5, y + h / 2 + 3, 4, 4, hex('#7a4a26'));
      rect(img, x + w - 6, y + h / 2, 3, 2, hex('#8a91aa'));
    }),
  );
  text(im, 'JOYSTICKS TACTILES', 6, 120, UI.textDim);
  joystick(im, 34, 146, 20, [0, 0]);
  joystick(im, 84, 146, 20, [0.8, -0.4]);
  text(im, 'JETONS DE COULEUR', 134, 120, UI.textDim);
  Object.entries(UI).forEach(([, c], i) => rect(im, 134 + (i % 12) * 13, 128 + ((i / 12) | 0) * 13, 11, 11, c));
  return im;
}

function paletteBoard() {
  const pals = Object.values(PALETTES);
  const im = createImage(310, 20 + pals.length * 80, hex('#16131f'));
  pals.forEach((p, pi) => {
    const y0 = 6 + pi * 80;
    text(im, `PALETTE ${p.label}  (${paletteColors(p).size} COULEURS)`, 6, y0, [230, 230, 230]);
    Object.entries(p.mats).filter(([n]) => n !== 'white').forEach(([n, m], i) => {
      const x = 6 + (i % 9) * 33, y = y0 + 9 + ((i / 9) | 0) * 22;
      [...m.ramp, m.outline].forEach((c, k) => rect(im, x + k * 6, y, 6, 10, c));
      text(im, n.slice(0, 7), x, y + 12, [150, 150, 160]);
    });
  });
  return im;
}

/** Compare : rendu brut, rendu final (contours + nettoyage), et retouche manuelle si présente. */
function methodBoard() {
  const P = PROPOSALS.A;
  const { pal, ppu } = setup(P);
  const rig = survivor({ yaw: dirYaw(1) });
  const w = 64, h = 52, anchor = [32, 46];
  const raw = render({ w, h, cam: camera(0, P.charPitch), ppu, anchor, materials: pal.mats, style: { outline: 'none', light: LIGHT, ambient: 0.22 }, prims: rig.prims });
  const fin = render({ w, h, cam: camera(0, P.charPitch), ppu, anchor, materials: pal.mats, style: { outline: 'selout', black: pal.black, light: LIGHT, ambient: 0.22 }, prims: rig.prims, decals: rig.decals });
  const im = createImage(3 * w + 8, h + 12, hex('#3f4b3a'));
  text(im, 'BRUT', 4, 2, [230, 230, 220]);
  text(im, 'AUTO', w + 4, 2, [230, 230, 220]);
  blit(im, raw.img, 2, 10);
  blit(im, fin.img, w + 4, 10);
  const retouch = path.join(ROOT, 'assets-src/retouch/survivant_SE_repos_A.txt');
  text(im, fs.existsSync(retouch) ? 'RETOUCHE' : 'RETOUCHE ?', 2 * w + 6, 2, [230, 230, 220]);
  if (fs.existsSync(retouch)) blit(im, fromAscii(fs.readFileSync(retouch, 'utf8'), pal), 2 * w + 6, 10);
  fs.writeFileSync(path.join(OUT, 'methode-1-comparaison.png'), encodePNG(scale(im, 5)));
  return fin.img;
}

// Format texte de retouche : une lettre = une couleur de la palette (légende en tête de fichier).
export function toAscii(img, pal) {
  const colors = [...paletteColors(pal).keys()];
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!$%&*+=?@^~<>';
  const used = new Map();
  const rows = [];
  for (let y = 0; y < img.h; y++) {
    let row = '';
    for (let x = 0; x < img.w; x++) {
      const c = getPx(img, x, y);
      if (c[3] === 0) {
        row += '.';
        continue;
      }
      const key = c.slice(0, 3).join(',');
      if (!used.has(key)) used.set(key, chars[used.size]);
      row += used.get(key);
    }
    rows.push(row);
  }
  void colors;
  const legend = [...used].map(([k, ch]) => `${ch}=${k}`).join(' ');
  return `# legende: ${legend}\n${rows.join('\n')}\n`;
}
export function fromAscii(src, _pal) {
  const lines = src.split('\n');
  const legend = Object.fromEntries(lines[0].replace('# legende: ', '').split(' ').map((e) => [e[0], e.slice(2).split(',').map(Number)]));
  const rows = lines.slice(1).filter((l) => l.length);
  const im = createImage(rows[0].length, rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => ch !== '.' && setPx(im, x, y, legend[ch])));
  return im;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const P of Object.values(PROPOSALS)) {
    const dir = path.join(OUT, `proposition-${P.id}`);
    fs.mkdirSync(dir, { recursive: true });
    const sc = scene(P);
    fs.writeFileSync(path.join(dir, 'scene-1x.png'), encodePNG(sc));
    fs.writeFileSync(path.join(dir, 'scene-x2.png'), encodePNG(scale(sc, 2)));
    fs.writeFileSync(path.join(dir, 'scene-hud-x2.png'), encodePNG(scale(scene(P, { hud: true }), 2)));
    fs.writeFileSync(path.join(dir, 'planche-sprites-x3.png'), encodePNG(scale(sheet(P), 3)));
    gifs(P, dir);
    console.log(`proposition ${P.id} : ok`);
  }
  fs.writeFileSync(path.join(OUT, 'ui-kit-x3.png'), encodePNG(scale(uiKit(), 3)));
  fs.writeFileSync(path.join(OUT, 'palettes-x3.png'), encodePNG(scale(paletteBoard(), 3)));
  const fin = methodBoard();
  const retouchDir = path.join(ROOT, 'assets-src/retouch');
  const base = path.join(retouchDir, 'survivant_SE_repos_A.base.txt');
  fs.mkdirSync(retouchDir, { recursive: true });
  fs.writeFileSync(base, toAscii(fin, PALETTES.tempete));
  console.log('planches : ok');
}

main();
