import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Keyboard from './Keyboard';

describe('Keyboard', () => {
  it('should render the Enter and Sil keys with no fixed pixel width (012-AE5)', () => {
    render(<Keyboard onKeyPress={vi.fn()} keyboardStatus={{}} />);

    const enterKey = screen.getByRole('button', { name: 'Gönder' });
    const backspaceKey = screen.getByRole('button', { name: 'Harf sil' });

    // Fixed min-width classes (e.g. "min-w-[65px]") would stop the row from
    // shrinking to fit a 360px-wide screen; the keys must size from flex only.
    expect(enterKey.className).not.toMatch(/min-w-\[/);
    expect(backspaceKey.className).not.toMatch(/min-w-\[/);
  });

  it('should call onKeyPress with a letter when a letter key is clicked', () => {
    const onKeyPress = vi.fn();
    render(<Keyboard onKeyPress={onKeyPress} keyboardStatus={{}} />);

    screen.getByRole('button', { name: 'A' }).click();

    expect(onKeyPress).toHaveBeenCalledWith('A');
  });
});
