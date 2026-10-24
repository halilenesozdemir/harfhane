import { describe, expect, it } from 'vitest';
import { winPercentage } from './win-percentage';

describe('winPercentage', () => {
  it('should return 0 when no game has been played', () => {
    expect(winPercentage({ gamesPlayed: 0, gamesWon: 0 })).toBe(0);
  });

  it('should round the won share to a whole percent when games were played', () => {
    expect(winPercentage({ gamesPlayed: 7, gamesWon: 6 })).toBe(86);
  });
});
