import Key from './Key';

// Türkçe Q klavye düzeni
const KEYBOARD_ROWS = [
  ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
  ['ENTER', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', 'BACKSPACE'],
];

const Keyboard = ({ onKeyPress, keyboardStatus }) => {
  const handleKeyClick = (key) => {
    onKeyPress(key);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-2 pb-4">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5 mb-1.5">
          {row.map((key) => (
            <Key
              key={key}
              keyValue={key}
              onClick={handleKeyClick}
              status={keyboardStatus[key]}
              isWide={key === 'ENTER' || key === 'BACKSPACE'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
