import { Clock } from 'lucide-react';
import { useMidnightCountdown } from './useMidnightCountdown';
import type { TodayStatus as TodayStatusValue } from './today-status';

interface TodayStatusProps {
  status: TodayStatusValue;
}

const BADGE_BASE = 'self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-primary text-xs font-bold';

/** The daily mode card's status badge (R3, AE4): what today's game state means for the player. */
function TodayStatus({ status }: TodayStatusProps): React.JSX.Element {
  const countdown = useMidnightCountdown();

  if (status.kind === 'won') {
    return (
      <span className={`${BADGE_BASE} text-correct`}>
        <Clock size={14} aria-hidden="true" />
        Çözdün · yeni kelime {countdown} sonra
      </span>
    );
  }

  if (status.kind === 'lost') {
    return (
      <span className={`${BADGE_BASE} text-text-secondary`}>
        <Clock size={14} aria-hidden="true" />
        Bugün bitti · yeni kelime {countdown} sonra
      </span>
    );
  }

  if (status.kind === 'in-progress') {
    return <span className={`${BADGE_BASE} text-present`}>Devam ediyor</span>;
  }

  return <span className={`${BADGE_BASE} text-correct`}>Henüz oynamadın</span>;
}

export default TodayStatus;
