import type { TimeCountdown } from './types';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const GAME_START_DATE = '2026-01-01';

export const getTimeUntilMidnight = (): TimeCountdown => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();

  const hours = Math.floor(diff / MS_PER_HOUR);
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND);

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
};

export const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]!;
};

export const getGameNumber = (): number => {
  const startDate = new Date(GAME_START_DATE);
  const today = new Date();
  return Math.floor((today.getTime() - startDate.getTime()) / (MS_PER_HOUR * 24)) + 1;
};
