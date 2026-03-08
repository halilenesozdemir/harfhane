import type { KeyProps } from '../types';

const Key = ({ keyValue, onClick, status, isWide = false }: KeyProps): React.JSX.Element => {
  const getStatusClasses = (): string => {
    switch (status) {
      case 'correct':
        return 'bg-correct text-white';
      case 'present':
        return 'bg-present text-white';
      case 'absent':
        return 'bg-absent text-white';
      default:
        return 'bg-key-bg text-text-primary';
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
        rounded-md
        text-sm md:text-base font-semibold
        flex items-center justify-center
        transition-all duration-100
        active:scale-95
        select-none
        hover:opacity-80
        cursor-pointer
      `}
      aria-label={keyValue}
    >
      {displayValue()}
    </button>
  );
};

export default Key;
