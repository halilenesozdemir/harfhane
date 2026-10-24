import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SharePreview from './SharePreview';

describe('SharePreview', () => {
  it('should render exactly the given share text', () => {
    const shareText = ['Harfhane · 24 Ekim · 5 harf', '3/6 · Seri 4', '', '⚪🟡⚪⚪🟢', '🟢🟢⚪🟡⚪', '🟢🟢🟢🟢🟢', '', 'harfhane.app'].join(
      '\n'
    );
    const { getByTestId } = render(<SharePreview shareText={shareText} />);
    expect(getByTestId('share-preview-text')).toHaveTextContent('Harfhane · 24 Ekim · 5 harf');
    expect(getByTestId('share-preview-text').textContent).toBe(shareText);
  });

  it('should never render a colored tile grid element', () => {
    const shareText = 'Harfhane · Sınırsız · 5 harf';
    const { container } = render(<SharePreview shareText={shareText} />);
    expect(container.querySelectorAll('[data-testid="share-preview-tile"]')).toHaveLength(0);
  });
});
