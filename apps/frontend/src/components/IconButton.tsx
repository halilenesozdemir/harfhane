interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

// w-11 h-11 is Tailwind's 2.75rem (44px) step, matching R2's >=44px hit area
// without a one-off inline size.
function IconButton({ icon, label, onClick, className = '' }: IconButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`w-11 h-11 flex items-center justify-center rounded-full text-text-primary hover:bg-tile-empty transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-correct ${className}`}
    >
      {icon}
    </button>
  );
}

export default IconButton;
