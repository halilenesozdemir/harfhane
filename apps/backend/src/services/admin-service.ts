import type { Env } from '../types/env';
import { NOT_FOUND } from '../errors/api-error';
import {
  adminFindWords,
  adminFindWordById,
  adminCreateWord,
  adminUpdateWord,
  adminSetWordActive,
  adminFindDailySchedule,
  adminScheduleDailyWord,
  adminRemoveDailyWord,
  adminBulkInsertWords,
  adminGetStats,
  adminAutoFillSchedule,
  type ListWordsOptions,
} from '../repositories/admin-repository';

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function listWords(db: Env['DB'], opts: ListWordsOptions) {
  return adminFindWords(db, opts);
}

export async function getWord(db: Env['DB'], id: number) {
  const word = await adminFindWordById(db, id);
  if (!word) throw NOT_FOUND('Word');
  return word;
}

export async function createWord(
  db: Env['DB'],
  data: { word: string; meaning: string; context: string; category: string }
) {
  const id = await adminCreateWord(db, data);
  const word = await adminFindWordById(db, id);
  if (!word) throw NOT_FOUND('Word');
  return word;
}

export async function updateWord(
  db: Env['DB'],
  id: number,
  data: { word?: string; meaning?: string; context?: string; category?: string }
) {
  const exists = await adminFindWordById(db, id);
  if (!exists) throw NOT_FOUND('Word');
  await adminUpdateWord(db, id, data);
  const updated = await adminFindWordById(db, id);
  if (!updated) throw NOT_FOUND('Word');
  return updated;
}

export async function toggleWordActive(db: Env['DB'], id: number, isActive: boolean) {
  const exists = await adminFindWordById(db, id);
  if (!exists) throw NOT_FOUND('Word');
  await adminSetWordActive(db, id, isActive);
  const updated = await adminFindWordById(db, id);
  if (!updated) throw NOT_FOUND('Word');
  return updated;
}

export async function getDailySchedule(db: Env['DB'], from?: string, to?: string) {
  const f = from ?? todayUTC();
  const t = to ?? offsetDate(30);
  return adminFindDailySchedule(db, f, t);
}

export async function scheduleDailyWord(db: Env['DB'], wordId: number, date: string) {
  const word = await adminFindWordById(db, wordId);
  if (!word) throw NOT_FOUND('Word');
  const length = word.word.length;
  const id = await adminScheduleDailyWord(db, wordId, date, length);
  return { id, word_id: wordId, date, word: word.word, length };
}

export async function removeDailyWord(db: Env['DB'], id: number) {
  const removed = await adminRemoveDailyWord(db, id);
  if (!removed) throw NOT_FOUND('Daily word entry');
}

export async function importWords(
  db: Env['DB'],
  words: { word: string; meaning: string; context: string; category: string }[]
) {
  return adminBulkInsertWords(db, words);
}

export async function getStats(db: Env['DB']) {
  return adminGetStats(db, todayUTC());
}

export async function autoFillDailySchedule(db: Env['DB'], days: number) {
  const from = offsetDate(1);
  const to = offsetDate(days);
  return adminAutoFillSchedule(db, from, to);
}
