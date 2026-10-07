import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { Card } from './Card';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('Card', () => {
  it('should have no depth edge when static (D3)', async () => {
    await renderWithTheme(
      <Card testID="daily-stats">
        <Text>Oyun 12</Text>
      </Card>,
    );
    const style = flattenStyle(screen.getByTestId('daily-stats').props.style);
    expect(style.borderBottomWidth).toBeUndefined();
    expect(style.backgroundColor).toBe(themes.light.surface);
  });

  it('should have a depth edge when pressable (CA1)', async () => {
    await renderWithTheme(
      <Card testID="daily-card" onPress={() => undefined} accessibilityLabel="Günlük oyun, 5 harf, bugün çözüldü">
        <Text>Günlük</Text>
      </Card>,
    );
    const style = flattenStyle(screen.getByTestId('daily-card').props.style);
    expect(style.borderBottomWidth).toBeGreaterThan(0);
  });

  it('should use one accessibilityLabel describing content and state when pressable (CA2)', async () => {
    await renderWithTheme(
      <Card onPress={() => undefined} accessibilityLabel="Günlük oyun, 5 harf, bugün çözüldü">
        <Text>Günlük</Text>
      </Card>,
    );
    expect(screen.getByLabelText('Günlük oyun, 5 harf, bugün çözüldü').props.accessibilityRole).toBe('button');
  });

  it('should call onPress when the card is pressed', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Card onPress={onPress} accessibilityLabel="Sınırsız, oyna">
        <Text>Sınırsız</Text>
      </Card>,
    );
    fireEvent.press(screen.getByLabelText('Sınırsız, oyna'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
