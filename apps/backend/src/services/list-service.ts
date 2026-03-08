import type { WordList, WordListResponse, WordListsResponse, RandomWordResponse } from '@nurdle/shared';
import type { Env } from '../types/env';
import { NOT_FOUND } from '../errors/api-error';
import {
  findListBySlug,
  findAllPublicLists,
  findRandomWordFromList,
} from '../repositories/list-repository';

function toWordList(row: {
  id: number; slug: string; name: string; description: string | null;
  word_length: number; is_public: number; created_at: string; word_count?: number;
}): WordList {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    wordLength: row.word_length,
    isPublic: row.is_public === 1,
    createdAt: row.created_at,
    wordCount: row.word_count ?? 0,
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
      meaning: word.meaning,
      context: word.context,
      category: word.category as 'isim' | 'sıfat' | 'fiil',
    },
  };
}
