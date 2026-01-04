import { HelpCircle, BarChart2, Settings } from 'lucide-react';

const Header = ({ onTitleClick, onHelpClick, onStatsClick, onSettingsClick, modeLabel }) => {
  return (
    <header className="w-full border-b border-tile-empty py-3 px-4">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Sol - Logo */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onTitleClick}
            className="w-8 h-8 bg-correct rounded-md flex items-center justify-center hover:bg-correct/90 transition-colors"
            aria-label="Ana Sayfa"
          >
            <span className="text-white font-bold text-lg">N</span>
          </button>
        </div>
        
        {/* Orta - Başlık */}
        <div className="text-center">
          <button 
            onClick={onTitleClick}
            className="hover:opacity-80 transition-opacity"
          >
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-white">
              NURDLE
            </h1>
          </button>
          {modeLabel && (
            <span className="text-xs text-gray-400 block -mt-1">
              {modeLabel}
            </span>
          )}
        </div>
        
        {/* Sağ - Butonlar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onHelpClick}
            className="p-2 hover:bg-tile-empty rounded-md transition-colors"
            aria-label="Nasıl Oynanır"
          >
            <HelpCircle size={24} className="text-white" />
          </button>
          <button
            onClick={onStatsClick}
            className="p-2 hover:bg-tile-empty rounded-md transition-colors"
            aria-label="İstatistikler"
          >
            <BarChart2 size={24} className="text-white" />
          </button>
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-tile-empty rounded-md transition-colors"
            aria-label="Ayarlar"
          >
            <Settings size={24} className="text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
