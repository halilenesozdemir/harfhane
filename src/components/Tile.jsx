const Tile = ({ letter, status, isRevealing, revealDelay, isFilled }) => {
  const getStatusClasses = () => {
    if (!status) return '';
    switch (status) {
      case 'correct':
        return 'bg-correct border-correct';
      case 'present':
        return 'bg-present border-present';
      case 'absent':
        return 'bg-absent border-absent';
      default:
        return '';
    }
  };

  const getBorderClass = () => {
    if (status) return '';
    if (isFilled) return 'border-tile-filled';
    return 'border-tile-empty';
  };

  return (
    <div
      className={`
        w-14 h-14 md:w-16 md:h-16
        flex items-center justify-center
        text-2xl md:text-3xl font-bold text-white uppercase
        border-2 ${getBorderClass()} ${getStatusClasses()}
        ${isRevealing ? `tile-flip tile-flip-delay-${revealDelay}` : ''}
        ${isFilled && !status ? 'animate-pop' : ''}
        transition-colors duration-100
        select-none
      `}
    >
      {letter}
    </div>
  );
};

export default Tile;
