import { fireEvent, render, screen } from '@testing-library/react-native';
import { CornerDownLeft, Delete } from 'lucide-react-native';
import { themes } from '@harfhane/ui-tokens';
import { Keyboard } from './Keyboard';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

interface SvgPathNode {
  readonly type: unknown;
  readonly props?: { readonly d?: string };
  readonly children?: readonly unknown[];
}

// Lucide icons resolve all the way down to RNSVGPath host nodes with a distinct `d`
// attribute per icon, which is how a testID query can tell CornerDownLeft apart from
// Delete (no icon-identity query exists on this RNTL version's lightweight instances).
function findSvgPathData(node: SvgPathNode): readonly string[] {
  const paths: string[] = [];
  if (node.type === 'RNSVGPath' && typeof node.props?.d === 'string') paths.push(node.props.d);
  for (const child of node.children ?? []) {
    if (typeof child === 'object' && child !== null) paths.push(...findSvgPathData(child as SvgPathNode));
  }
  return paths;
}

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

  it('should expose a stable testID per key for Maestro flows', async () => {
    await renderKeyboard();
    expect(screen.getByTestId('key-A')).toBeTruthy();
    expect(screen.getByTestId('key-ENTER')).toBeTruthy();
    expect(screen.getByTestId('key-BACKSPACE')).toBeTruthy();
  });

  it('should render the CornerDownLeft icon inside the Enter key and Delete inside the Backspace key', async () => {
    const [expectedEnterPath] = findSvgPathData((await render(<CornerDownLeft />)).toJSON() as SvgPathNode);
    const [expectedBackspacePath] = findSvgPathData((await render(<Delete />)).toJSON() as SvgPathNode);

    await renderKeyboard();
    const enterPaths = findSvgPathData(screen.getByTestId('key-ENTER') as unknown as SvgPathNode);
    const backspacePaths = findSvgPathData(screen.getByTestId('key-BACKSPACE') as unknown as SvgPathNode);

    expect(enterPaths).toContain(expectedEnterPath);
    expect(backspacePaths).toContain(expectedBackspacePath);
    expect(enterPaths).not.toContain(expectedBackspacePath);
  });

  it('should render a letter key as text, not an icon', async () => {
    await renderKeyboard();
    expect(screen.getByText('K')).toBeTruthy();
  });
});
