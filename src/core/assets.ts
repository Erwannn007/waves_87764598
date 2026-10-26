// Types du manifeste d'assets généré par tools/art-lab/export.mjs (public/assets/gen/assets.json).
export interface AnimMeta {
  offset: number;
  count: number;
  frameMs: number;
  loop: boolean;
}
export interface SheetMeta {
  frameW: number;
  frameH: number;
  anchor: [number, number];
  framesPerDir: number;
  dirs: string[];
  anims: Record<string, AnimMeta>;
  muzzle: Record<string, [number, number]>;
  bob: Record<string, number[]>;
}
export interface PropCollider {
  type: 'box' | 'circle';
  hx?: number;
  hy?: number;
  r?: number;
}
export interface AssetManifest {
  iso: { tileM: number; tileW: number; tileH: number; yawDeg: number; pitchDeg: number; ppu: number };
  characters: Record<string, SheetMeta>;
  tiles: { tileW: number; tileH: number; types: Record<string, number[]> };
  props: { anchors: Record<string, [number, number]>; colliders: Record<string, PropCollider | null> };
}

/** Lecture d'une animation : renvoie l'index d'image dans la feuille pour une direction et un temps. */
export function frameAt(meta: SheetMeta, anim: string, dir: number, tMs: number, durationMs?: number): number {
  const a = meta.anims[anim];
  if (!a) throw new Error(`animation inconnue : ${anim}`);
  const per = durationMs ? durationMs / a.count : a.frameMs;
  let i = Math.floor(tMs / per);
  i = a.loop ? i % a.count : Math.min(a.count - 1, i);
  return dir * meta.framesPerDir + a.offset + i;
}
