import { configure, resetToDefaults, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { HomeHero } from './HomeHero';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('HomeHero', () => {
  // The hero tiles use importantForAccessibility "no-hide-descendants" (each
  // letter has no accessibility meaning of its own; the row's own header
  // label covers it) — see through it here like DepthTile's own tests.
  beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
  afterAll(() => resetToDefaults());

  it('should render the H-A-R-F letters and the "hane" wordmark', async () => {
    await renderWithTheme(<HomeHero />);
    for (const letter of ['H', 'A', 'R', 'F']) {
      expect(screen.getByText(letter)).toBeTruthy();
    }
    expect(screen.getByText('hane')).toBeTruthy();
  });

  it('should colour each letter with the fg token matching its own fill (C1)', async () => {
    await renderWithTheme(<HomeHero />);
    for (const letter of ['H', 'R']) {
      expect(flattenStyle(screen.getByText(letter).props.style).color).toBe(themes.light.correctFg);
    }
    for (const letter of ['A', 'F']) {
      expect(flattenStyle(screen.getByText(letter).props.style).color).toBe(themes.light.presentFg);
    }
  });

  it('should expose the row as a single header labelled "Harfhane", not spelled letter by letter', async () => {
    await renderWithTheme(<HomeHero />);
    const hero = screen.getByTestId('home-hero');
    expect(hero.props.accessible).toBe(true);
    expect(hero.props.accessibilityRole).toBe('header');
    expect(hero.props.accessibilityLabel).toBe('Harfhane');
  });
});
