// Rendu « volumes → pixel art » : lancer de rayons orthographique sur des primitives simples,
// ombrage quantifié sur des rampes de palette, contours automatiques, décalques ponctuels.
// C'est le test de la méthode 1 (génération entièrement programmatique).
import { createImage, setPx } from './image.mjs';

export const v = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  norm: (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};

// Matrices 3×3 en ligne (row-major) ; les colonnes sont les axes locaux exprimés dans le monde.
export const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export const rotZ = (a) => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];
export const rotX = (a) => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
export const rotY = (a) => [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)];
export function mmul(A, B) {
  const C = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) C[r * 3 + c] += A[r * 3 + k] * B[k * 3 + c];
  return C;
}
export const mv = (M, p) => [
  M[0] * p[0] + M[1] * p[1] + M[2] * p[2],
  M[3] * p[0] + M[4] * p[1] + M[5] * p[2],
  M[6] * p[0] + M[7] * p[1] + M[8] * p[2],
];
const mtv = (M, p) => [
  M[0] * p[0] + M[3] * p[1] + M[6] * p[2],
  M[1] * p[0] + M[4] * p[1] + M[7] * p[2],
  M[2] * p[0] + M[5] * p[1] + M[8] * p[2],
];

/** Construit un modèle articulé : pile de transformations + primitives en coordonnées monde. */
export class Rig {
  constructor(obj = 1) {
    this.prims = [];
    this.decals = [];
    this.stack = [{ M: I3, t: [0, 0, 0] }];
    this.obj = obj;
    this.layer = null;
  }
  _add(p) {
    p.layer = this.layer;
    this.prims.push(p);
  }
  /** Ne garde que les primitives (et décalques) d'un calque donné. */
  only(layer) {
    const r = Object.create(this);
    r.prims = this.prims.filter((p) => p.layer === layer);
    r.decals = this.decals.filter((d) => d.layer === layer);
    return r;
  }
  get T() {
    return this.stack[this.stack.length - 1];
  }
  P(p) {
    return v.add(mv(this.T.M, p), this.T.t);
  }
  /** Pousse une rotation R autour du point pivot (en coordonnées locales courantes). */
  push(R = I3, pivot = [0, 0, 0], offset = [0, 0, 0]) {
    const local = v.add(v.sub(pivot, mv(R, pivot)), offset);
    this.stack.push({ M: mmul(this.T.M, R), t: v.add(mv(this.T.M, local), this.T.t) });
    return this;
  }
  pop() {
    this.stack.pop();
    return this;
  }
  sphere(c, r, mat) {
    this._add({ type: 'ell', c: this.P(c), r: [r, r, r], M: this.T.M, mat, obj: this.obj });
  }
  ell(c, r, mat, R = I3) {
    this._add({ type: 'ell', c: this.P(c), r, M: mmul(this.T.M, R), mat, obj: this.obj });
  }
  cap(a, b, r, mat) {
    this._add({ type: 'cap', a: this.P(a), b: this.P(b), r, mat, obj: this.obj });
  }
  cyl(c, r, h, mat) {
    this._add({ type: 'cyl', c: this.P(c), r, h, mat, obj: this.obj });
  }
  box(c, h, mat, R = I3) {
    this._add({ type: 'box', c: this.P(c), h, M: mmul(this.T.M, R), mat, obj: this.obj });
  }
  decal(p, color, opts = {}) {
    this.decals.push({ p: this.P(p), color, layer: this.layer, ...opts });
  }
}

function hitEll(p, o, d) {
  const lo = mtv(p.M, v.sub(o, p.c));
  const ld = mtv(p.M, d);
  const so = [lo[0] / p.r[0], lo[1] / p.r[1], lo[2] / p.r[2]];
  const sd = [ld[0] / p.r[0], ld[1] / p.r[1], ld[2] / p.r[2]];
  const A = v.dot(sd, sd);
  const B = v.dot(so, sd);
  const C = v.dot(so, so) - 1;
  const disc = B * B - A * C;
  if (disc < 0) return null;
  const t = (-B - Math.sqrt(disc)) / A;
  const sp = v.add(so, v.mul(sd, t));
  return { t, n: v.norm(mv(p.M, [sp[0] / p.r[0], sp[1] / p.r[1], sp[2] / p.r[2]])) };
}

