// Encodeurs PNG et GIF minimalistes, sans dépendance (node:zlib uniquement).
import zlib from 'node:zlib';

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** @param {{w:number,h:number,data:Uint8ClampedArray}} img RGBA */
export function encodePNG(img) {
  const { w, h, data } = img;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function lzw(indices, minCodeSize) {
  const out = [];
  let acc = 0;
  let nbits = 0;
  const emit = (code, size) => {
    acc |= code << nbits;
    nbits += size;
    while (nbits >= 8) {
      out.push(acc & 0xff);
      acc >>>= 8;
      nbits -= 8;
    }
  };
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let codeSize = minCodeSize + 1;
  let next = eoi + 1;
  let table = new Map();
  emit(clear, codeSize);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const code = table.get(key);
    if (code === undefined) {
      emit(prefix, codeSize);
      if (next === 4096) {
        emit(clear, codeSize);
        next = eoi + 1;
        codeSize = minCodeSize + 1;
        table = new Map();
      } else {
        if (next >= 1 << codeSize) codeSize++;
        table.set(key, next++);
      }
      prefix = k;
    } else prefix = code;
  }
  emit(prefix, codeSize);
  emit(eoi, codeSize);
  if (nbits > 0) out.push(acc & 0xff);
  return out;
}

/**
 * GIF animé avec transparence (index 0). Toutes les frames ont la même taille.
 * @param {Array<{w:number,h:number,data:Uint8ClampedArray}>} frames
 * @param {number|number[]} delayCs délai en centièmes de seconde
 */
export function encodeGIF(frames, delayCs) {
  const { w, h } = frames[0];
  const colors = new Map();
  const list = [[0, 0, 0]];
  for (const f of frames) {
    for (let i = 0; i < f.data.length; i += 4) {
      if (f.data[i + 3] < 128) continue;
      const key = (f.data[i] << 16) | (f.data[i + 1] << 8) | f.data[i + 2];
      if (!colors.has(key)) {
        colors.set(key, list.length);
        list.push([f.data[i], f.data[i + 1], f.data[i + 2]]);
      }
    }
  }
  if (list.length > 256) throw new Error(`GIF : ${list.length} couleurs (max 256)`);
  const bits = Math.max(1, Math.ceil(Math.log2(list.length)));
  const minCodeSize = Math.max(2, bits);
  const bytes = [...Buffer.from('GIF89a', 'ascii')];
  const u16 = (v) => bytes.push(v & 0xff, (v >> 8) & 0xff);
  u16(w);
  u16(h);
  bytes.push(0x80 | ((bits - 1) << 4) | (bits - 1), 0, 0);
  for (let i = 0; i < 1 << bits; i++) bytes.push(...(list[i] ?? [0, 0, 0]));
  bytes.push(0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0', 'ascii'), 0x03, 0x01, 0, 0, 0);
  frames.forEach((f, fi) => {
    const delay = Array.isArray(delayCs) ? delayCs[fi] : delayCs;
    bytes.push(0x21, 0xf9, 0x04, (2 << 2) | 1);
    u16(delay);
    bytes.push(0, 0);
    bytes.push(0x2c);
    u16(0);
    u16(0);
    u16(w);
    u16(h);
    bytes.push(0);
    const idx = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      idx[p] = f.data[i + 3] < 128 ? 0 : colors.get((f.data[i] << 16) | (f.data[i + 1] << 8) | f.data[i + 2]);
    }
    bytes.push(minCodeSize);
    const data = lzw(idx, minCodeSize);
    for (let i = 0; i < data.length; i += 255) {
      const block = data.slice(i, i + 255);
      bytes.push(block.length, ...block);
    }
    bytes.push(0);
  });
  bytes.push(0x3b);
  return Buffer.from(bytes);
}
