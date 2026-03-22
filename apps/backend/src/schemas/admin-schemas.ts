import { z } from 'zod';
import { normalizeWord } from '../utils/normalize';

const categorySchema = z.enum(['isim', 'sıfat', 'fiil']);

export const createWordSchema = z.object({
  word: z.string().min(1).max(10).transform(normalizeWord),
  meaning: z.string().min(1).max(500),
  context: z.string().max(500).default(''),
  category: categorySchema,
});

export const updateWordSchema = z.object({
  word: z.string().min(1).max(10).transform(normalizeWord).optional(),
  meaning: z.string().min(1).max(500).optional(),
  context: z.string().max(500).optional(),
  category: categorySchema.optional(),
});

export const toggleWordSchema = z.object({
  is_active: z.boolean(),
});

export const scheduleDailyWordSchema = z.object({
  word_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const importWordsSchema = z.object({
  words: z
    .array(
      z.object({
        word: z.string().min(1).max(10).transform(normalizeWord),
        meaning: z.string().min(1).max(500),
        context: z.string().max(500).default(''),
        category: categorySchema,
      })
    )
    .min(1)
    .max(500),
});

export const listWordsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  category: categorySchema.optional(),
  active: z.enum(['0', '1']).optional(),
  length: z.coerce.number().int().min(4).max(6).optional(),
  sort: z.enum(['az', 'id_desc']).optional(),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  is_public: z.boolean().optional(),
});

export const createListSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  word_length: z.number().int().min(4).max(6).default(5),
  is_public: z.boolean().default(false),
});

export const listWordActionSchema = z.object({
  word_id: z.number().int().positive(),
});

export const listDailyQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
