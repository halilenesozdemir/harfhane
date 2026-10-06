import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GameHint from './GameHint';

describe('GameHint', () => {
  it('should render nothing when hintAvailable is false', () => {
    render(
      <GameHint hint={null} hintUsed={false} hintAvailable={false} gameStatus="playing" onRevealHint={vi.fn()} />
    );
    expect(screen.queryByText('İpucu göster')).toBeNull();
  });

  it('should render nothing when gameStatus is not playing', () => {
    render(
      <GameHint hint={null} hintUsed={false} hintAvailable={true} gameStatus="won" onRevealHint={vi.fn()} />
    );
    expect(screen.queryByText('İpucu göster')).toBeNull();
  });

  it('should show the enabled button when no hint has been revealed', () => {
    render(
      <GameHint hint={null} hintUsed={false} hintAvailable={true} gameStatus="playing" onRevealHint={vi.fn()} />
    );
    const button = screen.getByRole('button', { name: 'İpucu göster' });
    expect(button).not.toBeDisabled();
  });

  it('should show the disabled button when the allowance is used with no hint stored', () => {
    render(
      <GameHint hint={null} hintUsed={true} hintAvailable={true} gameStatus="playing" onRevealHint={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'İpucu kullanıldı' })).toBeDisabled();
  });

  it('should show the hint pill text when a hint is present', () => {
    render(
      <GameHint
        hint={{ position: 2, letter: 'L' }}
        hintUsed={true}
        hintAvailable={true}
        gameStatus="playing"
        onRevealHint={vi.fn()}
      />
    );
    expect(screen.getByText('3. harf: L')).toBeInTheDocument();
  });
});
