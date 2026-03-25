import type { Env } from '../types/env';
import type { Badge, XPProfile } from '@nurdle/shared';

export interface UserXPRow {
  user_id: number;
  total_xp: number;
  level: number;
}

interface BadgeRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
}

const LEVEL_THRESHOLDS = [0, 250, 750, 1500, 3000, 5000] as const;

export function levelFromXP(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]!) return i + 1;
  }
  return 1;
}

export function nextLevelXP(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? Infinity;
}

export async function getUserXP(db: Env['DB'], userId: number): Promise<UserXPRow | null> {
  return db
    .prepare(`SELECT user_id, total_xp, level FROM user_xp WHERE user_id = ?`)
    .bind(userId)
    .first<UserXPRow>();
}

export async function upsertUserXP(
  db: Env['DB'],
  userId: number,
  totalXP: number,
  level: number
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO user_xp (user_id, total_xp, level, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         total_xp   = excluded.total_xp,
         level      = excluded.level,
         updated_at = excluded.updated_at`
    )
    .bind(userId, totalXP, level)
    .run();
}

export async function getEarnedBadgeSlugs(db: Env['DB'], userId: number): Promise<string[]> {
  const { results } = await db
    .prepare(
      `SELECT b.slug FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ?`
    )
    .bind(userId)
    .all<{ slug: string }>();
  return results.map(r => r.slug);
}

export async function awardBadgeBySlug(
  db: Env['DB'],
  userId: number,
  slug: string
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO user_badges (user_id, badge_id)
       SELECT ?, id FROM badges WHERE slug = ?`
    )
    .bind(userId, slug)
    .run();
}

export async function getBadgesBySlugs(
  db: Env['DB'],
  slugs: string[]
): Promise<Badge[]> {
  if (slugs.length === 0) return [];
  const placeholders = slugs.map(() => '?').join(', ');
  const { results } = await db
    .prepare(`SELECT slug, name, description, icon FROM badges WHERE slug IN (${placeholders})`)
    .bind(...slugs)
    .all<BadgeRow>();
  return results.map(r => ({ slug: r.slug, name: r.name, description: r.description, icon: r.icon }));
}

export async function getConsecutiveWins(db: Env['DB'], userId: number): Promise<number> {
  const { results } = await db
    .prepare(
      `SELECT won FROM game_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    )
    .bind(userId)
    .all<{ won: number }>();

  let consecutive = 0;
  for (const row of results) {
    if (row.won === 1) consecutive++;
    else break;
  }
  return consecutive;
}

export async function getUserXPProfile(db: Env['DB'], userId: number): Promise<XPProfile> {
  const xp = await getUserXP(db, userId);
  const totalXP = xp?.total_xp ?? 0;
  const level = xp?.level ?? 1;

  const { results } = await db
    .prepare(
      `SELECT b.slug, b.name, b.description, b.icon, ub.user_id IS NOT NULL as earned
       FROM badges b
       LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?`
    )
    .bind(userId)
    .all<BadgeRow & { earned: number }>();

  const badges: Badge[] = results
    .filter(r => r.earned)
    .map(r => ({ slug: r.slug, name: r.name, description: r.description, icon: r.icon }));

  return { totalXP, level, nextLevelXP: nextLevelXP(level), badges };
}
