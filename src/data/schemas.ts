// Schémas des données de jeu. Toute donnée est validée au chargement ; une erreur est explicite.
import { z } from 'zod';

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

export const WeaponSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['assault', 'pistol', 'smg', 'shotgun', 'sniper', 'explosive', 'melee', 'special']),
  rarity: z.enum(RARITIES).default('common'),
  damage: z.number().positive(),
  fireRate: z.number().positive().describe('tirs par seconde'),
  automatic: z.boolean().default(true),
  magazine: z.number().int().positive(),
  reserve: z.number().int().nonnegative(),
  reloadTime: z.number().positive().describe('secondes'),
  spreadDeg: z.number().nonnegative().default(0),
  range: z.number().positive().describe('mètres'),
  projectileSpeed: z.number().positive().describe('m/s'),
  pellets: z.number().int().positive().default(1),
  knockback: z.number().nonnegative().default(0).describe('mètres'),
  stagger: z.number().nonnegative().default(0),
  structureDamage: z.number().nonnegative().default(1).describe('multiplicateur contre les structures'),
  sfx: z.string().default('shot_ar'),
});
export type WeaponDef = z.infer<typeof WeaponSchema>;

export const EnemySchema = z.object({
  name: z.string().min(1),
  sprite: z.string().min(1),
  hp: z.number().positive(),
  radius: z.number().positive(),
  speed: z.number().positive(),
  chaseSpeed: z.number().positive(),
  aggroRange: z.number().positive(),
  attackRange: z.number().positive(),
  attackDamage: z.number().nonnegative(),
  attackWindup: z.number().nonnegative(),
  attackCooldown: z.number().nonnegative(),
  staggerThreshold: z.number().positive(),
  stunTime: z.number().nonnegative(),
  knockbackResist: z.number().min(0).max(1).default(0),
});
export type EnemyDef = z.infer<typeof EnemySchema>;

const Point = z.object({ x: z.number(), y: z.number() });

export const MapSchema = z
  .object({
    name: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    legend: z.record(z.string().length(1), z.string()),
    tiles: z.array(z.string()),
    props: z.array(z.object({ id: z.string(), x: z.number(), y: z.number(), hp: z.number().positive().optional() })),
    player: Point,
    spawns: z.array(Point).min(1),
  })
  .superRefine((m, ctx) => {
    if (m.tiles.length !== m.height) ctx.addIssue({ code: 'custom', message: `tiles : ${m.tiles.length} lignes, ${m.height} attendues` });
    m.tiles.forEach((row, j) => {
      if (row.length !== m.width) ctx.addIssue({ code: 'custom', message: `ligne ${j} : ${row.length} colonnes, ${m.width} attendues` });
      for (const ch of row) if (!(ch in m.legend)) ctx.addIssue({ code: 'custom', message: `ligne ${j} : caractère « ${ch} » absent de la légende` });
    });
  });
export type MapDef = z.infer<typeof MapSchema>;

export function parseRecord<T>(schema: z.ZodType<T>, data: unknown, label: string): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [id, raw] of Object.entries(data as Record<string, unknown>)) {
    const r = schema.safeParse(raw);
    if (!r.success) throw new Error(`Données invalides (${label} « ${id} ») : ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(' ; ')}`);
    out[id] = r.data;
  }
  return out;
}
