import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useListLikes, useToggleLike } from '../hooks/useSocial';

interface LikeButtonProps {
  slug: string;
  onLoginRequired?: () => void;
}

export default function LikeButton({ slug, onLoginRequired }: LikeButtonProps): React.JSX.Element {
  const { token } = useAuth();
  const { data } = useListLikes(slug, token ?? undefined);
  const toggleLike = useToggleLike(token);

  const count = data?.count ?? 0;
  const liked = data?.liked ?? false;

  const handleClick = () => {
    if (!token) {
      onLoginRequired?.();
      return;
    }
    toggleLike.mutate(slug);
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleLike.isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
        liked
          ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
          : 'bg-tile-empty text-text-secondary hover:text-red-400'
      }`}
      aria-label={liked ? 'Beğeniyi kaldır' : 'Beğen'}
    >
      <Heart size={15} className={liked ? 'fill-current' : ''} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