function hitCap(p, o, d) {
  const ba = v.sub(p.b, p.a);
  const oa = v.sub(o, p.a);
  const baba = v.dot(ba, ba);
  const bard = v.dot(ba, d);
  const baoa = v.dot(ba, oa);
  const rdoa = v.dot(d, oa);
  const oaoa = v.dot(oa, oa);
  const a = baba - bard * bard;
  let b = baba * rdoa - baoa * bard;
  let c = baba * oaoa - baoa * baoa - p.r * p.r * baba;
  let h = b * b - a * c;
  let t = null;
  if (h >= 0 && a > 1e-9) {
    t = (-b - Math.sqrt(h)) / a;
    const y = baoa + t * bard;
    if (!(y > 0 && y < baba)) t = null;
  }
  if (t === null) {
    let best = null;
    for (const e of [p.a, p.b]) {
      const oc = v.sub(o, e);
      b = v.dot(d, oc);
      c = v.dot(oc, oc) - p.r * p.r;
      h = b * b - c;
      if (h > 0) {
        const tt = -b - Math.sqrt(h);
        if (best === null || tt < best) best = tt;
      }
    }
    t = best;
  }
  if (t === null) return null;
  const pa = v.sub(v.add(o, v.mul(d, t)), p.a);
  const k = Math.max(0, Math.min(1, v.dot(pa, ba) / baba));
  return { t, n: v.norm(v.sub(pa, v.mul(ba, k))) };
}

function hitBox(p, o, d) {
  const lo = mtv(p.M, v.sub(o, p.c));
  const ld = mtv(p.M, d);
  let tmin = -Infinity;
  let tmax = Infinity;
  let axis = 0;
  for (let i = 0; i < 3; i++) {
    const inv = 1 / (Math.abs(ld[i]) < 1e-12 ? 1e-12 : ld[i]);
    let t1 = (-p.h[i] - lo[i]) * inv;
    let t2 = (p.h[i] - lo[i]) * inv;
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tmin) {
      tmin = t1;
      axis = i;
    }
    tmax = Math.min(tmax, t2);
  }
  if (tmax < tmin || tmax < 0) return null;
  const n = [0, 0, 0];
  n[axis] = ld[axis] > 0 ? -1 : 1;
  return { t: tmin, n: mv(p.M, n) };
}

/** Cylindre vertical (axe z) de base c, rayon r, hauteur h. */
function hitCyl(p, o, d) {
  let best = null;
  const ox = o[0] - p.c[0], oy = o[1] - p.c[1];
  const a = d[0] * d[0] + d[1] * d[1];
  if (a > 1e-12) {
    const b = ox * d[0] + oy * d[1];
    const c = ox * ox + oy * oy - p.r * p.r;
    const disc = b * b - a * c;
    if (disc >= 0) {
      const t = (-b - Math.sqrt(disc)) / a;
      const z = o[2] + d[2] * t - p.c[2];
      if (z >= 0 && z <= p.h) best = { t, n: v.norm([ox + d[0] * t, oy + d[1] * t, 0]) };
    }
  }
  if (Math.abs(d[2]) > 1e-12) {
    const t = (p.c[2] + p.h - o[2]) / d[2];
    const x = ox + d[0] * t, y = oy + d[1] * t;
    if (x * x + y * y <= p.r * p.r && (!best || t < best.t)) best = { t, n: [0, 0, 1] };
  }
  return best;
}

const HIT = { ell: hitEll, cap: hitCap, box: hitBox, cyl: hitCyl };

