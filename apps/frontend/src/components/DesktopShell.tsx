import { useNavigate } from 'react-router-dom';
import { Flame, Gamepad2, Percent } from 'lucide-react';
import { getTodayString } from '@harfhane/shared';
import BrandMark from './BrandMark';
import type { DailyStats, GameMode, UnlimitedStats, WordLength } from '../types';

const NAV_WIDTH_PX = 260;
const STATS_WIDTH_PX = 300;
const SCHEDULED_WORD_LENGTHS: WordLength[] = [4, 5, 6];
const PERCENT_SCALE = 100;

interface DesktopShellProps {
  mode: GameMode;
  wordLength: WordLength;
  /** R1: lengths the length picker offers; defaults to every scheduled length. */
  playableLengths?: readonly WordLength[] | undefined;
  stats: DailyStats | UnlimitedStats;
  onGoHome: () => void;
  children: React.ReactNode;
  /** R2 layout slot: overrides the default mode-nav aside when the game page
   * supplies its own left panel. Omit to keep today's ModeNav. */
  left?: React.ReactNode;
  /** R2 layout slot: overrides the default status aside when the game page
   * supplies its own right panel. Omit to keep today's StatusPanel. */
  right?: React.ReactNode;
}

function isDailyStats(stats: DailyStats | UnlimitedStats): stats is DailyStats {
  return 'currentStreak' in stats;
}

function NavLink({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`w-full text-left px-3 py-2 rounded-key text-sm font-bold transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-correct ${
        isActive ? 'bg-correct text-correct-fg' : 'text-text-primary hover:bg-tile-empty'
      }`}
    >
      {label}
    </button>
  );
}

function WordLengthRow({
  mode,
  activeMode,
  activeWordLength,
  lengths,
  onNavigate,
}: {
  mode: 'daily' | 'unlimited';
  activeMode: GameMode;
  activeWordLength: WordLength;
  lengths: readonly WordLength[];
  onNavigate: (mode: 'daily' | 'unlimited', wordLength: WordLength) => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-1.5 px-1">
      {lengths.map((length) => {
        const isActive = activeMode === mode && activeWordLength === length;
        return (
          <button
            key={length}
            onClick={() => onNavigate(mode, length)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 h-8 rounded-key text-xs font-bold transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-correct ${
              isActive ? 'bg-correct text-correct-fg' : 'bg-tile-empty text-text-secondary hover:bg-tile-filled'
            }`}
          >
            {length}
          </button>
        );
      })}
    </div>
  );
}

function ModeNav({
  mode,
  wordLength,
  playableLengths,
  onGoHome,
}: {
  mode: GameMode;
  wordLength: WordLength;
  playableLengths: readonly WordLength[];
  onGoHome: () => void;
}): React.JSX.Element {
  const navigate = useNavigate();
  const goToGame = (nextMode: 'daily' | 'unlimited', length: WordLength): void => {
    navigate(`/${nextMode}/${length}`);
  };
  const showLengthPicker = playableLengths.length > 1;

  return (
    <nav aria-label="Oyun modları" className="flex flex-col gap-4">
      <button
        onClick={onGoHome}
        className="flex items-center gap-2 px-1 py-1 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-correct rounded-key"
        aria-label="Ana Sayfa"
      >
        <BrandMark className="w-8 h-8" decorative />
        <span className="font-display font-bold text-text-primary tracking-wide">HARFHANE</span>
      </button>

      <div className="flex flex-col gap-1.5">
        <NavLink label="Günlük" isActive={mode === 'daily'} onClick={() => goToGame('daily', wordLength)} />
        {showLengthPicker && (
          <WordLengthRow mode="daily" activeMode={mode} activeWordLength={wordLength} lengths={playableLengths} onNavigate={goToGame} />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <NavLink label="Sınırsız" isActive={mode === 'unlimited'} onClick={() => goToGame('unlimited', wordLength)} />
        {showLengthPicker && (
          <WordLengthRow mode="unlimited" activeMode={mode} activeWordLength={wordLength} lengths={playableLengths} onNavigate={goToGame} />
        )}
      </div>

    </nav>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1 bg-bg-primary rounded-key py-3">
      {icon}
      <span className="text-lg font-bold text-text-primary">{value}</span>
      <span className="text-[11px] text-text-secondary">{label}</span>
    </div>
  );
}

function StatusPanel({ mode, stats }: { mode: GameMode; stats: DailyStats | UnlimitedStats }): React.JSX.Element {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * PERCENT_SCALE) : 0;
  const streak = isDailyStats(stats) ? stats.currentStreak : null;
  const playedToday = isDailyStats(stats) && stats.lastPlayedDate === getTodayString();

  return (
    <aside aria-label="Günün durumu" className="flex flex-col gap-3">
      <div className="bg-bg-secondary rounded-tile p-4 shadow-depth-surface">
        <h2 className="font-display font-bold text-text-primary text-sm mb-1">Günün Durumu</h2>
        <p className="text-text-secondary text-sm">
          {mode === 'daily'
            ? playedToday
              ? 'Bugünkü kelimeyi çözdün.'
              : 'Bugünün kelimesi seni bekliyor.'
            : 'Sınırsız modda pratik yapıyorsun.'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatTile icon={<Flame size={18} className="text-present" />} label="Seri" value={streak === null ? '—' : String(streak)} />
        <StatTile icon={<Gamepad2 size={18} className="text-text-secondary" />} label="Oynanan" value={String(stats.gamesPlayed)} />
        <StatTile icon={<Percent size={18} className="text-correct" />} label="Kazanma" value={`${winRate}%`} />
      </div>
    </aside>
  );
}

export default function DesktopShell({
  mode,
  wordLength,
  playableLengths = SCHEDULED_WORD_LENGTHS,
  stats,
  onGoHome,
  children,
  left,
  right,
}: DesktopShellProps): React.JSX.Element {
  const leftContent = left ?? (
    <ModeNav mode={mode} wordLength={wordLength} playableLengths={playableLengths} onGoHome={onGoHome} />
  );
  const rightContent = right ?? <StatusPanel mode={mode} stats={stats} />;

  // R2/012-AE3: max-w-[1200px] mx-auto bounds the whole row so the asides sit
  // inside a centred container instead of the previous lg:flex-1 middle
  // column stretching to fill the full viewport and pinning them to its edges.
  return (
    <div className="max-w-[1200px] mx-auto lg:flex lg:justify-center lg:gap-6 lg:px-6 lg:py-6">
      <aside
        aria-label="Mod menüsü"
        className="hidden lg:block lg:sticky lg:top-6 lg:self-start lg:shrink-0 bg-bg-secondary rounded-tile p-4 shadow-depth-surface"
        style={{ width: NAV_WIDTH_PX }}
      >
        {leftContent}
      </aside>

      <div className="lg:flex-1 lg:flex lg:justify-center lg:min-w-0">
        <div className="w-full lg:max-w-[520px]">{children}</div>
      </div>

      <div
        className="hidden lg:block lg:sticky lg:top-6 lg:self-start lg:shrink-0"
        style={{ width: STATS_WIDTH_PX }}
      >
        {rightContent}
      </div>
    </div>
  );
}
