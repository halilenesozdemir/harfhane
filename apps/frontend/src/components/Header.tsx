import { HelpCircle, BarChart2, Settings, Sun, Moon, Trophy, User, LogOut } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useXP } from '../hooks/useXP';
import type { HeaderProps } from '../types';

const Header = ({ onTitleClick, onHelpClick, onStatsClick, onSettingsClick, onLeaderboardClick, onAuthClick, onProfileClick, modeLabel }: HeaderProps): React.JSX.Element => {
  const { isDark, toggleTheme } = useThemeContext();
  const { user, token, logout } = useAuth();
  const { data: xpProfile } = useXP(token);

  return (
    <header className="w-full border-b border-border-color py-3 px-4 bg-bg-primary">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Sol - Logo */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onTitleClick}
            className="w-8 h-8 bg-correct rounded-md flex items-center justify-center hover:bg-correct/90 transition-colors cursor-pointer"
            aria-label="Ana Sayfa"
          >
            <span className="text-white font-bold text-lg">H</span>
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
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer"
            aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
          >
            {isDark ? <Sun size={18} className="text-text-primary" /> : <Moon size={18} className="text-text-primary" />}
          </button>
          <button onClick={onLeaderboardClick} className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer" aria-label="Sıralama">
            <Trophy size={18} className="text-text-primary" />
          </button>
          <button onClick={onStatsClick} className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer" aria-label="İstatistikler">
            <BarChart2 size={18} className="text-text-primary" />
          </button>
          <button onClick={onHelpClick} className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer" aria-label="Nasıl Oynanır">
            <HelpCircle size={18} className="text-text-primary" />
          </button>
          <button onClick={onSettingsClick} className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer" aria-label="Ayarlar">
            <Settings size={18} className="text-text-primary" />
          </button>
          {user ? (
            <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-border-color">
              <button
                onClick={onProfileClick}
                className="flex items-center gap-1 p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer"
                aria-label="Profil"
              >
                {xpProfile ? (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-correct text-white text-xs font-bold">
                    {xpProfile.level}
                  </span>
                ) : (
                  <User size={18} className="text-text-primary" />
                )}
                <span className="text-xs text-text-secondary hidden sm:block">{user.username}</span>
              </button>
              <button onClick={logout} className="p-1.5 hover:bg-tile-empty rounded-md transition-colors cursor-pointer" aria-label="Çıkış">
                <LogOut size={18} className="text-text-secondary" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="flex items-center gap-1.5 ml-1 px-2 py-1.5 bg-correct hover:bg-correct/90 text-white text-sm font-bold rounded-md transition-colors cursor-pointer"
              aria-label="Giriş Yap"
            >
              <User size={16} />
              <span className="hidden sm:block">Giriş Yap</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
