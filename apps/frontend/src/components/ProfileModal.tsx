import { Star, Target, Flame, BookOpen, Trophy, Library, Crown } from 'lucide-react';
import Modal from './Modal';
import XPBar from './XPBar';
import { useXP } from '../hooks/useXP';
import { useAuth } from '../context/AuthContext';
import type { Badge } from '../types';

const BADGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Star, Target, Flame, BookOpen, Trophy, Library, Crown,
};

const ALL_BADGE_SLUGS = [
  { slug: 'first-step',   name: 'İlk Adım',       description: 'İlk oyununu tamamla',          icon: 'Star' },
  { slug: 'sharpshooter', name: 'Keskin Nişancı',  description: '1. tahminde kazan',            icon: 'Target' },
  { slug: 'on-fire',      name: 'Ateş',            description: '7 günlük seri yap',            icon: 'Flame' },
  { slug: 'word-master',  name: 'Söz Ustası',      description: '50 oyun tamamla',              icon: 'BookOpen' },
  { slug: 'perfect-run',  name: 'Mükemmel Seri',   description: '10 oyunu arka arkaya kazan',  icon: 'Trophy' },
  { slug: 'lexicon',      name: 'Lügat',           description: '100 oyun tamamla',             icon: 'Library' },
  { slug: 'legend',       name: 'Efsane',          description: "Level 5'e ulaş",              icon: 'Crown' },
];

interface BadgeCardProps {
  badge: typeof ALL_BADGE_SLUGS[number];
  earned: boolean;
}

function BadgeCard({ badge, earned }: BadgeCardProps): React.JSX.Element {
  const Icon = BADGE_ICONS[badge.icon] ?? Star;
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
      earned
        ? 'border-correct bg-correct/10'
        : 'border-border-color bg-bg-primary opacity-40'
    }`}>
      <Icon size={24} className={earned ? 'text-correct' : 'text-text-secondary'} />
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
  const { data: profile, isLoading } = useXP(token);

  const earnedSlugs = new Set((profile?.badges ?? []).map((b: Badge) => b.slug));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil">
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">{user?.username}</p>
          <p className="text-sm text-text-secondary">{user?.email}</p>
        </div>

        {isLoading && (
          <div className="h-8 bg-tile-empty rounded animate-pulse" />
        )}

        {profile && (
          <XPBar profile={profile} />
        )}

        <div>
          <p className="text-sm font-semibold text-text-secondary mb-3">Rozetler</p>
          <div className="grid grid-cols-3 gap-2">
            {ALL_BADGE_SLUGS.map(badge => (
              <BadgeCard key={badge.slug} badge={badge} earned={earnedSlugs.has(badge.slug)} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
