// Palettes candidates. Chaque matériau est une rampe de 4 tons, du plus sombre au plus clair,
// avec un léger décalage de teinte (ombres froides, lumières chaudes).
import { hex } from './image.mjs';

const TEMPETE = {
  skin: ['#5a3530', '#94574a', '#cf8d6c', '#f2c09a'],
  jacket: ['#5e2018', '#a33a1e', '#de6a22', '#ffab45'],
  pants: ['#1b1f36', '#2c375c', '#43558a', '#6a84ba'],
  leather: ['#22150f', '#43291b', '#6c452b', '#97693f'],
  pack: ['#1f2818', '#394724', '#5c7134', '#8fa64b'],
  cap: ['#0f2b36', '#1b5460', '#2b8a8a', '#5ec7b2'],
  hair: ['#1a1014', '#33201e', '#55362a', '#7a5338'],
  gun: ['#101018', '#262734', '#44475a', '#8a91aa'],
  gunwood: ['#2a1710', '#4d2c18', '#7a4a26', '#a8743a'],
  zskin: ['#241a36', '#45365c', '#6b5c88', '#9b8eb6'],
  zcloth: ['#2b211d', '#47382e', '#6a5545', '#917b63'],
  zpants: ['#191a22', '#2b2d3a', '#454a5c', '#646b80'],
  storm: ['#5a1f8a', '#9a3be0', '#d47bff', '#f7d6ff'],
  eye: ['#ff7af4', '#ff7af4', '#ffd8fb', '#ffffff'],
  wood: ['#2c1a12', '#56341f', '#8b5a33', '#bf8a4f'],
  woodDark: ['#1d110c', '#3a2316', '#5e3b23', '#83573a'],
  metal: ['#1a1c24', '#363a48', '#5b6174', '#9aa2b8'],
  barrel: ['#3d0f12', '#7a1e1e', '#bb3a26', '#f06b3a'],
  concrete: ['#34343f', '#555663', '#7d7f8c', '#a9abb5'],
  leaf: ['#10241c', '#1d4029', '#2f6336', '#4f8f43'],
  bark: ['#1e130f', '#3a2519', '#5a3b26', '#7c5536'],
  lamp: ['#ffe28a', '#ffe28a', '#fff4c4', '#ffffff'],
  grass: ['#152a1f', '#1f3a27', '#2a4c2f', '#365f37', '#47733f'],
  asphalt: ['#17171f', '#20212b', '#2a2b37', '#363846', '#444758'],
  sidewalk: ['#30303a', '#45454f', '#585a65', '#6c6e7a', '#82848f'],
  paint: ['#6e6440', '#8f8450', '#b8a95e', '#d8c870', '#efe08a'],
  rust: ['#3a1d14', '#6b3420', '#9a5530', '#c27a45'],
  glass: ['#1b2630', '#2c4250', '#4a6a78', '#8fb0b8'],
  dirt: ['#2a2119', '#3d3024', '#54432f', '#6b5740', '#85704f'],
  white: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
};

function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function fromHsl([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255].map(Math.round);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((x) => Math.round(x * 255));
}

/** Contour sélectif : plus sombre que le ton le plus sombre, tiré vers le violet. */
function outlineOf(rgb) {
  const [h, s, l] = toHsl(rgb);
  return fromHsl([h * 0.7 + 0.75 * 0.3, Math.min(1, s * 0.8 + 0.1), l * 0.45]);
}

function build(src, transform = (c) => c, overrides = {}) {
  const mats = {};
  for (const [name, ramp] of Object.entries({ ...src, ...overrides })) {
    const r = ramp.map((c) => (overrides[name] ? hex(c) : transform(hex(c))));
    mats[name] = { ramp: r, outline: outlineOf(r[0]) };
    if (r.length > 4) mats[name].noOutline = true; // rampes de sol
  }
  for (const n of ['storm', 'eye', 'lamp']) mats[n].emissive = true;
  for (const n of ['gun', 'metal']) mats[n].metal = true;
  mats.white.noOutline = true;
  return mats;
}

/** « Cendres » : désaturé, lumière chaude ; les Rôdeurs virent au vert maladif. */
const cendres = (rgb) => {
  const [h, s, l] = toHsl(rgb);
  return fromHsl([h + (0.08 - h) * 0.12, s * 0.55, l * 0.96 + 0.02]);
};

export const PALETTES = {
  tempete: { label: 'TEMPETE', mats: build(TEMPETE), black: hex('#0d0a14') },
  cendres: {
    label: 'CENDRES',
    mats: build(TEMPETE, cendres, {
      zskin: ['#1f2a1e', '#3a4d33', '#5d744c', '#8ea06c'],
      storm: ['#2f6b3a', '#4fb054', '#9fe36e', '#e8ffc4'],
      eye: ['#d8ff6a', '#d8ff6a', '#f2ffc0', '#ffffff'],
    }),
    black: hex('#14110f'),
  },
};

/** Liste des couleurs d'une palette (pour la planche de palette et le contrôle de conformité). */
export function paletteColors(p) {
  const set = new Map();
  for (const [name, m] of Object.entries(p.mats)) {
    for (const c of [...m.ramp, m.outline]) set.set(c.join(','), name);
  }
  set.set(p.black.join(','), 'black');
  return set;
}
