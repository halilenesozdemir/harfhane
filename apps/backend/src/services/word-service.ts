import type { DailyWordResponse, RandomWordResponse, ValidateWordResponse } from '@nurdle/shared';
import type { Env } from '../types/env';
import { NOT_FOUND, INVALID_DATE } from '../errors/api-error';
import {
  findDailyWord,
  findRandomWord,
  findWordById,
  wordExists,
} from '../repositories/word-repository';

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

function todayTR(): string {
  // Türkiye saati UTC+3 — günlük kelime gece yarısı (TR) değişsin
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + 3);
  return now.toISOString().slice(0, 10);
}

export async function getDailyWord(
  db: Env['DB'],
  date?: string,
  length = 5
): Promise<DailyWordResponse> {
  const targetDate = date ?? todayTR();

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

export async function validateWord(
  db: Env['DB'],
  word: string
): Promise<ValidateWordResponse> {
  const isValid = await wordExists(db, word);
  return { isValid };
}
