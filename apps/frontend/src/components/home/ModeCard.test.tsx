import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModeCard from './ModeCard';

describe('ModeCard', () => {
  it('should call onClick when the card button is pressed', () => {
    const onClick = vi.fn();
    render(<ModeCard icon={<span />} iconVariant="correct" title="Günlük" description="Bugünün kelimesi" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: /Günlük/ }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should render the badge inside the button and the footer outside it', () => {
    render(
      <ModeCard
        icon={<span />}
        iconVariant="present"
        title="Sınırsız"
        description="Dilediğin kadar oyna"
        badge={<span>Rozet</span>}
        footer={<div data-testid="footer">Alt bilgi</div>}
        onClick={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: /Sınırsız/ });
    expect(button).toContainElement(screen.getByText('Rozet'));
    expect(button).not.toContainElement(screen.getByTestId('footer'));
  });
});
