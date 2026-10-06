import { screen, waitFor, within } from '@testing-library/react-native';
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

  it('should use a dashed brand border and a faded letter when the tile is a hint placeholder', async () => {
    await renderWithTheme(<Tile letter="L" status={null} isFilled={false} isHint />);
    const tile = screen.getByLabelText('L, ipucu');
    const style = flattenStyle(tile.props.style);
    expect(style.borderColor).toBe(themes.light.brand);
    expect(style.borderStyle).toBe('dashed');
    expect(style.backgroundColor).not.toBe(themes.light.correct);
    expect(style.backgroundColor).not.toBe(themes.light.present);
    const letterStyle = flattenStyle(within(tile).getByText('L').props.style);
    expect(letterStyle.opacity).toBe(0.75);
  });

  it('should show a typed letter at full opacity once it replaces the hint placeholder', async () => {
    await renderWithTheme(<Tile letter="K" status={null} isFilled isHint={false} />);
    const letterStyle = flattenStyle(within(screen.getByLabelText('K')).getByText('K').props.style);
    expect(letterStyle.opacity).toBeUndefined();
  });
});
