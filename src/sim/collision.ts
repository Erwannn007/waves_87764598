// Collisions logiques au sol (cercles et rectangles alignés sur les axes du monde), en mètres.
// Indépendantes des sprites : la forme visible d'un objet n'intervient jamais.

export type Collider =
  | { kind: 'circle'; x: number; y: number; r: number; tag?: string }
  | { kind: 'box'; x: number; y: number; hx: number; hy: number; tag?: string };

export interface Body {
  x: number;
  y: number;
  r: number;
}

/** Repousse un cercle hors d'un obstacle. Renvoie true s'il y avait contact. */
export function pushOut(b: Body, c: Collider): boolean {
  if (c.kind === 'circle') {
    const dx = b.x - c.x;
    const dy = b.y - c.y;
    const min = b.r + c.r;
    const d2 = dx * dx + dy * dy;
    if (d2 >= min * min) return false;
    const d = Math.sqrt(d2) || 1e-6;
    b.x = c.x + (dx / d) * min;
    b.y = c.y + (dy / d) * min;
    return true;
  }
  const px = Math.max(c.x - c.hx, Math.min(b.x, c.x + c.hx));
  const py = Math.max(c.y - c.hy, Math.min(b.y, c.y + c.hy));
  const dx = b.x - px;
  const dy = b.y - py;
  const d2 = dx * dx + dy * dy;
  if (d2 >= b.r * b.r) return false;
  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    b.x = px + (dx / d) * b.r;
    b.y = py + (dy / d) * b.r;
  } else {
    // Centre à l'intérieur du rectangle : sortie par le côté le plus proche.
    const left = b.x - (c.x - c.hx), right = c.x + c.hx - b.x, down = b.y - (c.y - c.hy), up = c.y + c.hy - b.y;
    const m = Math.min(left, right, down, up);
    if (m === left) b.x = c.x - c.hx - b.r;
    else if (m === right) b.x = c.x + c.hx + b.r;
    else if (m === down) b.y = c.y - c.hy - b.r;
    else b.y = c.y + c.hy + b.r;
  }
  return true;
}

/** Résout les contacts d'un cercle avec une liste d'obstacles (quelques passes pour les coins). */
export function resolve(b: Body, colliders: readonly Collider[], passes = 3): boolean {
  let hit = false;
  for (let p = 0; p < passes; p++) {
    let any = false;
    for (const c of colliders) if (pushOut(b, c)) any = true;
    hit ||= any;
    if (!any) break;
  }
  return hit;
}

/** Sépare deux corps qui se chevauchent (moitié chacun, pondéré par `wa`). */
export function separate(a: Body, b: Body, wa = 0.5): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const min = a.r + b.r;
  const d2 = dx * dx + dy * dy;
  if (d2 >= min * min || d2 < 1e-12) return;
  const d = Math.sqrt(d2);
  const push = min - d;
  a.x -= (dx / d) * push * wa;
  a.y -= (dy / d) * push * wa;
  b.x += (dx / d) * push * (1 - wa);
  b.y += (dy / d) * push * (1 - wa);
}

/** Intersection segment [p0, p1] / cercle : fraction t ∈ [0, 1] du premier contact, ou null. */
export function segmentCircle(x0: number, y0: number, x1: number, y1: number, cx: number, cy: number, r: number): number | null {
  const dx = x1 - x0, dy = y1 - y0;
  const fx = x0 - cx, fy = y0 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0;
  if (a < 1e-12) return null;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

/** Intersection segment / rectangle aligné (méthode des dalles) : fraction t ∈ [0, 1], ou null. */
export function segmentBox(x0: number, y0: number, x1: number, y1: number, bx: number, by: number, hx: number, hy: number): number | null {
  let tmin = 0, tmax = 1;
  const d = [x1 - x0, y1 - y0], o = [x0, y0], lo = [bx - hx, by - hy], hi = [bx + hx, by + hy];
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      if (o[i] < lo[i] || o[i] > hi[i]) return null;
    } else {
      let t1 = (lo[i] - o[i]) / d[i], t2 = (hi[i] - o[i]) / d[i];
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

export function segmentCollider(x0: number, y0: number, x1: number, y1: number, c: Collider): number | null {
  return c.kind === 'circle' ? segmentCircle(x0, y0, x1, y1, c.x, c.y, c.r) : segmentBox(x0, y0, x1, y1, c.x, c.y, c.hx, c.hy);
}

/** Copie d'un obstacle agrandie d'une marge (test de passage pour un corps de rayon `m`). */
export function inflate(c: Collider, m: number): Collider {
  return c.kind === 'circle' ? { ...c, r: c.r + m } : { ...c, hx: c.hx + m, hy: c.hy + m };
}

export function pointInCollider(x: number, y: number, c: Collider, margin = 0): boolean {
  if (c.kind === 'circle') return (x - c.x) ** 2 + (y - c.y) ** 2 <= (c.r + margin) ** 2;
  return Math.abs(x - c.x) <= c.hx + margin && Math.abs(y - c.y) <= c.hy + margin;
}
