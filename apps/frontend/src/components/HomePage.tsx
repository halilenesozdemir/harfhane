import { useState } from "react";
import { Calendar, Infinity as InfinityIcon, Settings, HelpCircle } from "lucide-react";
import BrandMark from "./BrandMark";
import HowToPlayModal from "./HowToPlayModal";
import SettingsModal from "./SettingsModal";
import { getDefaultPlayableLength, usePlayableLengths } from "../hooks/usePlayableLengths";
import type { HomePageProps, WordLength } from "../types";

const HAS_SEEN_HELP_KEY = 'harfhane:has-seen-help';

const HomePage = ({ onSelectMode }: HomePageProps): React.JSX.Element => {
  const playableLengths = usePlayableLengths();
  const dailyLength = getDefaultPlayableLength(playableLengths);
  // null means "no explicit pick yet"; falls back to dailyLength, and also
  // whenever a previous pick stops being playable (derived, not an effect).
  const [pickedLength, setPickedLength] = useState<WordLength | null>(null);
  const selectedLength = pickedLength !== null && playableLengths.includes(pickedLength) ? pickedLength : dailyLength;
  const [showHelp, setShowHelp] = useState(() => {
    const seen = localStorage.getItem(HAS_SEEN_HELP_KEY);
    return !seen || seen === 'false';
  });
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 hover:bg-tile-empty rounded-full transition-colors cursor-pointer"
          aria-label="Nasıl Oynanır"
        >
          <HelpCircle size={22} className="text-text-secondary" />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-tile-empty rounded-full transition-colors cursor-pointer"
          aria-label="Ayarlar"
        >
          <Settings size={22} className="text-text-secondary" />
        </button>
      </div>

      <div className="text-center mb-8">
        <BrandMark className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-wider mb-2">HARFHANE</h1>
        <p className="text-text-secondary text-base">Türkçe kelime oyunu</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <button
          onClick={() => onSelectMode("daily", dailyLength)}
          className="w-full bg-correct-depth text-white rounded-2xl p-5 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Calendar size={26} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold">Günlük Oyun</h2>
              {/* /75 opacity failed WCAG AA contrast against bg-correct (axe: 3.15,
                  needs 4.5); /90 clears it while keeping the subtitle visually
                  lighter than the heading above it. */}
              <p className="text-white/90 text-sm">Günün {dailyLength} harfli kelimesi. Herkes aynı kelimeyi çözer.</p>
            </div>
          </div>
        </button>

        <div className="w-full bg-present/10 border border-present/30 rounded-2xl overflow-hidden">
          <button
            onClick={() => onSelectMode("unlimited", selectedLength)}
            className="w-full p-5 text-left cursor-pointer hover:bg-present/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-present/20 rounded-xl flex items-center justify-center shrink-0">
                <InfinityIcon size={26} className="text-present" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Sınırsız Mod</h2>
                <p className="text-text-secondary text-sm">Dilediğin kadar oyna. Her seferinde yeni kelime.</p>
              </div>
            </div>
          </button>
          {playableLengths.length > 1 && (
          <div className="flex gap-2 px-5 pb-4">
            {playableLengths.map((len) => (
              <button
                key={len}
                onClick={() => setPickedLength(len)}
                className={`flex-1 h-9 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                  selectedLength === len
                    ? "bg-present text-present-fg shadow-sm"
                    : "bg-tile-empty text-text-secondary hover:bg-tile-filled"
                }`}
              >
                {len} harf
              </button>
            ))}
          </div>
          )}
        </div>
      </div>

      <HowToPlayModal isOpen={showHelp} onClose={() => { localStorage.setItem(HAS_SEEN_HELP_KEY, JSON.stringify(true)); setShowHelp(false); }} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default HomePage;
