import type { KeyProps } from '../types';

const Key = ({ keyValue, onClick, status, isWide = false }: KeyProps): React.JSX.Element => {
  const getStatusClasses = (): string => {
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

  const displayValue = (): string => {
    if (keyValue === 'ENTER') return 'ENTER';
    if (keyValue === 'BACKSPACE') return '⌫';
    return keyValue;
  };

  return (
    <button
      onClick={() => onClick(keyValue)}
      className={`
        ${isWide ? 'px-3 md:px-4 min-w-[65px] md:min-w-[75px]' : 'w-8 md:w-10'}
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
      aria-label={keyValue}
    >
      {displayValue()}
    </button>
  );
};

export default Key;
