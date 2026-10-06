import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameStatus } from '../types';

interface GameModalsState {
  showHelp: boolean;
  showStats: boolean;
  showGameOver: boolean;
  showSettings: boolean;
}

interface UseGameModalsReturn extends GameModalsState {
  openHelp: () => void;
  closeHelp: () => void;
  openStats: () => void;
  closeStats: () => void;
  closeGameOver: () => void;
  resetGameOver: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

interface UseGameModalsOptions {
  gameStatus: GameStatus;
  isUnlimited: boolean;
  onGameEnd: (won: boolean) => void;
}

export function useGameModals({ gameStatus, isUnlimited, onGameEnd }: UseGameModalsOptions): UseGameModalsReturn {
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const prevGameStatus = useRef(gameStatus);
  const onGameEndRef = useRef(onGameEnd);
  const isFirstRender = useRef(true);
  useEffect(() => { onGameEndRef.current = onGameEnd; });

  useEffect(() => {
    const prev = prevGameStatus.current;
    prevGameStatus.current = gameStatus;

    if (gameStatus !== 'won' && gameStatus !== 'lost') return undefined;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      const timer = setTimeout(() => setShowGameOver(true), 500);
      return () => clearTimeout(timer);
    }

    if (prev === 'playing') {
      if (isUnlimited) onGameEndRef.current(gameStatus === 'won');
      const timer = setTimeout(() => setShowGameOver(true), 1500);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [gameStatus, isUnlimited]);

  useEffect(() => { isFirstRender.current = false; }, []);

  const openHelp = useCallback(() => setShowHelp(true), []);

  return {
    showHelp,
    showStats,
    showGameOver,
    showSettings,
    openHelp,
    closeHelp: () => setShowHelp(false),
    openStats: () => setShowStats(true),
    closeStats: () => setShowStats(false),
    closeGameOver: () => setShowGameOver(false),
    resetGameOver: () => setShowGameOver(false),
    openSettings: () => setShowSettings(true),
    closeSettings: () => setShowSettings(false),
  };
}
