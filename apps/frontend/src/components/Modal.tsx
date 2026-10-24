import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ModalProps } from '../types';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Focus trap: moves focus into the panel on open, cycles Tab/Shift+Tab between its first and
// last focusable control, closes on Escape, and restores focus to whatever had it before the
// modal opened.
function useModalFocusTrap(
  isOpen: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLDivElement | null>
): void {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
    (focusables[0] ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose, panelRef]);
}

const Modal = ({ isOpen, onClose, title, children, variant = 'dialog' }: ModalProps): React.JSX.Element | null => {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, onClose, panelRef);

  if (!isOpen) return null;

  const isSheet = variant === 'sheet';

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center p-0 sm:p-4 animate-fade-in ${isSheet ? 'items-end sm:items-center' : 'items-center'}`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Modal content */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isSheet ? title : undefined}
        tabIndex={-1}
        className={
          isSheet
            ? 'relative bg-bg-secondary w-full sm:max-w-md sm:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl border-t sm:border border-border-color flex flex-col outline-none'
            : 'relative bg-bg-secondary rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-border-color outline-none'
        }
        onClick={e => e.stopPropagation()}
      >
        {isSheet ? (
          <span aria-hidden="true" className="self-center w-10 h-1 rounded-full bg-border-color mt-3 sm:hidden" />
        ) : (
          <div className="flex items-center justify-between p-4 border-b border-border-color">
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-tile-empty rounded-md transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X size={24} className="text-text-primary" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-4">
          {children}
        </div>

        {/* A sheet also closes on backdrop click and Escape, but neither is visible: without this
            button a player on desktop felt stuck behind the game-over sheet. It comes after the body
            in DOM order so opening the sheet focuses its content, not the close button. */}
        {isSheet && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 hover:bg-tile-empty rounded-md transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X size={22} className="text-text-secondary" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Modal;
