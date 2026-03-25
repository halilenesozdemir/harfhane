import { Star, Target, Flame, BookOpen, Trophy, Library, Crown } from 'lucide-react';
import type { Badge, XPProfile } from '../types';

const LEVEL_THRESHOLDS = [0, 250, 750, 1500, 3000, 5000] as const;

const BADGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Star, Target, Flame, BookOpen, Trophy, Library, Crown,
};

interface XPBarProps {
  profile: XPProfile;
}

function BadgeIcon({ icon, className }: { icon: string; className?: string }): React.JSX.Element {
  const Icon = BADGE_ICONS[icon] ?? Star;
  return <Icon size={16} className={className} />;
}

export function BadgeItem({ badge }: { badge: Badge }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-bg-primary border border-border-color rounded-lg">
      <BadgeIcon icon={badge.icon} className="text-correct flex-shrink-0" />
      <div>
        <p className="text-xs font-semibold text-text-primary">{badge.name}</p>
        <p className="text-xs text-text-secondary">{badge.description}</p>
      </div>
    </div>
  );
}

export default function XPBar({ profile }: XPBarProps): React.JSX.Element {
  const { totalXP, level, nextLevelXP } = profile;
  const levelStartXP = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const isMaxLevel = level >= LEVEL_THRESHOLDS.length;
  const progressXP = totalXP - levelStartXP;
  const rangeXP = isMaxLevel ? totalXP - levelStartXP : nextLevelXP - levelStartXP;
  const percent = isMaxLevel ? 100 : Math.min(100, Math.round((progressXP / rangeXP) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span className="font-semibold text-text-primary">Seviye {level}</span>
        <span>{totalXP} XP{!isMaxLevel && ` / ${nextLevelXP} XP`}</span>
      </div>
      <div className="w-full h-2 bg-tile-empty rounded-full overflow-hidden">
        <div
          className="h-full bg-correct rounded-full transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
