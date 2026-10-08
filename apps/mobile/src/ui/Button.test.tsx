import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { Button } from './Button';
import { DEPTH } from './layout';
import { ThemeProvider } from '../ThemeProvider';
import { createMemoryStore, flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import type { KeyValueStore } from '../game/game-storage';

function wrap(store: KeyValueStore, element: React.ReactElement) {
  return (
    <ThemeProvider store={store} waitForStoredTheme={false}>
      {element}
    </ThemeProvider>
  );
}

describe('Button', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should use the brand fill and brandFg label colour for the primary variant (C1)', async () => {
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} testID="btn" />);
    const faceStyle = flattenStyle(screen.getByTestId('btn-face').props.style);
    const labelStyle = flattenStyle(screen.getByText('Oyna').props.style);
    expect(faceStyle.backgroundColor).toBe(themes.light.brand);
    expect(labelStyle.color).toBe(themes.light.brandFg);
  });

  it('should use the surface fill and text label colour with a border for the secondary variant (C1)', async () => {
    await renderWithTheme(<Button label="Yeni kelime" onPress={() => undefined} variant="secondary" testID="btn" />);
    const faceStyle = flattenStyle(screen.getByTestId('btn-face').props.style);
    const labelStyle = flattenStyle(screen.getByText('Yeni kelime').props.style);
    expect(faceStyle.backgroundColor).toBe(themes.light.surface);
    expect(faceStyle.borderColor).toBe(themes.light.surfaceBorder);
    expect(labelStyle.color).toBe(themes.light.text);
  });

  it('should use a transparent fill and brand label colour at body size for the tertiary variant (C1)', async () => {
    await renderWithTheme(<Button label="Tümünü gör" onPress={() => undefined} variant="tertiary" testID="btn" />);
    const labelStyle = flattenStyle(screen.getByText('Tümünü gör').props.style);
    expect(labelStyle.color).toBe(themes.light.brand);
    expect(labelStyle.fontSize).toBe(14);
  });

  it('should render no back layer for the tertiary variant (no depth)', async () => {
    await renderWithTheme(<Button label="Tümünü gör" onPress={() => undefined} variant="tertiary" testID="btn" />);
    expect(screen.queryByTestId('btn-back')).toBeNull();
  });

  it('should offset the back layer by the resting depth so the edge shows below the face at rest (D2)', async () => {
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} testID="btn" />);
    const backStyle = flattenStyle(screen.getByTestId('btn-back').props.style);
    expect(backStyle.top).toBe(DEPTH.md);
  });

  it('should call onPress when pressed', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Oyna" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Oyna'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should expose accessibilityRole="button" on the pressable path', async () => {
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} />);
    expect(screen.getByLabelText('Oyna').props.accessibilityRole).toBe('button');
  });

  it('should use the brandDepth colour for the primary back layer and surfaceDepth for secondary', async () => {
    const { rerender } = await renderWithTheme(<Button label="Oyna" onPress={() => undefined} testID="btn" />);
    expect(flattenStyle(screen.getByTestId('btn-back').props.style).backgroundColor).toBe(themes.light.brandDepth);

    await rerender(<ThemeProvider store={createMemoryStore()} waitForStoredTheme={false}><Button label="Yeni kelime" onPress={() => undefined} variant="secondary" testID="btn" /></ThemeProvider>);
    expect(flattenStyle(screen.getByTestId('btn-back').props.style).backgroundColor).toBe(themes.light.surfaceDepth);
  });

  it('should set the primary face height to 52 dp', async () => {
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} testID="btn" />);
    expect(flattenStyle(screen.getByTestId('btn-face').props.style).height).toBe(52);
  });

  it('should lower opacity and drop the back layer when disabled (K3)', async () => {
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} disabled testID="btn" />);
    const target = screen.getByLabelText('Oyna');
    expect(target.props.accessibilityState).toEqual({ disabled: true });
    expect(flattenStyle(target.props.style).opacity).toBe(0.5);
    expect(screen.queryByTestId('btn-back')).toBeNull();
  });

  it('should keep the outer height at 56 for both enabled and disabled primary buttons (D2)', async () => {
    const { rerender } = await renderWithTheme(<Button label="Oyna" onPress={() => undefined} testID="btn" />);
    const enabledHeight = flattenStyle(screen.getByTestId('btn').props.style).height;
    expect(enabledHeight).toBe(56);

    await rerender(<ThemeProvider store={createMemoryStore()} waitForStoredTheme={false}><Button label="Oyna" onPress={() => undefined} disabled testID="btn" /></ThemeProvider>);
    const disabledHeight = flattenStyle(screen.getByTestId('btn').props.style).height;
    expect(disabledHeight).toBe(56);
  });

  it('should not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Oyna" onPress={onPress} disabled />);
    fireEvent.press(screen.getByLabelText('Oyna'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should keep the outer height constant while pressed (D2/M3)', async () => {
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} testID="btn" />);
    const restHeight = flattenStyle(screen.getByTestId('btn').props.style).height as number;

    fireEvent(screen.getByLabelText('Oyna'), 'pressIn');

    const pressedHeight = flattenStyle(screen.getByTestId('btn').props.style).height as number;
    expect(pressedHeight).toBe(restHeight);
    expect(restHeight).toBeGreaterThan(0);
  });

  it('should move the face down via transform only, never via borderBottomWidth (D2)', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} testID="btn" />);

    await act(async () => fireEvent(screen.getByLabelText('Oyna'), 'pressIn'));

    const faceStyle = flattenStyle(screen.getByTestId('btn-face').props.style);
    expect(faceStyle.borderBottomWidth).toBeUndefined();
    expect(timingSpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue: 3, useNativeDriver: true }));
  });

  it('should reset the pressed depth when disabled mid-press, instead of staying visually pressed (K3)', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    const store = createMemoryStore();
    const { rerender } = await render(wrap(store, <Button label="Oyna" onPress={() => undefined} testID="btn" />));

    await act(async () => fireEvent(screen.getByLabelText('Oyna'), 'pressIn'));
    expect(timingSpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: 3 }));

    await rerender(wrap(store, <Button label="Oyna" onPress={() => undefined} disabled testID="btn" />));

    expect(timingSpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: 0 }));
  });

  it('should render decoratively (no Pressable, hidden from accessibility) when onPress is omitted, sinking with an external pressed prop (CA2)', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    const store = createMemoryStore();
    const { rerender } = await render(wrap(store, <Button label="Oyna" testID="btn" />));

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('btn', { includeHiddenElements: true }).props.importantForAccessibility).toBe('no-hide-descendants');

    await rerender(wrap(store, <Button label="Oyna" testID="btn" pressed />));

    expect(timingSpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: 3 }));
  });
});
