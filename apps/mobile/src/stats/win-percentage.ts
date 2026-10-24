const PERCENT_MULTIPLIER = 100;

/** Share of played games that were won, rounded to a whole percent; 0 before the first game. */
export function winPercentage(stats: { readonly gamesPlayed: number; readonly gamesWon: number }): number {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * PERCENT_MULTIPLIER);
}
