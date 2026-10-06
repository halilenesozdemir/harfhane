import { themes } from '@harfhane/ui-tokens';
import { HintControl } from './HintControl';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('HintControl', () => {
  it('(011-R5) should border the revealed-hint pill with surfaceBorder, not brand', async () => {
    const { findByTestId } = await renderWithTheme(
      <HintControl canReveal={false} hints={[{ position: 0, letter: 'A' }]} isUsed={false} onReveal={jest.fn()} />,
    );
    const pill = await findByTestId('hint-text');
    const style = flattenStyle(pill.props.style);
    expect(style.borderColor).toBe(themes.light.surfaceBorder);
    expect(style.borderColor).not.toBe(themes.light.brand);
  });
});
