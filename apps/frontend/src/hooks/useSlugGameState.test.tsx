import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UseQueryResult } from '@tanstack/react-query';
import { useSlugGameState } from './useSlugGameState';
import * as wordApi from './useWordApi';
import type { WordList } from '@harfhane/shared';
import type { DailyWordResponse } from '@harfhane/shared';

vi.mock('./useWordApi');

const LIST: WordList = {
  id: 1,
  slug: 'test-list',
  name: 'Test Listesi',
  description: null,
  wordLength: 5,
  isPublic: true,
  hasDaily: true,
  ownerUserId: null,
  createdAt: '2026-01-01',
};

function queryResult<T>(data: T): UseQueryResult<T> {
  return { data, isLoading: false, isError: false } as UseQueryResult<T>;
}

function mockDailyWord(solution: string): void {
  const dailyResponse: DailyWordResponse = {
    word: { word: solution, meaning: null, context: '', category: 'isim' },
    gameNumber: 1,
    date: '2026-10-05',
  };
  vi.spyOn(wordApi, 'useListInfo').mockReturnValue(queryResult({ list: LIST }));
  vi.spyOn(wordApi, 'useSlugWord').mockReturnValue({
    ...queryResult(undefined),
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof wordApi.useSlugWord>);
  vi.spyOn(wordApi, 'useSlugDailyWord').mockReturnValue(queryResult(dailyResponse));
}

function renderSlugGameState() {
  const queryClient = new QueryClient();
  return renderHook(() => useSlugGameState('test-list'), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
}

describe('useSlugGameState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should start with an empty game state for a fresh daily word', () => {
    mockDailyWord('KALEM');
    const { result } = renderSlugGameState();

    expect(result.current.gameState.guesses).toEqual([]);
    expect(result.current.showGameOverModal).toBe(false);
  });

  it('should restore guesses from a persisted finished daily game', () => {
    window.localStorage.setItem(
      'harfhane:slug:test-list:daily:2026-10-05',
      JSON.stringify({
        date: '2026-10-05',
        guesses: ['TAHTA', 'KALEM'],
        evaluations: [
          ['absent', 'absent', 'absent', 'absent', 'absent'],
          ['correct', 'correct', 'correct', 'correct', 'correct'],
        ],
        gameStatus: 'won',
        keyboardStatus: {},
      })
    );
    mockDailyWord('KALEM');

    const { result } = renderSlugGameState();

    expect(result.current.gameState.guesses).toEqual(['TAHTA', 'KALEM']);
    expect(result.current.gameState.gameStatus).toBe('won');
  });

  it('should show the game-over modal shortly after restoring a finished game', () => {
    window.localStorage.setItem(
      'harfhane:slug:test-list:daily:2026-10-05',
      JSON.stringify({
        date: '2026-10-05',
        guesses: ['KALEM'],
        evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
        gameStatus: 'won',
        keyboardStatus: {},
      })
    );
    mockDailyWord('KALEM');

    const { result } = renderSlugGameState();
    expect(result.current.showGameOverModal).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.showGameOverModal).toBe(true);
  });
});
