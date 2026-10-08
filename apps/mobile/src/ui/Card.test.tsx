import { act, fireEvent, screen } from '@testing-library/react-native';
import { Animated, Text } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { Card, type CardProps } from './Card';
import { DEPTH } from './layout';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

// Type-level check, never executed: accessibilityLabel is required whenever
// onPress is set, and forbidden otherwise (CA2). A regression here is a
// compile error caught by `pnpm run typecheck`, not a runtime assertion.
function assertCardPropsAreDiscriminated() {
  // @ts-expect-error - accessibilityLabel is required when onPress is set
  const missingLabel: CardProps = { onPress: () => undefined, children: null };
  // @ts-expect-error - accessibilityLabel is not allowed without onPress
  const strayLabel: CardProps = { accessibilityLabel: 'Sınırsız, oyna', children: null };
  void missingLabel;
  void strayLabel;
}
void assertCardPropsAreDiscriminated;

describe('Card', () => {
  it('should have no back layer when static, a 1 dp surfaceBorder edge (C4), RADIUS.lg (16), and 16 dp default padding (CA1, D3)', async () => {
    await renderWithTheme(
      <Card testID="daily-stats">
        <Text>Oyun 12</Text>
      </Card>,
    );
    const style = flattenStyle(screen.getByTestId('daily-stats').props.style);
    expect(style.backgroundColor).toBe(themes.light.surface);
    expect(style.borderBottomWidth).toBeUndefined();
    expect(screen.queryByTestId('daily-stats-back')).toBeNull();
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(themes.light.surfaceBorder);
    expect(style.borderRadius).toBe(16);
    expect(style.padding).toBe(16);
  });

  it('should render a back layer in surfaceDepth behind the face when pressable (CA1)', async () => {
    await renderWithTheme(
      <Card testID="daily-card" onPress={() => undefined} accessibilityLabel="Günlük oyun, 5 harf, bugün çözüldü">
        <Text>Günlük</Text>
      </Card>,
    );
    const backStyle = flattenStyle(screen.getByTestId('daily-card-back').props.style);
    expect(backStyle.backgroundColor).toBe(themes.light.surfaceDepth);
  });

  it('should offset the back layer by the resting depth so the edge shows below the face at rest (D2)', async () => {
    await renderWithTheme(
      <Card testID="daily-card" onPress={() => undefined} accessibilityLabel="Günlük oyun, 5 harf, bugün çözüldü">
        <Text>Günlük</Text>
      </Card>,
    );
    const backStyle = flattenStyle(screen.getByTestId('daily-card-back').props.style);
    expect(backStyle.top).toBe(DEPTH.md);
  });

  it('should animate the face down on pressIn and back to rest on pressOut via the motion constants (M1)', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderWithTheme(
      <Card testID="daily-card" onPress={() => undefined} accessibilityLabel="Günlük oyun, 5 harf, bugün çözüldü">
        <Text>Günlük</Text>
      </Card>,
    );

    await act(async () => fireEvent(screen.getByTestId('daily-card'), 'pressIn'));
    expect(timingSpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: DEPTH.md - 1, useNativeDriver: true }));

    await act(async () => fireEvent(screen.getByTestId('daily-card'), 'pressOut'));
    expect(timingSpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: 0, useNativeDriver: true }));
  });

  it('should reserve the resting depth as a constant outer paddingBottom, unaffected by press (D2/M3)', async () => {
    await renderWithTheme(
      <Card testID="daily-card" onPress={() => undefined} accessibilityLabel="Günlük oyun, 5 harf, bugün çözüldü">
        <Text>Günlük</Text>
      </Card>,
    );
    const restStyle = flattenStyle(screen.getByTestId('daily-card').props.style);
    expect(restStyle.paddingBottom).toBe(DEPTH.md);

    fireEvent(screen.getByTestId('daily-card'), 'pressIn');

    const pressedStyle = flattenStyle(screen.getByTestId('daily-card').props.style);
    expect(pressedStyle.paddingBottom).toBe(DEPTH.md);
  });

  it('should move the face down via transform only, never via borderBottomWidth (D2)', async () => {
    await renderWithTheme(
      <Card testID="daily-card" onPress={() => undefined} accessibilityLabel="Günlük oyun, 5 harf, bugün çözüldü">
        <Text>Günlük</Text>
      </Card>,
    );
    fireEvent(screen.getByTestId('daily-card'), 'pressIn');

    const faceStyle = flattenStyle(screen.getByTestId('daily-card-face').props.style);
    expect(faceStyle.borderBottomWidth).toBeUndefined();
    expect(faceStyle.transform).toBeDefined();
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
