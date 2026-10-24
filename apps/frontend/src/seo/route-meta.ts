import type { GameMode, WordLength } from '../types';

export type DailyOrUnlimited = Extract<GameMode, 'daily' | 'unlimited'>;

export interface RouteMeta {
  title: string;
  description: string;
  canonicalPath: string;
}

const MODE_LABELS: Record<DailyOrUnlimited, string> = {
  daily: 'Günlük',
  unlimited: 'Sınırsız',
};

const GAME_DESCRIPTIONS: Record<DailyOrUnlimited, (wordLength: WordLength) => string> = {
  daily: (wordLength) =>
    `Her gün yeni bir ${wordLength} harfli Türkçe kelimeyi 6 denemede bul. Ücretsiz günlük kelime bulmacası.`,
  unlimited: (wordLength) =>
    `Dilediğin kadar oyna! ${wordLength} harfli Türkçe kelime bulmacasında sınırsız pratik yap.`,
};

export const HOME_META: RouteMeta = {
  title: 'Harfhane — Türkçe Kelime Oyunu | Günlük Bulmaca',
  description:
    'Harfhane ile her gün yeni bir Türkçe kelime bul! Ücretsiz Türkçe kelime oyunu. Günlük bulmaca ve sınırsız mod.',
  canonicalPath: '/',
};

export const PRIVACY_META: RouteMeta = {
  title: 'Gizlilik Politikası | Harfhane',
  description: 'Harfhane gizlilik politikası: hangi veriler işlenir, ne kadar saklanır ve haklarınız.',
  canonicalPath: '/gizlilik',
};

// `requestedLength` is undefined for the length-less route (`/daily`,
// `/unlimited`), which keeps its own canonical while showing the default length.
export function getGameMeta(
  mode: DailyOrUnlimited,
  wordLength: WordLength,
  requestedLength: WordLength | undefined
): RouteMeta {
  return {
    title: `${MODE_LABELS[mode]} Kelime Oyunu — ${wordLength} Harf | Harfhane`,
    description: GAME_DESCRIPTIONS[mode](wordLength),
    canonicalPath: requestedLength === undefined ? `/${mode}` : `/${mode}/${requestedLength}`,
  };
}
