import { useQuery } from '@tanstack/react-query';
import { Trophy, Target, TrendingUp } from 'lucide-react';
import Modal from './Modal';
import { getTournamentLeaderboard } from '../lib/auth-api';

interface TournamentLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatWinRate(played: number, won: number): string {
  if (played === 0) return '0%';
  return `${Math.round((won / played) * 100)}%`;
}

export default function TournamentLeaderboardModal({
  isOpen,
  onClose,
}: TournamentLeaderboardModalProps): React.JSX.Element {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tournament-leaderboard'],
    queryFn: () => getTournamentLeaderboard('all'),
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const rows = data?.leaderboard ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yarışma Sıralaması">
      {!isLoading && !isError && rows.length > 0 && (
        <div className="flex items-center justify-end gap-4 px-3 mb-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1 w-16 justify-end"><TrendingUp size={11} /> Puan</span>
          <span className="flex items-center gap-1 w-12 justify-end"><Target size={11} /> Oyun</span>
          <span className="flex items-center gap-1 w-10 justify-end"><Trophy size={11} /> Kazan</span>
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
          Henüz yarışma oynayan yok.<br />
          İlk sen başla!
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

                <span className={`flex-1 min-w-0 font-semibold truncate ${isTopThree ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {row.username}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <TrendingUp size={12} className="text-amber-500" />
                  <span className="text-amber-500 font-bold tabular-nums text-sm w-12 text-right">
                    {row.total_score}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Target size={12} className="text-text-secondary" />
                  <span className="text-text-primary font-semibold tabular-nums text-sm w-8 text-right">
                    {row.games_played}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Trophy size={12} className="text-present" />
                  <span className="text-text-primary font-semibold tabular-nums text-sm w-8 text-right">
                    {formatWinRate(row.games_played, row.games_won)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
