import type { TileStatus } from './types';

// Owner decision 2026-10-24 (docs/decisions/2026-10-24-share-format-circles.md): a positional
// circle grid — one 🟢/🟡/⚪ per guessed tile, mirroring the game board itself — replacing the
// aggregate progress-bar format (▰/▱ + "✦N") merged the same day, which told the reader nothing
// about *which* letters were right. The emoji grid is a narrow, explicit exception to the
// no-emoji rule in root CLAUDE.md: see that ADR for the trade-dress reasoning.
const CORRECT_CIRCLE = '🟢';
const PRESENT_CIRCLE = '🟡';
const ABSENT_CIRCLE = '⚪';
const MAX_GUESSES = 6;
const DEFAULT_SHARE_URL = 'harfhane.app';
const LOST_LABEL = 'Bulamadım';
const HINT_USED_SUFFIX = ' · İpucuyla';
const UNLIMITED_HEADER_LABEL = 'Sınırsız';

const TURKISH_MONTH_NAMES: readonly string[] = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/** A Turkey-day date string (`YYYY-MM-DD`, see `getTodayString`). */
export type ShareMode = { readonly type: 'daily'; readonly date: string } | { readonly type: 'unlimited' };

export interface ShareTextOptions {
  shareUrl?: string | undefined;
  hintUsed?: boolean | undefined;
  // Daily streak (DailyStats.currentStreak); shown only when > 0 and mode is daily.
  streak?: number | undefined;
}

function formatDailyHeaderDate(turkeyDate: string): string {
  const [, monthStr, dayStr] = turkeyDate.split('-');
  const monthName = TURKISH_MONTH_NAMES[Number(monthStr) - 1] ?? '';
  const day = Number(dayStr);
  return `${day} ${monthName}`;
}

function buildHeaderLine(mode: ShareMode, wordLength: number): string {
  const modeLabel = mode.type === 'daily' ? formatDailyHeaderDate(mode.date) : UNLIMITED_HEADER_LABEL;
  return `Harfhane · ${modeLabel} · ${wordLength} harf`;
}

function buildResultLine(isWon: boolean, guessCount: number): string {
  return isWon ? `${guessCount}/${MAX_GUESSES}` : `${LOST_LABEL} · ${MAX_GUESSES}/${MAX_GUESSES}`;
}

interface ResolvedShareOptions {
  readonly shareUrl: string;
  readonly hintUsed: boolean;
  readonly streak: number;
}

function buildSecondLine(mode: ShareMode, isWon: boolean, guessCount: number, options: ResolvedShareOptions): string {
  const resultLine = buildResultLine(isWon, guessCount);
  const showsStreak = mode.type === 'daily' && options.streak > 0;
  const streakSuffix = showsStreak ? ` · Seri ${options.streak}` : '';
  const hintSuffix = options.hintUsed ? HINT_USED_SUFFIX : '';
  return `${resultLine}${streakSuffix}${hintSuffix}`;
}

// Absent and null (unrevealed) both render as the empty circle: neither tells the reader the
// letter was right, so they are indistinguishable in the share text.
function mapStatusToCircle(status: TileStatus): string {
  if (status === 'correct') return CORRECT_CIRCLE;
  if (status === 'present') return PRESENT_CIRCLE;
  return ABSENT_CIRCLE;
}

function buildGridLine(row: TileStatus[]): string {
  return row.map(mapStatusToCircle).join('');
}

/**
 * Builds Harfhane's own share text (owner decision 2026-10-24,
 * `docs/decisions/2026-10-24-share-format-circles.md`): a positional circle grid, one row per
 * guess, mapping each tile to 🟢 (correct position), 🟡 (present elsewhere) or ⚪ (absent) —
 * never the letters themselves.
 */
export const generateShareText = (
  guesses: string[],
  evaluations: TileStatus[][],
  wordLength: number,
  mode: ShareMode,
  isWon: boolean,
  options: ShareTextOptions = {}
): string => {
  const resolvedOptions: ResolvedShareOptions = {
    shareUrl: options.shareUrl ?? DEFAULT_SHARE_URL,
    hintUsed: options.hintUsed ?? false,
    streak: options.streak ?? 0,
  };

  const lines = [
    buildHeaderLine(mode, wordLength),
    buildSecondLine(mode, isWon, guesses.length, resolvedOptions),
    '',
    ...evaluations.map(buildGridLine),
    '',
    resolvedOptions.shareUrl,
  ];

  return lines.join('\n');
};
