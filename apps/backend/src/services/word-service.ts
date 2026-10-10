import { DEFAULT_WORD_LENGTH, getTodayString } from '@harfhane/shared';
import type {
  DailyWordResponse,
  PlayableLengthsResponse,
  RandomWordResponse,
  TurkeyDate,
  ValidateWordResponse,
  WordLength,
} from '@harfhane/shared';
import type { Env } from '../types/env';
import { NOT_FOUND } from '../errors/api-error';
import { parsePlayableLengths } from '../utils/playable-lengths';
import {
  findDailyWord,
  findRandomWord,
  wordExists,
} from '../repositories/word-repository';

export async function getDailyWord(
  db: Env['DB'],
  date?: TurkeyDate,
  length: WordLength = DEFAULT_WORD_LENGTH
): Promise<DailyWordResponse> {
  const today = getTodayString();
  const targetDate = date ?? today;

  // Future answers stay hidden; the same error as a missing day reveals nothing about the schedule.
  if (targetDate > today) throw NOT_FOUND('Daily word');

  const result = await findDailyWord(db, targetDate, length);
  if (!result) throw NOT_FOUND('Daily word');

  const { gameNumber, ...word } = result;
  return { word, gameNumber, date: targetDate };
}

export async function getRandomWord(
  db: Env['DB'],
  length: WordLength = DEFAULT_WORD_LENGTH
): Promise<RandomWordResponse> {
  const result = await findRandomWord(db, length);
  if (!result) throw NOT_FOUND('Word');
  return { word: result.entry, wordId: result.id };
}

export function getPlayableLengths(playableWordLengths: string | undefined): PlayableLengthsResponse {
  return { lengths: parsePlayableLengths(playableWordLengths) };
}

export async function validateWord(
  db: Env['DB'],
  word: string
): Promise<ValidateWordResponse> {
  const isValid = await wordExists(db, word);
  return { isValid };
}
