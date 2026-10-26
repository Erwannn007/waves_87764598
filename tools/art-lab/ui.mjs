// Kit d'interface pixel art (proposition de design system) : jetons de couleur, panneaux,
// boutons avec états, barres, joysticks, cartes de rareté, icônes 7×7 dessinées à la main.
import { hex, rect, setPx, text, textWidth } from './image.mjs';

export const UI = Object.fromEntries(
  Object.entries({
    ink: '#0d0a14',
    panelDeep: '#15122a',
    panel: '#241f40',
    panelRaised: '#332c5a',
    bevel: '#4a4280',
    text: '#f2ecff',
    textDim: '#a59cc4',
    textOff: '#5d567e',
    accent: '#9a3be0',
    accentLight: '#d47bff',
    action: '#de6a22',
    actionLight: '#ffab45',
    actionDark: '#8a3514',
    health: '#e0463c',
    healthDark: '#7a1e22',
    shield: '#3fa7ff',
    shieldDark: '#1d4e8a',
    ok: '#5ec7b2',
    common: '#9aa2b8',
    uncommon: '#5fbf4a',
    rare: '#3f8cff',
    epic: '#b25cff',
    legendary: '#ff9a2e',
  }).map(([k, c]) => [k, hex(c)]),
);

/** Panneau : contour encre, biseau clair en haut à gauche, ombre en bas à droite. */
export function panel(img, x, y, w, h, fill = UI.panel, bevel = UI.bevel) {
  rect(img, x + 1, y, w - 2, h, UI.ink);
  rect(img, x, y + 1, w, h - 2, UI.ink);
  rect(img, x + 1, y + 1, w - 2, h - 2, fill);
  rect(img, x + 2, y + 1, w - 4, 1, bevel);
  rect(img, x + 1, y + 2, 1, h - 4, bevel);
  rect(img, x + 2, y + h - 2, w - 4, 1, UI.panelDeep);
}

/** Bouton : états normal | hover | pressed | selected | disabled. */
export function button(img, x, y, w, h, label, state = 'normal', kind = 'action') {
  const pal = kind === 'action'
    ? { fill: UI.action, light: UI.actionLight, dark: UI.actionDark }
    : { fill: UI.panelRaised, light: UI.bevel, dark: UI.panelDeep };
  let { fill, light, dark } = pal;
  let dy = 0;
  let txt = UI.text;
  if (state === 'hover') {
    fill = light;
    light = UI.text;
  }
  if (state === 'pressed') {
    dy = 1;
    [light, dark] = [dark, light];
  }
  if (state === 'disabled') {
    fill = UI.panel;
    light = UI.panelRaised;
    dark = UI.panelDeep;
    txt = UI.textOff;
  }
  // Ombre portée (disparaît quand le bouton est enfoncé).
  if (state !== 'pressed') rect(img, x + 1, y + h, w - 2, 1, UI.ink);
  rect(img, x + 1, y + dy, w - 2, h, UI.ink);
  rect(img, x, y + 1 + dy, w, h - 2, UI.ink);
  rect(img, x + 1, y + 1 + dy, w - 2, h - 2, fill);
  rect(img, x + 2, y + 1 + dy, w - 4, 1, light);
  rect(img, x + 2, y + h - 2 + dy, w - 4, 1, dark);
  if (state === 'selected') {
    rect(img, x - 2, y - 2, w + 4, 1, UI.accentLight);
    rect(img, x - 2, y + h + 1, w + 4, 1, UI.accentLight);
    rect(img, x - 2, y - 2, 1, h + 4, UI.accentLight);
    rect(img, x + w + 1, y - 2, 1, h + 4, UI.accentLight);
  }
  const tw = textWidth(label);
  text(img, label, x + ((w - tw) >> 1), y + ((h - 5) >> 1) + dy, txt);
}

export function bar(img, x, y, w, h, frac, fill, dark) {
  rect(img, x, y, w, h, UI.ink);
  rect(img, x + 1, y + 1, w - 2, h - 2, UI.panelDeep);
  const fw = Math.round((w - 2) * frac);
  rect(img, x + 1, y + 1, fw, h - 2, fill);
  rect(img, x + 1, y + h - 2, fw, 1, dark);
  for (let i = x + 1 + 6; i < x + w - 1; i += 6) rect(img, i, y + 1, 1, h - 2, UI.ink);
}

/** Joystick virtuel : anneau semi-transparent + manette décalée. */
export function joystick(img, cx, cy, r, knob = [0, 0], ring = UI.text) {
  for (let a = 0; a < 360; a += 1) {
    const t = (a * Math.PI) / 180;
    setPx(img, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), ring, 150);
    setPx(img, Math.round(cx + Math.cos(t) * (r - 1)), Math.round(cy + Math.sin(t) * (r - 1)), UI.ink, 90);
  }
  const kr = Math.round(r * 0.42);
  const kx = cx + knob[0] * (r - kr);
  const ky = cy + knob[1] * (r - kr);
  for (let j = -kr; j <= kr; j++)
    for (let i = -kr; i <= kr; i++) {
      const d = Math.hypot(i, j);
      if (d <= kr) setPx(img, kx + i, ky + j, d > kr - 1 ? UI.ink : j < -kr / 3 ? UI.text : UI.textDim, 210);
    }
}

const ICONS = {
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...', '.......'],
  shield: ['#######', '#######', '#######', '.#####.', '.#####.', '..###..', '...#...'],
  ammo: ['.#.#.#.', '#######', '#######', '#######', '#######', '#######', '#######'],
  wrench: ['.##....', '#..#...', '#..##..', '.####..', '...###.', '....###', '.....##'],
  coin: ['..###..', '.#####.', '##.####', '##.####', '##.####', '.#####.', '..###..'],
  crystal: ['...#...', '..###..', '.#####.', '.##.##.', '.#####.', '..###..', '...#...'],
};
export function icon(img, name, x, y, color, shade = UI.ink) {
  const rows = ICONS[name];
  rows.forEach((row, j) =>
    [...row].forEach((c, i) => {
      if (c === '#') setPx(img, x + i, y + j, color);
      else if (c === '.' && ((rows[j - 1] && rows[j - 1][i] === '#') || row[i - 1] === '#')) setPx(img, x + i, y + j, shade);
    }),
  );
}

/** Carte d'objet : bandeau de rareté, cadre, vignette. */
export function card(img, x, y, w, h, rarity, label, art) {
  panel(img, x, y, w, h, UI.panelDeep, UI.panelRaised);
  const c = UI[rarity];
  rect(img, x + 2, y + 2, w - 4, 3, c);
  rect(img, x + 2, y + h - 10, w - 4, 8, UI.panel);
  text(img, label, x + ((w - textWidth(label)) >> 1), y + h - 8, c);
  if (art) art(img, x + 2, y + 6, w - 4, h - 17);
}
