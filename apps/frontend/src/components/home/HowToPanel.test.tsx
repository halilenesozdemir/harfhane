import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HowToPanel from './HowToPanel';

describe('HowToPanel', () => {
  it('should expose a landmark labelled Nasıl oynanır', () => {
    render(<HowToPanel />);
    expect(screen.getByRole('complementary', { name: 'Nasıl oynanır' })).toBeInTheDocument();
  });

  it('should explain the correct, present and absent tile states', () => {
    render(<HowToPanel />);
    expect(screen.getByText(/doğru yerde/)).toBeInTheDocument();
    expect(screen.getByText(/başka yerde/)).toBeInTheDocument();
    expect(screen.getByText(/hiç yok/)).toBeInTheDocument();
  });
});
