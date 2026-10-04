import Modal from './Modal';
import type { TileStatus } from '../types';

interface ExampleTileProps {
  letter: string;
  status?: TileStatus;
}

const EXAMPLE_STATUS_CLASSES: Record<NonNullable<TileStatus>, string> = {
  correct: 'bg-correct text-correct-fg shadow-depth-correct',
  present: 'bg-present text-present-fg shadow-depth-present',
  absent: 'bg-absent text-absent-fg shadow-depth-absent',
};

const ExampleTile = ({ letter, status }: ExampleTileProps): React.JSX.Element => {
  const stateClasses = status
    ? EXAMPLE_STATUS_CLASSES[status]
    : 'bg-tile-empty-bg border-2 border-tile-filled text-text-primary shadow-depth-tile';

  return (
    <div className={`w-10 h-10 rounded-key flex items-center justify-center font-display text-xl font-extrabold ${stateClasses}`}>
      {letter}
    </div>
  );
};

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToPlayModal = ({ isOpen, onClose }: HowToPlayModalProps): React.JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nasıl Oynanır?">
      <div className="text-text-primary space-y-4">
        <p>
          Gizli kelimeyi 6 denemede tahmin edin.
        </p>

        <p className="text-text-secondary">
          Her tahmin, listeden geçerli bir kelime olmalıdır.
          Tahmini göndermek için Enter tuşuna basın.
        </p>
        
        <p className="text-text-secondary">
          Her tahminden sonra, kutucukların rengi harflerin doğru kelimeye ne kadar
          yakın olduğunu gösterecek şekilde değişecektir.
        </p>

        <hr className="border-border-color" />

        <div>
          <p className="font-bold mb-2">Örnekler</p>

          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              <ExampleTile letter="S" status="correct" />
              <ExampleTile letter="A" />
              <ExampleTile letter="B" />
              <ExampleTile letter="A" />
              <ExampleTile letter="H" />
            </div>
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">S</strong> harfi kelimede var ve doğru yerde.
            </p>
          </div>

          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              <ExampleTile letter="S" />
              <ExampleTile letter="A" status="present" />
              <ExampleTile letter="B" />
              <ExampleTile letter="I" />
              <ExampleTile letter="R" />
            </div>
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">A</strong> harfi kelimede var ama yanlış yerde.
            </p>
          </div>

          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              <ExampleTile letter="Ş" />
              <ExampleTile letter="Ü" />
              <ExampleTile letter="K" status="absent" />
              <ExampleTile letter="Ü" />
              <ExampleTile letter="R" />
            </div>
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">K</strong> harfi kelimede hiç yok.
            </p>
          </div>
        </div>

        <hr className="border-border-color" />

        <p className="text-sm text-text-secondary">
          Her gün yeni bir kelime gelir!
        </p>
      </div>
    </Modal>
  );
};

export default HowToPlayModal;
