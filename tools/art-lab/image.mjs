// Manipulation d'images RGBA : création, collage, mise à l'échelle entière, texte bitmap.

export const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

export function createImage(w, h, fill = null) {
  const img = { w, h, data: new Uint8ClampedArray(w * h * 4) };
  if (fill) rect(img, 0, 0, w, h, fill);
  return img;
}

export function setPx(img, x, y, rgb, a = 255) {
  x |= 0;
  y |= 0;
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  if (a >= 255) {
    img.data[i] = rgb[0];
    img.data[i + 1] = rgb[1];
    img.data[i + 2] = rgb[2];
    img.data[i + 3] = 255;
  } else {
    const t = a / 255;
    img.data[i] = img.data[i] * (1 - t) + rgb[0] * t;
    img.data[i + 1] = img.data[i + 1] * (1 - t) + rgb[1] * t;
    img.data[i + 2] = img.data[i + 2] * (1 - t) + rgb[2] * t;
    img.data[i + 3] = Math.max(img.data[i + 3], a);
  }
}

export function getPx(img, x, y) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return null;
  const i = (y * img.w + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

export function rect(img, x, y, w, h, rgb) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setPx(img, i, j, rgb);
}

export function blit(dst, src, dx, dy) {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      if (src.data[i + 3] > 0) setPx(dst, dx + x, dy + y, [src.data[i], src.data[i + 1], src.data[i + 2]], src.data[i + 3]);
    }
}

export function scale(src, k) {
  const out = createImage(src.w * k, src.h * k);
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const si = (((y / k) | 0) * src.w + ((x / k) | 0)) * 4;
      const di = (y * out.w + x) * 4;
      for (let c = 0; c < 4; c++) out.data[di + c] = src.data[si + c];
    }
  return out;
}

export function crop(src, x, y, w, h) {
  const out = createImage(w, h);
  blit(out, { w: src.w, h: src.h, data: src.data }, -x, -y);
  return out;
}

// Police bitmap 3×5 maison (aucune licence tierce), utilisée pour les planches.
export const FONT = {
  A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.',
  E: '### #.. ##. #.. ###', F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#',
  I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.', K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###',
  M: '#.# ### ### #.# #.#', N: '##. #.# #.# #.# #.#', O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..',
  Q: '.#. #.# #.# ##. .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# .##', V: '#.# #.# #.# .#. .#.', W: '#.# #.# ### ### #.#', X: '#.# #.# .#. #.# #.#',
  Y: '#.# #.# .#. .#. .#.', Z: '### ..# .#. #.. ###',
  0: '### #.# #.# #.# ###', 1: '.#. ##. .#. .#. ###', 2: '##. ..# .#. #.. ###', 3: '##. ..# .#. ..# ##.',
  4: '#.# #.# ### ..# ..#', 5: '### #.. ##. ..# ##.', 6: '.## #.. ### #.# ###', 7: '### ..# .#. .#. .#.',
  8: '### #.# ### #.# ###', 9: '### #.# ### ..# ##.',
  '/': '..# ..# .#. #.. #..', ':': '... .#. ... .#. ...', '-': '... ... ### ... ...', '+': '... .#. ### .#. ...',
  '.': '... ... ... ... .#.', '%': '#.# ..# .#. #.. #.#', '(': '.#. #.. #.. #.. .#.', ')': '.#. ..# ..# ..# .#.',
  '>': '#.. .#. ..# .#. #..', '<': '..# .#. #.. .#. ..#', ' ': '... ... ... ... ...',
};
const glyph = (ch) => (FONT[ch] ?? FONT[' ']).replaceAll(' ', '');

export function text(img, str, x, y, rgb, k = 1) {
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const g = glyph(ch);
    for (let j = 0; j < 5; j++)
      for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '#') rect(img, cx + i * k, y + j * k, k, k, rgb);
    cx += 4 * k;
  }
  return cx - x;
}

export const textWidth = (str, k = 1) => str.length * 4 * k - k;
