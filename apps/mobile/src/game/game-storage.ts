import { createInitialState } from './game-state';
import type { GameState } from './game-state';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const GAME_STATUSES = new Set(['playing', 'won', 'lost']);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isStringArray(candidate['guesses']) &&
    Array.isArray(candidate['evaluations']) &&
    typeof candidate['currentGuess'] === 'string' &&
    GAME_STATUSES.has(String(candidate['gameStatus'])) &&
    typeof candidate['keyboardStatus'] === 'object' &&
    candidate['keyboardStatus'] !== null
  );
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadGameState(store: KeyValueStore, key: string): Promise<GameState> {
  const raw = await store.getItem(key);
  const parsed = raw === null ? null : parseJson(raw);
  return isGameState(parsed) ? parsed : createInitialState();
}

export async function saveGameState(store: KeyValueStore, key: string, state: GameState): Promise<void> {
  await store.setItem(key, JSON.stringify(state));
}
