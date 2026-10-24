type ExampleStatus = 'correct' | 'present' | 'absent';

interface ExampleTileProps {
  letter: string;
  status?: ExampleStatus;
}

const STATUS_CLASSES: Record<ExampleStatus, string> = {
  correct: 'bg-correct text-correct-fg shadow-depth-correct',
  present: 'bg-present text-present-fg shadow-depth-present',
  absent: 'bg-absent text-absent-fg shadow-depth-absent',
};

function ExampleTile({ letter, status }: ExampleTileProps): React.JSX.Element {
  const stateClasses = status
    ? STATUS_CLASSES[status]
    : 'bg-tile-empty-bg border-2 border-tile-filled text-text-primary shadow-depth-tile';

  return (
    <span className={`w-9 h-9 rounded-key flex items-center justify-center font-display font-extrabold text-base ${stateClasses}`}>
      {letter}
    </span>
  );
}

/** How-to-play panel beside the mode cards on wide screens (R3), stacked below them on phones. */
function HowToPanel(): React.JSX.Element {
  return (
    <aside aria-label="Nasıl oynanır" className="w-full bg-bg-secondary border border-border-color rounded-tile shadow-depth-surface p-6 flex flex-col gap-4">
      <h2 className="font-display font-extrabold text-xl text-text-primary">Nasıl oynanır</h2>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          <ExampleTile letter="K" status="correct" />
          <ExampleTile letter="A" />
          <ExampleTile letter="L" />
          <ExampleTile letter="E" />
          <ExampleTile letter="M" />
        </div>
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">K</strong> kelimede var ve doğru yerde.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          <ExampleTile letter="S" />
          <ExampleTile letter="İ" status="present" />
          <ExampleTile letter="M" status="absent" />
          <ExampleTile letter="İ" />
          <ExampleTile letter="T" />
        </div>
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">İ</strong> kelimede var ama başka yerde.{' '}
          <strong className="text-text-primary">M</strong> kelimede hiç yok.
        </p>
      </div>

      <p className="text-sm text-text-secondary">Altı tahmin hakkın var. Takılırsan bir harf ipucu alabilirsin.</p>
    </aside>
  );
}

export default HowToPanel;
