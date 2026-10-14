import type { KeyProps } from '../types';

function getLabel(keyValue: string): string {
  if (keyValue === 'ENTER') return 'Gönder';
  if (keyValue === 'BACKSPACE') return 'Sil';
  return keyValue;
}

function getAriaLabel(keyValue: string, label: string): string {
  if (keyValue === 'BACKSPACE') return 'Harf sil';
  return label;
}

const Key = ({ keyValue, onClick, status, isWide = false }: KeyProps): React.JSX.Element => {
  const isEnter = keyValue === 'ENTER';
  const label = getLabel(keyValue);

  const getStatusClasses = (): string => {
    // The brand colour marks the primary action (R4), independent of the
    // letter-evaluation colours below.
    if (isEnter) return 'bg-brand text-brand-fg shadow-depth-brand';
    switch (status) {
      case 'correct':
        return 'bg-correct text-correct-fg shadow-depth-correct';
      case 'present':
        return 'bg-present text-present-fg shadow-depth-present';
      case 'absent':
        return 'bg-absent text-absent-fg shadow-depth-absent';
      default:
        return 'bg-key-bg text-key-fg shadow-depth-key';
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(keyValue)}
      className={`
        ${isWide ? 'flex-[1.6_1_0%]' : 'flex-1 min-w-0 max-w-[46px]'}
        h-14
        ${getStatusClasses()}
        rounded-key
        font-body text-sm md:text-base font-extrabold
        flex items-center justify-center
        transition-transform duration-100
        active:translate-y-[2px] active:shadow-none
        select-none
        hover:brightness-95
        cursor-pointer
      `}
      aria-label={getAriaLabel(keyValue, label)}
    >
      {label}
    </button>
  );
};

export default Key;
