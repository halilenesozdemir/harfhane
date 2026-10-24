import { useNavigate } from 'react-router-dom';
import type { DailyStats, GameMode, UnlimitedStats, WordLength } from '../../types';

const PERCENT_SCALE = 100;

interface GameSidePanelProps {
  mode: GameMode;
  wordLength: WordLength;
  stats: DailyStats | UnlimitedStats;
}

function isDailyStats(stats: DailyStats | UnlimitedStats): stats is DailyStats {
  return 'currentStreak' in stats;
}

function ModeSwitch({ mode, wordLength }: { mode: GameMode; wordLength: WordLength }): React.JSX.Element {
  const navigate = useNavigate();

  const modeButtonClasses = (isActive: boolean): string =>
    `flex-1 px-4 py-2 rounded-key text-sm font-bold cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-correct ${
      isActive ? 'bg-correct text-correct-fg shadow-depth-correct' : 'bg-bg-secondary text-text-primary'
    }`;

  return (
    <div role="group" aria-label="Mod" className="flex gap-2">
      <button
        type="button"
        onClick={() => navigate(`/daily/${wordLength}`)}
        aria-current={mode === 'daily' ? 'page' : undefined}
        className={modeButtonClasses(mode === 'daily')}
      >
        Günlük
      </button>
      <button
        type="button"
        onClick={() => navigate(`/unlimited/${wordLength}`)}
        aria-current={mode === 'unlimited' ? 'page' : undefined}
        className={modeButtonClasses(mode === 'unlimited')}
      >
        Sınırsız
      </button>
    </div>
  );
}

function TodayStatsCard({ stats }: { stats: DailyStats | UnlimitedStats }): React.JSX.Element {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * PERCENT_SCALE) : 0;
  const streak = isDailyStats(stats) ? stats.currentStreak : null;

  return (
    <div
      aria-label="Bugün"
      className="flex-1 bg-bg-secondary border border-border-color rounded-tile p-3 grid grid-cols-3 gap-2 text-center"
    >
      <div className="flex flex-col">
        <span className="font-display font-extrabold text-lg text-text-primary">{streak === null ? '—' : streak}</span>
        <span className="text-xs font-bold text-text-secondary">Seri</span>
      </div>
      <div className="flex flex-col">
        <span className="font-display font-extrabold text-lg text-text-primary">{stats.gamesPlayed}</span>
        <span className="text-xs font-bold text-text-secondary">Oynanan</span>
      </div>
      <div className="flex flex-col">
        <span className="font-display font-extrabold text-lg text-text-primary">{`%${winRate}`}</span>
        <span className="text-xs font-bold text-text-secondary">Kazanma</span>
      </div>
    </div>
  );
}

// R4's mode switch and today-stats card. DesktopShell (U2, Plan 012) already
// renders its own mode nav and status panel asides at `lg:` and up (plus now
// exposes `left`/`right` slot props for U4 to use there later), so this
// component only fills the gap between `sm:` (where there is finally room)
// and `lg:` (where DesktopShell's own asides take over) instead of
// duplicating them. Hidden below `sm:` entirely: the approved phone mockup
// (`GamePhone.dc.html`) has no side panel at all on a true phone width, and
// a 360x640 screen has no vertical room left for it once the keyboard is on
// screen (012-AE5).
export default function GameSidePanel({ mode, wordLength, stats }: GameSidePanelProps): React.JSX.Element {
  return (
    <div className="hidden sm:flex lg:hidden w-full max-w-lg mx-auto px-2 flex-col sm:flex-row gap-3">
      <ModeSwitch mode={mode} wordLength={wordLength} />
      <TodayStatsCard stats={stats} />
    </div>
  );
}
