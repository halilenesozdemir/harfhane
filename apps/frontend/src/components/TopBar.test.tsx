import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TopBar from './TopBar';

describe('TopBar', () => {
  it('should render the left, center, streak and actions slots', () => {
    render(
      <TopBar
        left={<span>sol</span>}
        center={<span>orta</span>}
        streak={<span>3 gün seri</span>}
        actions={<button>eylem</button>}
      />
    );
    expect(screen.getByText('sol')).toBeInTheDocument();
    expect(screen.getByText('orta')).toBeInTheDocument();
    expect(screen.getByText('3 gün seri')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'eylem' })).toBeInTheDocument();
  });

  it('should render without a streak slot', () => {
    render(<TopBar left={<span>sol</span>} actions={<button>eylem</button>} />);
    expect(screen.getByText('sol')).toBeInTheDocument();
  });

  it('should keep its content inside a 1200px centred container (012-AE3)', () => {
    render(<TopBar left={<span>sol</span>} actions={<button>eylem</button>} />);
    const container = screen.getByText('sol').closest('div[class*="max-w-"]');
    expect(container).not.toBeNull();
    expect(container?.className).toContain('max-w-[1200px]');
    expect(container?.className).toContain('mx-auto');
  });

  it('should render as a banner landmark', () => {
    render(<TopBar left={<span>sol</span>} actions={<button>eylem</button>} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
