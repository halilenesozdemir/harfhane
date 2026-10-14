import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Key from './Key';

describe('Key', () => {
  it('should read "Gönder" for the enter key, in the brand colour', () => {
    render(<Key keyValue="ENTER" onClick={vi.fn()} isWide />);
    const button = screen.getByRole('button', { name: 'Gönder' });
    expect(button).toHaveTextContent('Gönder');
    expect(button.className).toContain('bg-brand');
    expect(button.className).toContain('text-brand-fg');
  });

  it('should read "Sil" for the backspace key with aria-label "Harf sil"', () => {
    render(<Key keyValue="BACKSPACE" onClick={vi.fn()} isWide />);
    const button = screen.getByRole('button', { name: 'Harf sil' });
    expect(button).toHaveTextContent('Sil');
  });

  it('should call onClick with the raw key value, not the display label', () => {
    const onClick = vi.fn();
    render(<Key keyValue="ENTER" onClick={onClick} isWide />);
    screen.getByRole('button', { name: 'Gönder' }).click();
    expect(onClick).toHaveBeenCalledWith('ENTER');
  });

  it('should render a letter key with its own letter as both label and aria-label', () => {
    render(<Key keyValue="A" onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'A' })).toHaveTextContent('A');
  });

  it('should have a solid bottom depth shadow class for a default letter key', () => {
    render(<Key keyValue="A" onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'A' }).className).toContain('shadow-depth-key');
  });
});
