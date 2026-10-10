import type { TimeCountdown } from './types';
import { parseTurkeyDate, type TurkeyDate } from '../types/turkey-date';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const TURKEY_UTC_OFFSET_MS = MS_PER_HOUR * 3;
const GAME_START_DATE = '2026-01-01';
const GAME_START_MS = Date.parse(`${GAME_START_DATE}T00:00:00Z`) - TURKEY_UTC_OFFSET_MS;

export const getTimeUntilMidnight = (now: Date = new Date()): TimeCountdown => {
  const turkeyNowMs = now.getTime() + TURKEY_UTC_OFFSET_MS;
  const msIntoTurkeyDay = ((turkeyNowMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
  const diff = MS_PER_DAY - msIntoTurkeyDay;

  const hours = Math.floor(diff / MS_PER_HOUR);
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND);

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
};

export const getTodayString = (now: Date = new Date()): TurkeyDate => {
  const turkeyNow = new Date(now.getTime() + TURKEY_UTC_OFFSET_MS);
  const dateString = turkeyNow.toISOString().split('T')[0]!;
  const turkeyDate = parseTurkeyDate(dateString);
  if (turkeyDate === null) {
    // Unreachable: toISOString() always produces a real calendar date.
    throw new Error(`getTodayString computed an invalid Turkey date: ${dateString}`);
  }
  return turkeyDate;
};

export const getGameNumber = (now: Date = new Date()): number => {
  return Math.floor((now.getTime() - GAME_START_MS) / MS_PER_DAY) + 1;
};