export function camera(yawDeg, pitchDeg) {
  const y = (yawDeg * Math.PI) / 180;
  const p = (pitchDeg * Math.PI) / 180;
  const R = rotZ(y);
  return {
    d: mv(R, [0, Math.cos(p), -Math.sin(p)]),
    r: mv(R, [1, 0, 0]),
    u: mv(R, [0, Math.sin(p), Math.cos(p)]),
  };
}

/** Projette un point monde en pixel (fractionnaire) dans un rendu donné. */
export function project(view, p) {
  const q = v.sub(p, view.target);
  return [view.ax + v.dot(q, view.cam.r) * view.ppu, view.ay - v.dot(q, view.cam.u) * view.ppu, v.dot(q, view.cam.d)];
}

/**
 * @param {object} o
 * @param {number} o.w @param {number} o.h  taille en pixels
 * @param {object} o.cam  issu de camera()
 * @param {number} o.ppu pixels par mètre
 * @param {number[]} o.anchor pixel où se projette o.target
 * @param {object} o.materials  { nom: { ramp:[rgb...], outline:rgb, emissive?, metal? } }
 * @param {object} o.style  { outline: 'black'|'selout'|'none', black: rgb, light: vec3, ambient }
 * @param {Function} [o.ground] (x,y,px,py) => { ramp, idx } pour le sol z=0
 */
