import { HelpCircle, BarChart2, Settings, ArrowLeft } from 'lucide-react';
import BrandMark from './BrandMark';
import TopBar from './TopBar';
import IconButton from './IconButton';
import type { HeaderProps } from '../types';

// Game screens pass modeLabel (R2): the design reference shows a back arrow
// and the mode name there, instead of the home brand mark and wordmark.
const Header = ({ onTitleClick, onHelpClick, onStatsClick, onSettingsClick, modeLabel }: HeaderProps): React.JSX.Element => {
  const left = modeLabel ? (
    <IconButton icon={<ArrowLeft size={22} />} label="Ana Sayfa" onClick={onTitleClick} />
  ) : (
    <button
      onClick={onTitleClick}
      className="w-11 h-11 hover:opacity-90 transition-opacity cursor-pointer"
      aria-label="Ana Sayfa"
    >
      <BrandMark className="w-full h-full" decorative />
    </button>
  );

  const center = (
    <button onClick={onTitleClick} className="hover:opacity-80 transition-opacity cursor-pointer text-left">
      {modeLabel ? (
        <h1 className="text-lg font-display font-extrabold text-text-primary">{modeLabel}</h1>
      ) : (
        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-text-primary">HARFHANE</h1>
      )}
    </button>
  );

  return (
    <TopBar
      left={left}
      center={center}
      actions={
        <>
          <IconButton icon={<BarChart2 size={18} />} label="İstatistikler" onClick={onStatsClick} />
          <IconButton icon={<HelpCircle size={18} />} label="Nasıl Oynanır" onClick={onHelpClick} />
          <IconButton icon={<Settings size={18} />} label="Ayarlar" onClick={onSettingsClick} />
        </>
      }
    />
  );
};

export default Header;
