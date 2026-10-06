import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from './Header';

function noop() {
  return undefined;
}

describe('Header', () => {
  // (011-R5): the Android app icon's glyph is generated from the brand
  // token (apps/mobile/scripts/generate-brand-assets.mjs); the web logo
  // must use the same token, not bg-correct (green), so both surfaces
  // show one brand colour.
  it('(011-R5) should use the brand colour token for the logo button, not bg-correct', () => {
    render(<Header onTitleClick={noop} onHelpClick={noop} onStatsClick={noop} onSettingsClick={noop} />);
    const logoButton = screen.getByLabelText('Ana Sayfa');
    expect(logoButton.className).toMatch(/\bbg-brand\b/);
    expect(logoButton.className).not.toMatch(/\bbg-correct\b/);

    const logoGlyph = logoButton.querySelector('span');
    expect(logoGlyph?.className).toMatch(/\btext-brand-fg\b/);
  });

  it('should call onTitleClick when the logo or title is pressed', () => {
    const onTitleClick = vi.fn();
    render(<Header onTitleClick={onTitleClick} onHelpClick={noop} onStatsClick={noop} onSettingsClick={noop} />);
    screen.getByLabelText('Ana Sayfa').click();
    expect(onTitleClick).toHaveBeenCalledTimes(1);
  });
});
