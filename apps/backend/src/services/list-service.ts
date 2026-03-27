import type { WordList, WordListResponse, WordListsResponse, RandomWordResponse, DailyWordResponse, ValidateWordResponse } from '@harfhane/shared';
import type { Env } from '../types/env';
import { NOT_FOUND } from '../errors/api-error';
import { normalizeWord } from '../utils/normalize';
import {
  findListBySlug,
  findAllPublicLists,
  findRandomWordFromList,
  countActiveWordsInList,
  findWordFromListAtOffset,
  wordExistsInList,
} from '../repositories/list-repository';

const EPOCH = new Date('2026-01-01T00:00:00Z');

function toWordList(row: {
  id: number; slug: string; name: string; description: string | null;
  word_length: number; is_public: number; has_daily: number; owner_user_id?: number | null;
  created_at: string; word_count?: number; like_count?: number; comment_count?: number;
}): WordList {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    wordLength: row.word_length,
    isPublic: row.is_public === 1,
    hasDaily: row.has_daily === 1,
    ownerUserId: row.owner_user_id ?? null,
    createdAt: row.created_at,
    wordCount: row.word_count ?? 0,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
  };
}

export async function getList(db: Env['DB'], slug: string): Promise<WordListResponse> {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  return { list: toWordList(row) };
}

export async function getPublicLists(db: Env['DB']): Promise<WordListsResponse> {
  const rows = await findAllPublicLists(db);
  return { lists: rows.map(toWordList) };
}

export async function getRandomWordFromList(
  db: Env['DB'],
  slug: string
): Promise<RandomWordResponse> {
  const listRow = await findListBySlug(db, slug);
  if (!listRow) throw NOT_FOUND('Word list');

  const word = await findRandomWordFromList(db, listRow.id);
  if (!word) throw NOT_FOUND('Word in list');

  return {
    word: {
      word: word.word,
      meaning: word.meaning || null,
      context: word.context,
      category: word.category as 'isim' | 'sıfat' | 'fiil',
    },
    wordId: word.id ?? 0,
  };
}

export async function getDailyWordFromList(
  db: Env['DB'],
  slug: string,
  date: string
): Promise<DailyWordResponse> {
  const listRow = await findListBySlug(db, slug);
  if (!listRow) throw NOT_FOUND('Word list');

  const wordCount = await countActiveWordsInList(db, listRow.id);
  if (wordCount === 0) throw NOT_FOUND('Word in list');

  const dateMs = new Date(date + 'T00:00:00Z').getTime();
  const dayOffset = Math.floor((dateMs - EPOCH.getTime()) / 86400000);
  const offset = ((dayOffset % wordCount) + wordCount) % wordCount;

  const word = await findWordFromListAtOffset(db, listRow.id, offset);
  if (!word) throw NOT_FOUND('Word in list');

  return {
    word: {
      word: word.word,
      meaning: word.meaning || null,
      context: word.context,
      category: word.category as 'isim' | 'sıfat' | 'fiil',
    },
    gameNumber: dayOffset + 1,
    date,
  };
}

export async function validateWordInList(
  db: Env['DB'],
  slug: string,
  word: string
): Promise<ValidateWordResponse> {
  const listRow = await findListBySlug(db, slug);
  if (!listRow) throw NOT_FOUND('Word list');

  const normalized = normalizeWord(word);
  const isValid = await wordExistsInList(db, listRow.id, normalized);
  return { isValid };
}
