import { configure, fireEvent, resetToDefaults, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { UnlimitedCard } from './UnlimitedCard';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

const WORD_LENGTH = 5;

describe('UnlimitedCard', () => {
  // The decorative icon tile and chevron use importantForAccessibility
  // "no-hide-descendants" (CA2/CA3); see through it here like DepthTile's tests.
  beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
  afterAll(() => resetToDefaults());

  it('should show a trailing chevron and no CTA button when the daily game is not finished', async () => {
    await renderWithTheme(<UnlimitedCard wordLength={WORD_LENGTH} isDailyFinished={false} onPress={() => undefined} />);
    expect(screen.getByTestId('unlimited-chevron')).toBeTruthy();
    expect(screen.queryByText('Sınırsız oyna')).toBeNull();
  });

  it('should replace the chevron with a primary "Sınırsız oyna" CTA once the daily game is finished (K1)', async () => {
    await renderWithTheme(<UnlimitedCard wordLength={WORD_LENGTH} isDailyFinished={true} onPress={() => undefined} />);
    expect(screen.queryByTestId('unlimited-chevron')).toBeNull();
    expect(flattenStyle(screen.getByText('Sınırsız oyna').props.style).color).toBe(themes.light.brandFg);
  });

  it('should carry the finished state in the accessibilityLabel', async () => {
    await renderWithTheme(<UnlimitedCard wordLength={WORD_LENGTH} isDailyFinished={true} onPress={() => undefined} />);
    expect(screen.getByLabelText(`Sınırsız mod, ${WORD_LENGTH} harf, yeni kelime oyna`)).toBeTruthy();
  });

  it('should not append the finished phrase to the accessibilityLabel when not finished', async () => {
    await renderWithTheme(<UnlimitedCard wordLength={WORD_LENGTH} isDailyFinished={false} onPress={() => undefined} />);
    expect(screen.getByLabelText(`Sınırsız mod, ${WORD_LENGTH} harf`)).toBeTruthy();
  });

  it('should call onPress when the card is pressed', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<UnlimitedCard wordLength={WORD_LENGTH} isDailyFinished={false} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('home-unlimited-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
