import { act, fireEvent, screen } from '@testing-library/react-native';
import { HowToPlayScreen } from './HowToPlayScreen';
import { renderWithTheme } from '../test-utils/render-with-theme';

describe('HowToPlayScreen', () => {
  it('should render the Turkish rules text', async () => {
    await renderWithTheme(<HowToPlayScreen onClose={() => undefined} />);
    expect(screen.getByText('Nasıl oynanır')).toBeTruthy();
    expect(screen.getByText('Gizli kelimeyi 6 denemede tahmin et.')).toBeTruthy();
    expect(screen.getByText('Her gün yeni bir kelime gelir!')).toBeTruthy();
  });

  it('should call onClose when the top bar back button is pressed', async () => {
    const onClose = jest.fn();
    await renderWithTheme(<HowToPlayScreen onClose={onClose} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Geri'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show a primary "Oynamaya başla" button and no back button on first launch (011-AE5)', async () => {
    const onClose = jest.fn();
    await renderWithTheme(<HowToPlayScreen onClose={onClose} isFirstLaunch />);
    expect(screen.queryByLabelText('Geri')).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Oynamaya başla'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
