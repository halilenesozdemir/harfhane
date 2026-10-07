import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TopBar } from './TopBar';
import { TOP_BAR_HEIGHT } from './layout';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('TopBar', () => {
  it('should be 64 dp tall (B1)', async () => {
    await renderWithTheme(<TopBar title="Günlük" testID="bar" />);
    const style = flattenStyle(screen.getByTestId('bar').props.style);
    expect(style.height).toBe(TOP_BAR_HEIGHT);
  });

  it('should expose the title with accessibilityRole header', async () => {
    await renderWithTheme(<TopBar title="İstatistikler" />);
    expect(screen.getByLabelText('İstatistikler').props.accessibilityRole).toBe('header');
  });

  it('should combine the title and chip into one header label without concatenating the string (B3)', async () => {
    await renderWithTheme(<TopBar title="Günlük" chip="5 harf" />);
    expect(screen.getByLabelText('Günlük, 5 harf')).toBeTruthy();
    expect(screen.getByText('Günlük')).toBeTruthy();
    expect(screen.getByText('5 harf')).toBeTruthy();
  });

  it('should render the given leading element', async () => {
    await renderWithTheme(<TopBar title="Günlük" leading={<Text testID="back-icon">back</Text>} />);
    expect(screen.getByTestId('back-icon')).toBeTruthy();
  });

  it('should keep the title centred with a spacer when there is no trailing action (B4)', async () => {
    await renderWithTheme(<TopBar title="Günlük" testID="bar" />);
    const bar = screen.getByTestId('bar');
    expect(bar.children.length).toBe(3);
  });
});