export function render(o) {
  const { w, h, cam, ppu, materials, style, prims, decals = [], ground, blobs = [] } = o;
  const shadowPrims = o.shadowPrims ?? prims.filter((p) => p.shadow);
  const target = o.target ?? [0, 0, 0];
  const [ax, ay] = o.anchor;
  const L = v.norm(style.light);
  const N = w * h;
  const depth = new Float32Array(N).fill(Infinity);
  const objBuf = new Int32Array(N).fill(-1);
  const matBuf = new Array(N).fill(null);
  const idxBuf = new Int8Array(N).fill(-1);
  const colBuf = new Array(N).fill(null);

  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const P = v.add(v.add(target, v.mul(cam.r, (i + 0.5 - ax) / ppu)), v.mul(cam.u, (ay - (j + 0.5)) / ppu));
      const O = v.sub(P, v.mul(cam.d, 60));
      let best = null;
      let bp = null;
      for (const p of prims) {
        const hit = HIT[p.type](p, O, cam.d);
        if (hit && hit.t > 0 && (!best || hit.t < best.t)) {
          best = hit;
          bp = p;
        }
      }
      const k = j * w + i;
      if (ground && cam.d[2] < 0) {
        const tg = -O[2] / cam.d[2];
        if (!best || tg < best.t) {
          const G = v.add(O, v.mul(cam.d, tg));
          const shadowed = shadowPrims.length > 0 && castShadow(G, L, shadowPrims);
          const g = ground(G[0], G[1], i, j, shadowed);
          if (!g) continue;
          let idx = g.idx;
          if (shadowed && !g.shadowHandled) idx = Math.max(0, idx - 2);
          for (const b of blobs) {
            const dx = (G[0] - b.c[0]) / b.rx;
            const dy = (G[1] - b.c[1]) / b.ry;
            if (dx * dx + dy * dy < 1) idx = Math.max(0, idx - (b.strength ?? 2));
          }
          depth[k] = tg;
          objBuf[k] = 0;
          colBuf[k] = g.ramp[Math.max(0, Math.min(g.ramp.length - 1, idx))];
          continue;
        }
      }
      if (!best) continue;
      const m = materials[bp.mat];
      if (!m) throw new Error(`matériau inconnu : ${bp.mat}`);
      depth[k] = best.t;
      objBuf[k] = bp.obj;
      matBuf[k] = bp.mat;
      if (m.emissive) {
        // Les matériaux émissifs ignorent l'ombre mais gardent un modelé sur les tons clairs.
        const n = m.ramp.length;
        idxBuf[k] = Math.max(1, Math.min(n - 1, Math.floor((0.5 + 0.5 * Math.max(0, v.dot(best.n, L))) * n)));
        continue;
      }
      const lam = Math.max(0, v.dot(best.n, L));
      let s = style.ambient + (1 - style.ambient) * lam;
      if (m.metal) {
        const rr = v.sub(v.mul(best.n, 2 * v.dot(best.n, L)), L);
        if (v.dot(rr, v.mul(cam.d, -1)) > 0.93) s = 1.2;
      }
      const n = m.ramp.length;
      idxBuf[k] = Math.max(0, Math.min(n - 1, Math.floor(s * n * (m.contrast ?? 1))));
    }

  // Nettoyage des pixels orphelins (une bande d'ombrage isolée dans une zone uniforme).
  const idx2 = Int8Array.from(idxBuf);
  for (let j = 1; j < h - 1; j++)
    for (let i = 1; i < w - 1; i++) {
      const k = j * w + i;
      if (idxBuf[k] < 0) continue;
      const nb = [k - 1, k + 1, k - w, k + w].filter((q) => matBuf[q] === matBuf[k] && idxBuf[q] >= 0);
      if (nb.length === 4 && nb.every((q) => idxBuf[q] !== idxBuf[k])) {
        const counts = {};
        for (const q of nb) counts[idxBuf[q]] = (counts[idxBuf[q]] ?? 0) + 1;
        idx2[k] = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }
    }

  const img = createImage(w, h);
  for (let k = 0; k < N; k++) {
    if (colBuf[k]) setPx(img, k % w, (k / w) | 0, colBuf[k]);
    else if (matBuf[k]) setPx(img, k % w, (k / w) | 0, materials[matBuf[k]].ramp[idx2[k]]);
  }

  // Contours : un pixel d'objet devient contour si son voisin est vide, appartient à un objet
  // plus éloigné, ou à une partie nettement plus éloignée du même objet (contour intérieur).
  if (style.outline !== 'none') {
    const thrOther = 0.05;
    const thrSelf = style.innerThreshold ?? 0.22;
    const out = [];
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const k = j * w + i;
        if (!matBuf[k] || materials[matBuf[k]].emissive || materials[matBuf[k]].noOutline) continue;
        let edge = false;
        let inner = false;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ii = i + di;
          const jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= w || jj >= h) {
            edge = true;
            continue;
          }
          const q = jj * w + ii;
          if (objBuf[q] < 0 || objBuf[q] === 0) edge = true;
          else if (objBuf[q] !== objBuf[k] && depth[q] > depth[k] + thrOther) edge = true;
          else if (objBuf[q] === objBuf[k] && depth[q] > depth[k] + thrSelf) inner = true;
        }
        if (edge || inner) out.push([i, j, edge, matBuf[k], idx2[k]]);
      }
    for (const [i, j, edge, mat, idx] of out) {
      const m = materials[mat];
      if (edge) setPx(img, i, j, style.outline === 'black' ? style.black : m.outline);
      else setPx(img, i, j, m.ramp[0] === m.ramp[Math.max(0, idx)] ? m.outline : m.ramp[0]);
    }
  }

  const view = { cam, ppu, ax, ay, target };
  for (const dc of decals) {
    const [px, py, pd] = project(view, dc.p);
    const i = Math.floor(px);
    const j = Math.floor(py);
    if (i < 0 || j < 0 || i >= w || j >= h) continue;
    const k = j * w + i;
    // Les profondeurs du tampon sont mesurées depuis un plan situé 60 m en amont de la cible.
    const vis = dc.always || 60 + pd <= depth[k] + (dc.tolerance ?? 0.06);
    const color = typeof dc.color === 'string' ? materials[dc.color.split(':')[0]].ramp[+dc.color.split(':')[1]] : dc.color;
    if (vis && (dc.always || objBuf[k] > 0)) setPx(img, i, j, color);
  }

  return { img, depth, obj: objBuf, view };
}

function castShadow(G, L, prims) {
  const O = v.add(G, v.mul(L, 0.001));
  for (const p of prims) {
    const hit = HIT[p.type](p, O, L);
    if (hit && hit.t > 0.001) return true;
  }
  return false;
}
