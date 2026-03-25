import type { Env } from '../types/env';
import type { GameXPResult } from '@nurdle/shared';
import {
  getUserXP,
  upsertUserXP,
  getEarnedBadgeSlugs,
  awardBadgeBySlug,
  getBadgesBySlugs,
  getConsecutiveWins,
  levelFromXP,
} from '../repositories/gamification-repository';
import { getUserStats } from '../repositories/result-repository';

const GUESS_BONUS = [100, 75, 50, 25, 10, 5] as const;
const BASE_XP_WIN = 50;
const BASE_XP_LOSE = 10;
const STREAK_BONUS_3 = 25;
const STREAK_BONUS_7 = 50;

function calculateXPBreakdown(won: boolean, guesses: number, streak: number): {
  total: number; base: number; guessBonus: number; streakBonus: number;
} {
  const base = won ? BASE_XP_WIN : BASE_XP_LOSE;
  const guessBonus = won && guesses >= 1 && guesses <= 6 ? (GUESS_BONUS[guesses - 1] ?? 0) : 0;
  const streakBonus = streak >= 7 ? STREAK_BONUS_7 : streak >= 3 ? STREAK_BONUS_3 : 0;
  return { total: base + guessBonus + streakBonus, base, guessBonus, streakBonus };
}

function checkEligibleBadges(params: {
  totalPlayed: number;
  currentStreak: number;
  won: boolean;
  guesses: number;
  level: number;
  consecutiveWins: number;
}): string[] {
  const slugs: string[] = [];
  if (params.totalPlayed >= 1) slugs.push('first-step');
  if (params.won && params.guesses === 1) slugs.push('sharpshooter');
  if (params.won && params.guesses <= 2) slugs.push('quick-mind');
  if (params.currentStreak >= 3) slugs.push('streak-3');
  if (params.currentStreak >= 7) slugs.push('on-fire');
  if (params.currentStreak >= 14) slugs.push('streak-14');
  if (params.currentStreak >= 30) slugs.push('streak-30');
  if (params.totalPlayed >= 50) slugs.push('word-master');
  if (params.consecutiveWins >= 10) slugs.push('perfect-run');
  if (params.totalPlayed >= 100) slugs.push('lexicon');
  if (params.level >= 5) slugs.push('legend');
  return slugs;
}

export async function processGameXP(
  db: Env['DB'],
  userId: number,
  won: boolean,
  guesses: number
): Promise<GameXPResult> {
  const [currentXP, stats, consecutiveWins] = await Promise.all([
    getUserXP(db, userId),
    getUserStats(db, userId),
    getConsecutiveWins(db, userId),
  ]);

  const prevTotalXP = currentXP?.total_xp ?? 0;
  const prevLevel = currentXP?.level ?? 1;
  const xpBreakdown = calculateXPBreakdown(won, guesses, stats.currentStreak);
  const earned = xpBreakdown.total;
  const newTotalXP = prevTotalXP + earned;
  const newLevel = levelFromXP(newTotalXP);
  const levelUp = newLevel > prevLevel;

  await upsertUserXP(db, userId, newTotalXP, newLevel);

  const eligible = checkEligibleBadges({
    totalPlayed: stats.totalPlayed,
    currentStreak: stats.currentStreak,
    won,
    guesses,
    level: newLevel,
    consecutiveWins,
  });

  const alreadyEarned = new Set(await getEarnedBadgeSlugs(db, userId));
  const newSlugs = eligible.filter(s => !alreadyEarned.has(s));

  for (const slug of newSlugs) {
    await awardBadgeBySlug(db, userId, slug);
  }

  const newBadges = await getBadgesBySlugs(db, newSlugs);

  return {
    earned,
    total: newTotalXP,
    level: newLevel,
    levelUp,
    newBadges,
    breakdown: {
      base: xpBreakdown.base,
      guessBonus: xpBreakdown.guessBonus,
      streakBonus: xpBreakdown.streakBonus,
    },
  };
}
