import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal';

function renderModal(onClose: () => void, variant?: 'dialog' | 'sheet') {
  return render(
    <Modal isOpen onClose={onClose} title="Test modal" variant={variant}>
      <button>First</button>
      <button>Second</button>
    </Modal>
  );
}

describe('Modal', () => {
  it('should call onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should move focus into the panel when opened', () => {
    renderModal(vi.fn(), 'sheet');
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('should trap Tab focus inside the panel, wrapping from the last control to the first', () => {
    renderModal(vi.fn(), 'sheet');
    const first = screen.getByText('First');
    const second = screen.getByText('Second');
    second.focus();
    expect(second).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
  });

  it('should render a grab handle and no header for the sheet variant', () => {
    renderModal(vi.fn(), 'sheet');
    expect(screen.queryByText('Test modal')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Kapat')).not.toBeInTheDocument();
  });

  it('should render a visible header and title for the default dialog variant', () => {
    renderModal(vi.fn());
    expect(screen.getByText('Test modal')).toBeInTheDocument();
    expect(screen.getByLabelText('Kapat')).toBeInTheDocument();
  });

  it('should close the dialog variant when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderModal(onClose);
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
