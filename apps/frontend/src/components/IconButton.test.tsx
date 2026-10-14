import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HelpCircle } from 'lucide-react';
import IconButton from './IconButton';

describe('IconButton', () => {
  it('should expose the given label as its accessible name', () => {
    render(<IconButton icon={<HelpCircle />} label="Nasıl Oynanır" onClick={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Nasıl Oynanır' })).toBeInTheDocument();
  });

  it('should call onClick when pressed', () => {
    const onClick = vi.fn();
    render(<IconButton icon={<HelpCircle />} label="Ayarlar" onClick={onClick} />);
    screen.getByRole('button', { name: 'Ayarlar' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should size the hit area to at least 44x44 px (w-11 h-11, 012-AE3)', () => {
    render(<IconButton icon={<HelpCircle />} label="İstatistikler" onClick={() => undefined} />);
    const button = screen.getByRole('button', { name: 'İstatistikler' });
    expect(button.className).toContain('w-11');
    expect(button.className).toContain('h-11');
  });

  it('should use a pointer cursor', () => {
    render(<IconButton icon={<HelpCircle />} label="Ayarlar" onClick={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Ayarlar' }).className).toContain('cursor-pointer');
  });
});
