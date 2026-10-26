// Paramètres persistés localement (seule donnée sauvegardée dans le prototype).
// Version de schéma, validation au chargement, données corrompues conservées à part (jamais écrasées).
import { z } from 'zod';

export const SETTINGS_KEY = 'waves.settings';
export const SETTINGS_VERSION = 1;

export const SettingsSchema = z.object({
  version: z.literal(SETTINGS_VERSION),
  autoFire: z.boolean().default(false),
  /** Hauteur visée de la résolution interne : plus petite = personnages plus grands à l'écran. */
  viewHeight: z.union([z.literal(220), z.literal(250), z.literal(280), z.literal(320)]).default(280),
  showFps: z.boolean().default(false),
  vibration: z.boolean().default(true),
  volume: z.number().min(0).max(1).default(0.7),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({ version: SETTINGS_VERSION });

export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export type LoadStatus = 'ok' | 'absent' | 'corrupt' | 'unavailable';

export function loadSettings(store: KeyValueStore | null): { settings: Settings; status: LoadStatus } {
  if (!store) return { settings: { ...DEFAULT_SETTINGS }, status: 'unavailable' };
  let raw: string | null;
  try {
    raw = store.getItem(SETTINGS_KEY);
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, status: 'unavailable' };
  }
  if (raw === null) return { settings: { ...DEFAULT_SETTINGS }, status: 'absent' };
  try {
    const parsed = SettingsSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return { settings: parsed.data, status: 'ok' };
  } catch {
    /* JSON illisible : traité comme corrompu ci-dessous */
  }
  try {
    store.setItem(`${SETTINGS_KEY}.corrupt.${Date.now()}`, raw);
  } catch {
    /* stockage plein ou bloqué : la copie de secours est impossible, on ne touche pas à l'original */
  }
  return { settings: { ...DEFAULT_SETTINGS }, status: 'corrupt' };
}

export function saveSettings(store: KeyValueStore | null, s: Settings): boolean {
  if (!store) return false;
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(SettingsSchema.parse(s)));
    return true;
  } catch {
    return false;
  }
}

function browserStore(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const loaded = loadSettings(browserStore());
export const settings: Settings = loaded.settings;
export const settingsStatus = loaded.status;
const listeners = new Set<(s: Settings) => void>();

export function updateSettings(patch: Partial<Settings>): void {
  Object.assign(settings, patch);
  saveSettings(browserStore(), settings);
  for (const l of listeners) l(settings);
}
export function onSettingsChange(fn: (s: Settings) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
