import { createInitialState } from './game-state';
import type { GameState } from './game-state';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const GAME_STATUSES = new Set(['playing', 'won', 'lost']);
const TILE_STATUSES = new Set(['correct', 'present', 'absent']);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isTileStatus(value: unknown): boolean {
  return value === null || (typeof value === 'string' && TILE_STATUSES.has(value));
}

function isEvaluationList(value: unknown): boolean {
  return Array.isArray(value) && value.every((row) => Array.isArray(row) && row.every(isTileStatus));
}

function isKeyboardStatus(value: unknown): boolean {
  return typeof value === 'object' && value !== null && Object.values(value).every(isTileStatus);
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isStringArray(candidate['guesses']) &&
    isEvaluationList(candidate['evaluations']) &&
    typeof candidate['currentGuess'] === 'string' &&
    GAME_STATUSES.has(String(candidate['gameStatus'])) &&
    isKeyboardStatus(candidate['keyboardStatus'])
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

function isValidHintPosition(entry: unknown, wordLength: number): entry is number {
  return typeof entry === 'number' && Number.isInteger(entry) && entry >= 0 && entry < wordLength;
}

function isHintPositionArray(value: unknown, wordLength: number): value is number[] {
  return Array.isArray(value) && value.every((entry) => isValidHintPosition(entry, wordLength));
}

export async function loadRevealedHints(store: KeyValueStore, key: string, wordLength: number): Promise<number[]> {
  const raw = await store.getItem(key);
  const parsed = raw === null ? null : parseJson(raw);
  return isHintPositionArray(parsed, wordLength) ? parsed : [];
}

export async function saveRevealedHints(store: KeyValueStore, key: string, positions: readonly number[]): Promise<void> {
  await store.setItem(key, JSON.stringify(positions));
}
