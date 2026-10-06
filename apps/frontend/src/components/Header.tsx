import { HelpCircle, BarChart2, Settings } from 'lucide-react';
import type { HeaderProps } from '../types';

const Header = ({ onTitleClick, onHelpClick, onStatsClick, onSettingsClick, modeLabel }: HeaderProps): React.JSX.Element => {
  return (
    <header className="w-full border-b border-border-color py-3 px-4 bg-bg-primary">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Sol - Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTitleClick}
            className="w-8 h-8 bg-brand rounded-md flex items-center justify-center hover:bg-brand/90 transition-colors cursor-pointer"
            aria-label="Ana Sayfa"
          >
            <span className="text-brand-fg font-bold text-lg">H</span>
          </button>
        </div>

        {/* Orta - Başlık */}
        <div className="text-center">
          <button
            onClick={onTitleClick}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-text-primary">
              HARFHANE
            </h1>
          </button>
          {modeLabel && (
            <span className="text-xs text-text-secondary block -mt-1">
              {modeLabel}
            </span>
          )}
        </div>

        {/* Sağ - Butonlar */}
        <div className="flex items-center gap-0.5">
          <button onClick={onStatsClick} className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer" aria-label="İstatistikler">
            <BarChart2 size={18} className="text-text-primary" />
          </button>
          <button onClick={onHelpClick} className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer" aria-label="Nasıl Oynanır">
            <HelpCircle size={18} className="text-text-primary" />
          </button>
          <button onClick={onSettingsClick} className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer" aria-label="Ayarlar">
            <Settings size={18} className="text-text-primary" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
