import { X } from 'lucide-react';
import type { ModalProps } from '../types';

const Modal = ({ isOpen, onClose, title, children }: ModalProps): React.JSX.Element | null => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Modal Content */}
      <div 
        className="relative bg-bg-secondary rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-border-color"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-tile-empty rounded-md transition-colors"
            aria-label="Kapat"
          >
            <X size={24} className="text-text-primary" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
