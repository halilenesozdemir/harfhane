import { getTodayString } from '@harfhane/shared';
import type {
  DailyWordResponse,
  PlayableLengthsResponse,
  RandomWordResponse,
  ValidateWordResponse,
} from '@harfhane/shared';
import type { Env } from '../types/env';
import { NOT_FOUND, INVALID_DATE } from '../errors/api-error';
import { parsePlayableLengths } from '../utils/playable-lengths';
import {
  findDailyWord,
  findRandomWord,
  findWordById,
  wordExists,
} from '../repositories/word-repository';

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

export async function getDailyWord(
  db: Env['DB'],
  date?: string,
  length = 5
): Promise<DailyWordResponse> {
  const targetDate = date ?? getTodayString();

  if (!isValidDate(targetDate)) throw INVALID_DATE();

  const result = await findDailyWord(db, targetDate, length);
  if (!result) throw NOT_FOUND('Daily word');

  const { gameNumber, ...word } = result;
  return { word, gameNumber, date: targetDate };
}

export async function getRandomWord(db: Env['DB'], length = 5): Promise<RandomWordResponse> {
  const result = await findRandomWord(db, length);
  if (!result) throw NOT_FOUND('Word');
  return { word: result.entry, wordId: result.id };
}

export async function getWordById(
  db: Env['DB'],
  wordId: number
): Promise<{ word: RandomWordResponse['word']; wordId: number }> {
  const result = await findWordById(db, wordId);
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
