import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { WordEntry, WordLength } from '../types';
import { getTodayString } from '../utils/gameLogic';

interface UseHintReturn {
  hintText: string | null;
  hintUsed: boolean;
  revealHint: () => void;
}

function buildHintText(entry: WordEntry): string {
  const meaning = entry.meaning ?? '';
  const words = meaning.split(' ').slice(0, 4).join(' ');
  const suffix = meaning.split(' ').length > 4 ? '...' : '';
  return `${entry.category} — "${words}${suffix}"`;
}

export function useHint(
  solutionEntry: WordEntry | null,
  wordLength: WordLength,
  isUnlimited: boolean
): UseHintReturn {
  const today = getTodayString();
  const storageKey = `harfhane:hint:${today}:${wordLength}`;

  const [hintUsed, setHintUsed] = useLocalStorage<boolean>(storageKey, false);
  const [hintText, setHintText] = useState<string | null>(null);

  const revealHint = (): void => {
    if (isUnlimited || hintUsed || !solutionEntry) return;
    setHintText(buildHintText(solutionEntry));
    setHintUsed(true);
  };

  return { hintText, hintUsed, revealHint };
}
