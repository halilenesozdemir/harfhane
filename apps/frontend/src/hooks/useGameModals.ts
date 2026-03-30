import { useState, useEffect, useRef } from 'react';
import type { GameStatus } from '../types';

interface GameModalsState {
  showHelp: boolean;
  showStats: boolean;
  showGameOver: boolean;
  showSettings: boolean;
  showAuth: boolean;
  showLeaderboard: boolean;
  showProfile: boolean;
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
  openAuth: () => void;
  closeAuth: () => void;
  openLeaderboard: () => void;
  closeLeaderboard: () => void;
  openProfile: () => void;
  closeProfile: () => void;
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
  const [showAuth, setShowAuth] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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

  return {
    showHelp,
    showStats,
    showGameOver,
    showSettings,
    showAuth,
    showLeaderboard,
    showProfile,
    openHelp: () => setShowHelp(true),
    closeHelp: () => setShowHelp(false),
    openStats: () => setShowStats(true),
    closeStats: () => setShowStats(false),
    closeGameOver: () => setShowGameOver(false),
    resetGameOver: () => setShowGameOver(false),
    openSettings: () => setShowSettings(true),
    closeSettings: () => setShowSettings(false),
    openAuth: () => setShowAuth(true),
    closeAuth: () => setShowAuth(false),
    openLeaderboard: () => setShowLeaderboard(true),
    closeLeaderboard: () => setShowLeaderboard(false),
    openProfile: () => setShowProfile(true),
    closeProfile: () => setShowProfile(false),
  };
}
