import { useNavigate } from 'react-router-dom';
import { Flame, Gamepad2, Percent } from 'lucide-react';
import { getTodayString } from '../utils/gameLogic';
import type { DailyStats, GameMode, UnlimitedStats, WordLength } from '../types';

const NAV_WIDTH_PX = 260;
const STATS_WIDTH_PX = 300;
const WORD_LENGTHS: WordLength[] = [4, 5, 6];
const PERCENT_SCALE = 100;

interface DesktopShellProps {
  mode: GameMode;
  wordLength: WordLength;
  stats: DailyStats | UnlimitedStats;
  onGoHome: () => void;
  children: React.ReactNode;
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
  onNavigate,
}: {
  mode: 'daily' | 'unlimited';
  activeMode: GameMode;
  activeWordLength: WordLength;
  onNavigate: (mode: 'daily' | 'unlimited', wordLength: WordLength) => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-1.5 px-1">
      {WORD_LENGTHS.map((length) => {
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
  onGoHome,
}: {
  mode: GameMode;
  wordLength: WordLength;
  onGoHome: () => void;
}): React.JSX.Element {
  const navigate = useNavigate();
  const goToGame = (nextMode: 'daily' | 'unlimited', length: WordLength): void => {
    navigate(`/${nextMode}/${length}`);
  };

  return (
    <nav aria-label="Oyun modları" className="flex flex-col gap-4">
      <button
        onClick={onGoHome}
        className="flex items-center gap-2 px-1 py-1 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-correct rounded-key"
        aria-label="Ana Sayfa"
      >
        <span className="w-8 h-8 bg-correct rounded-key flex items-center justify-center shadow-depth-correct">
          <span className="text-correct-fg font-bold text-lg">H</span>
        </span>
        <span className="font-display font-bold text-text-primary tracking-wide">HARFHANE</span>
      </button>

      <div className="flex flex-col gap-1.5">
        <NavLink label="Günlük" isActive={mode === 'daily'} onClick={() => goToGame('daily', wordLength)} />
        <WordLengthRow mode="daily" activeMode={mode} activeWordLength={wordLength} onNavigate={goToGame} />
      </div>

      <div className="flex flex-col gap-1.5">
        <NavLink label="Sınırsız" isActive={mode === 'unlimited'} onClick={() => goToGame('unlimited', wordLength)} />
        <WordLengthRow mode="unlimited" activeMode={mode} activeWordLength={wordLength} onNavigate={goToGame} />
      </div>

      <NavLink label="Turnuva" isActive={false} onClick={() => navigate('/tournament')} />
      <NavLink label="Listeler" isActive={false} onClick={() => navigate('/lists')} />
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

export default function DesktopShell({ mode, wordLength, stats, onGoHome, children }: DesktopShellProps): React.JSX.Element {
  return (
    <div className="lg:flex lg:justify-center lg:gap-6 lg:px-6 lg:py-6">
      <aside
        aria-label="Mod menüsü"
        className="hidden lg:block lg:sticky lg:top-6 lg:self-start lg:shrink-0 bg-bg-secondary rounded-tile p-4 shadow-depth-surface"
        style={{ width: NAV_WIDTH_PX }}
      >
        <ModeNav mode={mode} wordLength={wordLength} onGoHome={onGoHome} />
      </aside>

      <div className="lg:flex-1 lg:flex lg:justify-center lg:min-w-0">
        <div className="w-full lg:max-w-[520px]">{children}</div>
      </div>

      <div
        className="hidden lg:block lg:sticky lg:top-6 lg:self-start lg:shrink-0"
        style={{ width: STATS_WIDTH_PX }}
      >
        <StatusPanel mode={mode} stats={stats} />
      </div>
    </div>
  );
}
