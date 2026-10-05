import { act, fireEvent, screen } from '@testing-library/react-native';
import { HowToPlayScreen } from './HowToPlayScreen';
import { renderWithTheme } from '../test-utils/render-with-theme';

describe('HowToPlayScreen', () => {
  it('should render the Turkish rules text', async () => {
    await renderWithTheme(<HowToPlayScreen onClose={() => undefined} />);
    expect(screen.getByText('Nasıl Oynanır?')).toBeTruthy();
    expect(screen.getByText('Gizli kelimeyi 6 denemede tahmin edin.')).toBeTruthy();
    expect(screen.getByText('Her gün yeni bir kelime gelir!')).toBeTruthy();
  });

  it('should call onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    await renderWithTheme(<HowToPlayScreen onClose={onClose} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Kapat'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
