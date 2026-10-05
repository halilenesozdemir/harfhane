import { fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Keyboard } from './Keyboard';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

async function renderKeyboard(keyboardStatus: Record<string, 'correct' | 'present' | 'absent' | null> = {}) {
  const onLetter = jest.fn();
  const onDelete = jest.fn();
  const onSubmit = jest.fn();
  await renderWithTheme(
    <Keyboard keyboardStatus={keyboardStatus} onLetter={onLetter} onDelete={onDelete} onSubmit={onSubmit} />,
  );
  return { onLetter, onDelete, onSubmit };
}

describe('Keyboard', () => {
  it('should call onLetter with İ when the İ key is pressed', async () => {
    const { onLetter } = await renderKeyboard();
    fireEvent.press(screen.getByLabelText('İ'));
    expect(onLetter).toHaveBeenCalledWith('İ');
  });

  it('should call onLetter with I when the I key is pressed', async () => {
    const { onLetter } = await renderKeyboard();
    fireEvent.press(screen.getByLabelText('I'));
    expect(onLetter).toHaveBeenCalledWith('I');
  });

  it('should call onDelete when the backspace key is pressed', async () => {
    const { onDelete } = await renderKeyboard();
    fireEvent.press(screen.getByLabelText('Sil'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit when the enter key is pressed', async () => {
    const { onSubmit } = await renderKeyboard();
    fireEvent.press(screen.getByLabelText('Gönder'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should reflect keyboardStatus precedence on key color', async () => {
    await renderKeyboard({ A: 'correct' });
    const style = flattenStyle(screen.getByLabelText('A').props.style);
    expect(style.backgroundColor).toBe(themes.light.correct);
  });

  it('should use the default key color when a letter has no status', async () => {
    await renderKeyboard();
    const style = flattenStyle(screen.getByLabelText('A').props.style);
    expect(style.backgroundColor).toBe(themes.light.keyBg);
  });
});
