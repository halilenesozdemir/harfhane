import { Star, Target, Flame, BookOpen, Trophy, Library, Crown, Zap, Brain, Medal, Snowflake } from 'lucide-react';
import Modal from './Modal';
import XPBar from './XPBar';
import { useXP } from '../hooks/useXP';
import { useProfile, useStreakFreeze } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';
import type { Badge } from '../types';

const BADGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Star, Target, Flame, BookOpen, Trophy, Library, Crown, Zap, Brain, Medal,
};

const ALL_BADGES = [
  { slug: 'first-step',   name: 'İlk Adım',       description: 'İlk oyunu tamamla',     icon: 'Star' },
  { slug: 'sharpshooter', name: 'Keskin Nişancı',  description: '1. tahminde kazan',     icon: 'Target' },
  { slug: 'quick-mind',   name: 'Hızlı Düşünür',  description: '2 tahminde kazan',       icon: 'Brain' },
  { slug: 'streak-3',     name: 'Alışkanlık',      description: '3 günlük seri',         icon: 'Zap' },
  { slug: 'on-fire',      name: 'Ateş',            description: '7 günlük seri',         icon: 'Flame' },
  { slug: 'streak-14',    name: 'Bağımlı',         description: '14 günlük seri',        icon: 'Flame' },
  { slug: 'streak-30',    name: 'Maratoncu',       description: '30 günlük seri',        icon: 'Medal' },
  { slug: 'perfect-run',  name: 'Mükemmel Seri',   description: '10 arka arkaya kazan',  icon: 'Trophy' },
  { slug: 'word-master',  name: 'Söz Ustası',      description: '50 oyun tamamla',       icon: 'BookOpen' },
  { slug: 'lexicon',      name: 'Lügat',           description: '100 oyun tamamla',      icon: 'Library' },
  { slug: 'legend',       name: 'Efsane',          description: "Level 5'e ulaş",        icon: 'Crown' },
];

function StatPill({ label, value }: { label: string; value: string | number }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center bg-bg-secondary rounded-lg p-2.5 flex-1">
      <span className="text-lg font-bold text-text-primary tabular-nums">{value}</span>
      <span className="text-xs text-text-secondary mt-0.5">{label}</span>
    </div>
  );
}

function BadgeCard({ badge, earned }: { badge: typeof ALL_BADGES[number]; earned: boolean }): React.JSX.Element {
  const Icon = BADGE_ICONS[badge.icon] ?? Star;
  return (
    <div className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-colors ${
      earned ? 'border-correct bg-correct/10' : 'border-border-color bg-bg-primary opacity-35'
    }`}>
      <Icon size={22} className={earned ? 'text-correct' : 'text-text-secondary'} />
      <span className="text-xs font-semibold text-text-primary text-center leading-tight">{badge.name}</span>
      <span className="text-xs text-text-secondary text-center leading-tight">{badge.description}</span>
    </div>
  );
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps): React.JSX.Element {
  const { user, token } = useAuth();
  const { data: xpProfile, isLoading: xpLoading } = useXP(token);
  const { data: profileData, isLoading: profileLoading } = useProfile(token);
  const { mutate: freeze, isPending: freezing } = useStreakFreeze(token);

  const earnedSlugs = new Set((xpProfile?.badges ?? []).map((b: Badge) => b.slug));
  const stats = profileData?.stats;
  const isLoading = xpLoading || profileLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil">
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 bg-correct rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-2xl">
              {user?.username?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <p className="text-lg font-bold text-text-primary">{user?.username}</p>
          <p className="text-sm text-text-secondary">{user?.email}</p>
        </div>

        {isLoading && <div className="h-8 bg-tile-empty rounded animate-pulse" />}
        {xpProfile && <XPBar profile={xpProfile} />}

        {stats && (
          <div className="flex gap-2">
            <StatPill label="Oyun" value={stats.totalPlayed} />
            <StatPill label="Kazanma %" value={`${stats.winRate}%`} />
            <StatPill label="Seri" value={stats.currentStreak} />
            <StatPill label="En İyi" value={stats.maxStreak} />
          </div>
        )}

        {profileData && (
          <div className="flex items-center justify-between bg-bg-secondary rounded-xl p-3">
            <div className="flex items-center gap-2.5">
              <Snowflake size={20} className="text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Seri Dondurma</p>
                <p className="text-xs text-text-secondary">{profileData.freezeTokens} jeton kaldı</p>
              </div>
            </div>
            <button
              onClick={() => freeze()}
              disabled={freezing || profileData.freezeTokens <= 0 || profileData.playedToday}
              className="px-3 py-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {profileData.playedToday ? 'Oynadın' : freezing ? '...' : 'Bugünü Dondur'}
            </button>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-text-secondary mb-2.5">
            Rozetler · {earnedSlugs.size}/{ALL_BADGES.length}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ALL_BADGES.map(badge => (
              <BadgeCard key={badge.slug} badge={badge} earned={earnedSlugs.has(badge.slug)} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
