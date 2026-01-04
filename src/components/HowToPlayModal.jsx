import Modal from "./Modal";

const ExampleTile = ({ letter, status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case "correct":
        return "bg-correct";
      case "present":
        return "bg-present";
      case "absent":
        return "bg-absent";
      default:
        return "border-2 border-tile-empty";
    }
  };

  return (
    <div
      className={`w-10 h-10 flex items-center justify-center text-lg font-bold text-white ${getStatusClasses()}`}
    >
      {letter}
    </div>
  );
};

const HowToPlayModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nasıl Oynanır?">
      <div className="text-white space-y-4">
        <p>
          <strong>NURDLE</strong> kelimesini 6 denemede tahmin edin.
        </p>

        <p>
          Her tahmin, Risale-i Nur külliyatından 5 harfli geçerli bir kelime
          olmalıdır. Tahmini göndermek için Enter tuşuna basın.
        </p>

        <p>
          Her tahminden sonra, kutucukların rengi harflerin doğru kelimeye ne
          kadar yakın olduğunu gösterecek şekilde değişecektir.
        </p>

        <hr className="border-tile-empty" />

        <div>
          <p className="font-bold mb-2">Örnekler</p>

          {/* Örnek 1 - Doğru */}
          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              <ExampleTile letter="N" status="correct" />
              <ExampleTile letter="U" />
              <ExampleTile letter="R" />
              <ExampleTile letter="L" />
              <ExampleTile letter="U" />
            </div>
            <p className="text-sm text-gray-300">
              <strong>N</strong> harfi kelimede var ve doğru yerde.
            </p>
          </div>

          {/* Örnek 2 - Yanlış pozisyon */}
          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              <ExampleTile letter="S" />
              <ExampleTile letter="A" status="present" />
              <ExampleTile letter="B" />
              <ExampleTile letter="I" />
              <ExampleTile letter="R" />
            </div>
            <p className="text-sm text-gray-300">
              <strong>A</strong> harfi kelimede var ama yanlış yerde.
            </p>
          </div>

          {/* Örnek 3 - Yok */}
          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              <ExampleTile letter="Ş" />
              <ExampleTile letter="Ü" />
              <ExampleTile letter="K" status="absent" />
              <ExampleTile letter="Ü" />
              <ExampleTile letter="R" />
            </div>
            <p className="text-sm text-gray-300">
              <strong>K</strong> harfi kelimede hiç yok.
            </p>
          </div>
        </div>

        <hr className="border-tile-empty" />

        <p className="text-sm text-gray-300">
          Her gün yeni bir <strong>NURDLE</strong> kelimesi gelir!
        </p>

        <p className="text-sm text-gray-400 italic">
          Risale-i Nur külliyatından öğrenirken eğlenin.
        </p>
      </div>
    </Modal>
  );
};

export default HowToPlayModal;
