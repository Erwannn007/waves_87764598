// Champ de navigation : distance (BFS) depuis la cible sur une grille, pour que les ennemis
// contournent les obstacles. Recalculé quand la cible change de case.
import { pointInCollider, type Collider } from './collision';

export class FlowField {
  readonly cols: number;
  readonly rows: number;
  readonly blocked: Uint8Array;
  readonly dist: Int32Array;
  private queue: Int32Array;
  targetCell = -1;

  constructor(readonly width: number, readonly height: number, readonly cell: number) {
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell);
    this.blocked = new Uint8Array(this.cols * this.rows);
    this.dist = new Int32Array(this.cols * this.rows).fill(-1);
    this.queue = new Int32Array(this.cols * this.rows);
  }

  /** Marque les cases occupées par les obstacles (avec une marge = rayon de l'agent). */
  rasterize(colliders: readonly Collider[], margin: number): void {
    this.blocked.fill(0);
    for (let j = 0; j < this.rows; j++)
      for (let i = 0; i < this.cols; i++) {
        const x = (i + 0.5) * this.cell, y = (j + 0.5) * this.cell;
        for (const c of colliders) if (pointInCollider(x, y, c, margin)) { this.blocked[j * this.cols + i] = 1; break; }
      }
  }

  cellOf(x: number, y: number): number {
    const i = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cell)));
    const j = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cell)));
    return j * this.cols + i;
  }

  compute(tx: number, ty: number): void {
    const start = this.cellOf(tx, ty);
    if (start === this.targetCell) return;
    this.targetCell = start;
    this.dist.fill(-1);
    let head = 0, tail = 0;
    this.dist[start] = 0;
    this.queue[tail++] = start;
    const { cols, rows } = this;
    while (head < tail) {
      const k = this.queue[head++];
      const i = k % cols, j = (k / cols) | 0;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = i + di, nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
          const n = nj * cols + ni;
          if (this.blocked[n] || this.dist[n] >= 0) continue;
          // Pas de coupe de coin entre deux cases bloquées.
          if (di && dj && (this.blocked[j * cols + ni] || this.blocked[nj * cols + i])) continue;
          this.dist[n] = this.dist[k] + 1;
          this.queue[tail++] = n;
        }
    }
  }

  /** Direction normalisée vers la case voisine la plus proche de la cible ; null si inaccessible. */
  direction(x: number, y: number): { x: number; y: number } | null {
    const k = this.cellOf(x, y);
    const { cols, rows } = this;
    const i = k % cols, j = (k / cols) | 0;
    let best = this.dist[k] >= 0 ? this.dist[k] : Infinity;
    let bx = 0, by = 0;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        const ni = i + di, nj = j + dj;
        if ((!di && !dj) || ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
        const d = this.dist[nj * cols + ni];
        if (d >= 0 && d < best) { best = d; bx = di; by = dj; }
      }
    if (best === Infinity || (!bx && !by)) return null;
    const tx = (i + bx + 0.5) * this.cell - x, ty = (j + by + 0.5) * this.cell - y;
    const l = Math.hypot(tx, ty) || 1;
    return { x: tx / l, y: ty / l };
  }
}
