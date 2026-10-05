import { screen, waitFor } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Tile } from './Tile';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('Tile', () => {
  it('should use dark high-contrast tokens when both are stored', async () => {
    await renderWithTheme(<Tile letter="K" status="correct" isFilled />, { 'harfhane:theme': '"dark"', 'harfhane:high-contrast': 'true' });
    await waitFor(() => expect(flattenStyle(screen.getByLabelText('K, doğru yerde').props.style).backgroundColor).toBe(themes['high-contrast'].correct));
  });

  it('should use the correct token color when status is correct', async () => {
    await renderWithTheme(<Tile letter="K" status="correct" isFilled />);
    const style = flattenStyle(screen.getByLabelText('K, doğru yerde').props.style);
    expect(style.backgroundColor).toBe(themes.light.correct);
  });

  it('should use the present token color when status is present', async () => {
    await renderWithTheme(<Tile letter="A" status="present" isFilled />);
    const style = flattenStyle(screen.getByLabelText('A, kelimede var').props.style);
    expect(style.backgroundColor).toBe(themes.light.present);
  });

  it('should use the absent token color when status is absent', async () => {
    await renderWithTheme(<Tile letter="L" status="absent" isFilled />);
    const style = flattenStyle(screen.getByLabelText('L, kelimede yok').props.style);
    expect(style.backgroundColor).toBe(themes.light.absent);
  });

  it('should use the filled border token color when the tile has a letter but no status', async () => {
    await renderWithTheme(<Tile letter="M" status={null} isFilled />);
    const style = flattenStyle(screen.getByLabelText('M').props.style);
    expect(style.borderColor).toBe(themes.light.tileFilledBorder);
  });

  it('should label an empty tile as boş', async () => {
    await renderWithTheme(<Tile letter="" status={null} isFilled={false} />);
    expect(screen.getByLabelText('boş')).toBeTruthy();
  });
});
