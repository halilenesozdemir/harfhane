import type { DailyWordResponse, RandomWordResponse, ValidateWordResponse } from '@nurdle/shared';
import type { Env } from '../types/env';
import { NOT_FOUND, INVALID_DATE } from '../errors/api-error';
import {
  findDailyWord,
  findRandomWord,
  wordExists,
} from '../repositories/word-repository';

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyWord(
  db: Env['DB'],
  date?: string
): Promise<DailyWordResponse> {
  const targetDate = date ?? todayUTC();

  if (!isValidDate(targetDate)) throw INVALID_DATE();

  const result = await findDailyWord(db, targetDate);
  if (!result) throw NOT_FOUND('Daily word');

  const { gameNumber, ...word } = result;
  return { word, gameNumber, date: targetDate };
}

export async function getRandomWord(db: Env['DB']): Promise<RandomWordResponse> {
  const word = await findRandomWord(db);
  if (!word) throw NOT_FOUND('Word');
  return { word };
}

export async function validateWord(
  db: Env['DB'],
  word: string
): Promise<ValidateWordResponse> {
  const isValid = await wordExists(db, word);
  return { isValid };
}
