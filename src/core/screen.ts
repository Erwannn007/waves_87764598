// Mise à l'échelle pixel-parfaite : la hauteur interne visée est fixe (paramètre « taille »),
// la largeur s'adapte au format de l'écran, et un pixel interne = un nombre ENTIER de pixels physiques.
import { settings } from './settings';

export interface Layout {
  width: number;
  height: number;
  /** Zoom CSS appliqué au canvas (pixels physiques par pixel interne / devicePixelRatio). */
  zoom: number;
  /** Pixels physiques par pixel interne (entier). */
  devicePxPerPx: number;
  /** Zones de sécurité (encoche, barre d'accueil) converties en pixels internes. */
  safe: { top: number; right: number; bottom: number; left: number };
}

function safeAreaCss(): Layout['safe'] {
  const el = document.getElementById('safe');
  if (!el) return { top: 0, right: 0, bottom: 0, left: 0 };
  const cs = getComputedStyle(el);
  return { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
}

export function computeLayout(): Layout {
  const dpr = window.devicePixelRatio || 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const devH = vh * dpr;
  const k = Math.max(1, Math.round(devH / settings.viewHeight));
  const width = Math.ceil((vw * dpr) / k);
  const height = Math.ceil(devH / k);
  const zoom = k / dpr;
  const s = safeAreaCss();
  const toPx = (css: number) => Math.ceil(css / zoom);
  return { width, height, zoom, devicePxPerPx: k, safe: { top: toPx(s.top), right: toPx(s.right), bottom: toPx(s.bottom), left: toPx(s.left) } };
}

export let layout: Layout = { width: 480, height: 270, zoom: 1, devicePxPerPx: 1, safe: { top: 0, right: 0, bottom: 0, left: 0 } };
export function setLayout(l: Layout): void {
  layout = l;
}

export const isIOS = (): boolean => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = (): boolean => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
export const isTouchDevice = (): boolean => matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
