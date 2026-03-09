import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, TrendingUp } from 'lucide-react';
import Modal from './Modal';
import { getLeaderboard } from '../lib/auth-api';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps): React.JSX.Element {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const rows = data?.leaderboard ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sıralama">
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
        <div className="flex flex-col gap-1">
          {/* Başlık */}
          <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-2 px-3 py-1.5 text-xs text-text-secondary font-medium border-b border-border mb-1">
            <span>#</span>
            <span>Oyuncu</span>
            <span className="flex items-center gap-1"><Trophy size={11} /> Kazanma</span>
            <span className="flex items-center gap-1"><Flame size={11} /> Seri</span>
            <span className="flex items-center gap-1"><TrendingUp size={11} /> Oran</span>
          </div>

          {rows.map((row, i) => {
            const medal = i === 0 ? '1.' : i === 1 ? '2.' : i === 2 ? '3.' : `${i + 1}.`;
            const medalColor = i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-text-secondary';
            return (
              <div
                key={row.user_id}
                className={`grid grid-cols-[2rem_1fr_auto_auto_auto] gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${i < 3 ? 'bg-bg-primary' : 'hover:bg-bg-primary'}`}
              >
                <span className={`font-bold text-xs ${medalColor}`}>{medal}</span>
                <span className="font-medium text-text-primary truncate">{row.username}</span>
                <span className="text-text-primary font-bold tabular-nums">{row.total_won}</span>
                <span className="text-tile-correct font-semibold tabular-nums">{row.current_streak}</span>
                <span className="text-text-secondary tabular-nums">%{row.win_rate}</span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
