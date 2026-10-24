import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

type IconVariant = 'correct' | 'present';

interface ModeCardProps {
  icon: ReactNode;
  iconVariant: IconVariant;
  title: string;
  description: string;
  badge?: ReactNode;
  /** Content rendered below the clickable area, e.g. the unlimited length picker — never nested inside the button. */
  footer?: ReactNode;
  onClick: () => void;
}

const ICON_WRAP_CLASSES: Record<IconVariant, string> = {
  correct: 'bg-correct shadow-depth-correct',
  present: 'bg-present shadow-depth-present',
};

/** A depth mode card on the home page (R3): Günlük and Sınırsız share this shape. */
function ModeCard({ icon, iconVariant, title, description, badge, footer, onClick }: ModeCardProps): React.JSX.Element {
  return (
    <div className="w-full bg-bg-secondary border border-border-color rounded-tile shadow-depth-surface overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left p-5 flex flex-col gap-4 cursor-pointer hover:bg-tile-empty/40 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={`w-12 h-12 rounded-key flex items-center justify-center shrink-0 ${ICON_WRAP_CLASSES[iconVariant]}`}>
            {icon}
          </span>
          <ChevronRight size={22} className="text-text-secondary" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-display font-extrabold text-xl sm:text-2xl text-text-primary">{title}</span>
          <span className="text-sm text-text-secondary">{description}</span>
        </div>
        {badge}
      </button>
      {footer}
    </div>
  );
}

export default ModeCard;
