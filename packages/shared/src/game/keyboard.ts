import type { TileStatus } from './types';

const STATUS_PRIORITY: Record<string, number> = { correct: 3, present: 2, absent: 1 };

export const updateKeyboardStatus = (
  currentStatus: Record<string, TileStatus>,
  guess: string,
  evaluation: TileStatus[]
): Record<string, TileStatus> => {
  const newStatus = { ...currentStatus };

  guess.split('').forEach((char, i) => {
    const existingStatus = newStatus[char];
    const currentPriority = existingStatus ? STATUS_PRIORITY[existingStatus] || 0 : 0;
    const evalStatus = evaluation[i];
    const newPriority = evalStatus ? STATUS_PRIORITY[evalStatus] || 0 : 0;

    if (newPriority > currentPriority && evalStatus) {
      newStatus[char] = evalStatus;
    }
  });

  return newStatus;
};
