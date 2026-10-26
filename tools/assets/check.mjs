// Contrôle des assets exportés : palette, alpha binaire, images vides ou rognées, tailles.
// Échoue (code 1) à la moindre erreur : utilisé avant chaque build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG } from '../art-lab/encode.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GEN = path.join(ROOT, 'public/assets/gen');
const MAX_TEXTURE = 2048;

const manifest = JSON.parse(fs.readFileSync(path.join(GEN, 'assets.json'), 'utf8'));
const palette = new Set(manifest.paletteColors);
const errors = [];
const warnings = [];

function checkPixels(name, img, region = { x: 0, y: 0, w: img.w, h: img.h }) {
  let opaque = 0;
  const offPalette = new Set();
  let partialAlpha = 0;
  let edge = false;
  for (let y = region.y; y < region.y + region.h; y++)
    for (let x = region.x; x < region.x + region.w; x++) {
      const i = (y * img.w + x) * 4;
      const a = img.data[i + 3];
      if (a === 0) continue;
      if (a !== 255) partialAlpha++;
      opaque++;
      const key = `${img.data[i]},${img.data[i + 1]},${img.data[i + 2]}`;
      if (!palette.has(key)) offPalette.add(key);
      if (x === region.x || y === region.y || x === region.x + region.w - 1 || y === region.y + region.h - 1) edge = true;
    }
  if (partialAlpha) errors.push(`${name} : ${partialAlpha} pixels semi-transparents (alpha binaire exigé)`);
  if (offPalette.size) errors.push(`${name} : ${offPalette.size} couleurs hors palette (ex. ${[...offPalette].slice(0, 3).join(' | ')})`);
  return { opaque, edge };
}

function load(file) {
  const img = decodePNG(fs.readFileSync(path.join(GEN, file)));
  if (img.w > MAX_TEXTURE || img.h > MAX_TEXTURE) errors.push(`${file} : ${img.w}×${img.h} dépasse ${MAX_TEXTURE}`);
  return img;
}

for (const [id, meta] of Object.entries(manifest.characters)) {
  const img = load(`${id}.png`);
  const cols = img.w / meta.frameW;
  const expected = meta.framesPerDir * meta.dirs.length;
  const counted = Object.values(meta.anims).reduce((n, a) => n + a.count, 0);
  if (counted !== meta.framesPerDir) errors.push(`${id} : ${counted} images déclarées, ${meta.framesPerDir} attendues par direction`);
  for (let n = 0; n < expected; n++) {
    const region = { x: (n % cols) * meta.frameW, y: Math.floor(n / cols) * meta.frameH, w: meta.frameW, h: meta.frameH };
    const dir = meta.dirs[Math.floor(n / meta.framesPerDir)];
    const local = n % meta.framesPerDir;
    const anim = Object.entries(meta.anims).find(([, a]) => local >= a.offset && local < a.offset + a.count)?.[0];
    const label = `${id}/${anim}_${dir}_${String(local - meta.anims[anim].offset).padStart(2, '0')}`;
    const { opaque, edge } = checkPixels(label, img, region);
    if (opaque === 0) errors.push(`${label} : image vide`);
    if (edge) errors.push(`${label} : touche le bord du cadre (sprite rogné)`);
  }
  if (id === 'survivor_upper') for (const d of meta.dirs) if (!meta.muzzle[d]) errors.push(`${id} : position de bouche manquante pour ${d}`);
}

checkPixels('tiles.png', load('tiles.png'));
const props = JSON.parse(fs.readFileSync(path.join(GEN, 'props.json'), 'utf8'));
const atlas = load('props.png');
for (const [name, f] of Object.entries(props.frames)) {
  const { opaque } = checkPixels(`props/${name}`, atlas, f.frame);
  if (!opaque) errors.push(`props/${name} : image vide`);
  if (!manifest.props.anchors[name]) errors.push(`props/${name} : ancre manquante`);
}
for (const id of Object.keys(manifest.props.colliders)) if (!props.frames[id]) errors.push(`props/${id} : sprite manquant`);

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors.slice(0, 40)) console.error(`✗ ${e}`);
  if (errors.length > 40) console.error(`… et ${errors.length - 40} autres erreurs`);
  process.exit(1);
}
console.log(`✓ assets conformes (${Object.keys(manifest.characters).length} feuilles de personnages, ${Object.keys(props.frames).length} sprites de décor, palette de ${palette.size} couleurs)`);
