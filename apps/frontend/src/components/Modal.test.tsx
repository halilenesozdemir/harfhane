import { useState } from 'react';
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

// A trigger-button-then-modal harness: the only way to prove focus returns to
// whatever had it before the modal opened, rather than just landing somewhere.
function TriggerAndModal(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Trigger</button>
      {isOpen && (
        <Modal isOpen onClose={() => setIsOpen(false)} title="Test modal" variant="sheet">
          <button>First</button>
        </Modal>
      )}
    </div>
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
    // The sheet's own close button is the panel's last focusable control.
    const close = screen.getByLabelText('Kapat');
    close.focus();
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
  });

  it('should trap Shift+Tab focus inside the panel, wrapping from the first control to the last', () => {
    renderModal(vi.fn(), 'sheet');
    const first = screen.getByText('First');
    first.focus();
    expect(first).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByLabelText('Kapat')).toHaveFocus();
  });

  it('should return focus to the trigger button once the modal closes', () => {
    render(<TriggerAndModal />);
    const trigger = screen.getByText('Trigger');
    trigger.focus();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    expect(screen.getByText('First')).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });

  it('should render no header title for the sheet variant', () => {
    renderModal(vi.fn(), 'sheet');
    expect(screen.queryByText('Test modal')).not.toBeInTheDocument();
  });

  it('should close the sheet variant from its visible Kapat button', () => {
    const onClose = vi.fn();
    renderModal(onClose, 'sheet');
    fireEvent.click(screen.getByLabelText('Kapat'));
    expect(onClose).toHaveBeenCalledTimes(1);
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
