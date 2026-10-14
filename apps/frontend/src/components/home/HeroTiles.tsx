type TileVariant = 'correct' | 'present';

interface HeroLetter {
  readonly letter: string;
  readonly variant: TileVariant;
}

const TILE_CLASSES: Record<TileVariant, string> = {
  correct: 'bg-correct text-correct-fg shadow-depth-correct',
  present: 'bg-present text-present-fg shadow-depth-present',
};

const HERO_LETTERS: readonly HeroLetter[] = [
  { letter: 'H', variant: 'correct' },
  { letter: 'A', variant: 'correct' },
  { letter: 'R', variant: 'present' },
  { letter: 'F', variant: 'correct' },
];

function LetterTile({ letter, variant }: HeroLetter): React.JSX.Element {
  return (
    <span
      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-tile flex items-center justify-center font-display font-extrabold text-2xl sm:text-4xl ${TILE_CLASSES[variant]}`}
    >
      {letter}
    </span>
  );
}

/** The H-A-R-F tile hero (R3): depth tiles for "HARF" plus plain text for "hane". */
function HeroTiles(): React.JSX.Element {
  return (
    <div role="heading" aria-level={1} className="flex items-center gap-2 flex-wrap">
      <span className="sr-only">Harfhane</span>
      <div aria-hidden="true" className="flex items-center gap-1.5">
        {HERO_LETTERS.map(({ letter, variant }) => (
          <LetterTile key={letter} letter={letter} variant={variant} />
        ))}
      </div>
      <span aria-hidden="true" className="font-display font-extrabold text-3xl sm:text-5xl text-text-primary">
        hane
      </span>
    </div>
  );
}

export default HeroTiles;
