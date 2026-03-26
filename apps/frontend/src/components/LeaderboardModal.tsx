import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, TrendingUp } from 'lucide-react';
import Modal from './Modal';
import { getLeaderboard } from '../lib/auth-api';
import type { LeaderboardPeriod } from '../lib/auth-api';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  all: 'Tüm Zamanlar',
  week: 'Bu Hafta',
  month: 'Bu Ay',
};

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps): React.JSX.Element {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => getLeaderboard(period),
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const rows = data?.leaderboard ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sıralama">
      <div className="flex gap-1 mb-4 bg-bg-primary rounded-xl p-1">
        {(Object.keys(PERIOD_LABELS) as LeaderboardPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              period === p
                ? 'bg-correct text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {!isLoading && !isError && rows.length > 0 && (
        <div className="flex items-center justify-end gap-4 px-3 mb-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1 w-14 justify-end"><TrendingUp size={11} /> XP</span>
          <span className="flex items-center gap-1 w-9 justify-end"><Trophy size={11} /> Kazan</span>
          <span className="flex items-center gap-1 w-9 justify-end"><Flame size={11} /> Seri</span>
        </div>
      )}
      {isLoading && (
        <p className="text-center text-text-secondary py-8 text-sm animate-pulse">Yükleniyor...</p>
      )}

      {isError && (
        <p className="text-center text-tile-absent py-8 text-sm">Sıralama yüklenemedi.</p>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="text-center text-text-secondary py-8 text-sm">
          Henüz sıralamaya giren oyuncu yok.<br />
          Giriş yap ve oyna!
        </p>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {rows.map((row, i) => {
            const rankColors = ['text-yellow-400', 'text-slate-400', 'text-amber-600'];
            const rankColor = rankColors[i] ?? 'text-text-secondary';
            const isTopThree = i < 3;
            return (
              <div
                key={row.user_id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isTopThree ? 'bg-bg-primary border border-border-color' : 'hover:bg-bg-primary'}`}
              >
                <span className={`w-5 text-center font-bold text-sm shrink-0 ${rankColor}`}>{i + 1}</span>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-correct text-white text-xs font-bold shrink-0">
                    {row.level}
                  </span>
                  <span className={`font-semibold truncate ${isTopThree ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {row.username}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <TrendingUp size={12} className="text-correct" />
                  <span className="text-correct font-bold tabular-nums text-sm w-10 text-right">{row.total_xp}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Trophy size={12} className="text-present" />
                  <span className="text-text-primary font-semibold tabular-nums text-sm w-6 text-right">{row.total_won}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Flame size={12} className="text-red-400" />
                  <span className="text-text-primary font-semibold tabular-nums text-sm w-6 text-right">{row.current_streak}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
