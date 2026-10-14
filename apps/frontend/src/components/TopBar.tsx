interface TopBarProps {
  /** Brand mark on home, back button on game screens. */
  left: React.ReactNode;
  /** Wordmark on home, mode title on game screens. */
  center?: React.ReactNode;
  /** Streak chip slot; home only. */
  streak?: React.ReactNode;
  /** Icon buttons (help, stats, settings, ...). */
  actions: React.ReactNode;
}

// Shared top bar shell (R2): centres every surface's header in the same
// 1200px container DesktopShell uses for the three-column layout, so
// nothing on wide screens is pinned to the window edges (012-AE3).
function TopBar({ left, center, streak, actions }: TopBarProps): React.JSX.Element {
  return (
    <header className="w-full border-b border-border-color bg-bg-primary">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 shrink-0">{left}</div>
        {center && <div className="flex-1 min-w-0">{center}</div>}
        {streak && <div className="shrink-0">{streak}</div>}
        <div className="flex items-center gap-0.5 shrink-0 ml-auto">{actions}</div>
      </div>
    </header>
  );
}

export default TopBar;
