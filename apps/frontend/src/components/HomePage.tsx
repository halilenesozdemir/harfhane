import { useState } from "react";
import { Calendar, Infinity as InfinityIcon, Settings, HelpCircle } from "lucide-react";
import { getTodayString } from "@harfhane/shared";
import HowToPlayModal from "./HowToPlayModal";
import SettingsModal from "./SettingsModal";
import HeroTiles from "./home/HeroTiles";
import ModeCard from "./home/ModeCard";
import TodayStatus from "./home/TodayStatus";
import HowToPanel from "./home/HowToPanel";
import { getTodayStatus } from "./home/today-status";
import { useTurkeyDay } from "./home/useTurkeyDay";
import { getDefaultPlayableLength, usePlayableLengths } from "../hooks/usePlayableLengths";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { GameState, HomePageProps, WordLength } from "../types";

const HAS_SEEN_HELP_KEY = 'harfhane:has-seen-help';

// Mirrors the default GameState shape useGameState.ts initializes its stored
// daily game with; read-only here, this module never writes to that key.
const EMPTY_GAME_STATE: GameState = {
  guesses: [],
  evaluations: [],
  currentGuess: '',
  gameStatus: 'playing',
  keyboardStatus: {},
};

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

  // Reactive to the Turkey day itself, not just read once on mount: without
  // this, a player who solves today's word and leaves the tab open never
  // sees the daily card flip back to "Henüz oynamadın" at Turkey midnight.
  const todayString = useTurkeyDay(getTodayString);
  const [dailyGameState] = useLocalStorage<GameState>(`harfhane:game:anon:${todayString}:${dailyLength}`, EMPTY_GAME_STATE);
  const dailyStatus = getTodayStatus(dailyGameState);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center relative">
      {/* U2 will swap this corner for the shared top bar's icon buttons. */}
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

      <div className="w-full max-w-[1200px] flex-1 flex flex-col gap-8 px-4 pt-20 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <HeroTiles />
          <p className="text-text-secondary text-base sm:text-lg">Her gün yeni bir kelime. Altı tahminde bul.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:flex-[999] grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ModeCard
              icon={<Calendar size={26} className="text-correct-fg" />}
              iconVariant="correct"
              title="Günlük"
              description={`Günün ${dailyLength} harfli kelimesi. Herkes aynı kelimeyi çözer.`}
              badge={<TodayStatus status={dailyStatus} />}
              onClick={() => onSelectMode("daily", dailyLength)}
            />

            <ModeCard
              icon={<InfinityIcon size={26} className="text-present-fg" />}
              iconVariant="present"
              title="Sınırsız"
              description="Dilediğin kadar oyna. Her seferinde yeni kelime."
              onClick={() => onSelectMode("unlimited", selectedLength)}
              footer={
                playableLengths.length > 1 ? (
                  <div className="flex gap-2 px-5 pb-4">
                    {playableLengths.map((len) => (
                      <button
                        key={len}
                        onClick={() => setPickedLength(len)}
                        aria-pressed={selectedLength === len}
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
                ) : undefined
              }
            />
          </div>

          <div className="w-full lg:flex-[1] lg:min-w-[300px]">
            <HowToPanel />
          </div>
        </div>
      </div>

      <footer className="w-full max-w-[1200px] px-4 pb-6 sm:px-6 lg:px-8 text-sm text-text-secondary">
        Hesap yok. Reklam yok. İlerlemen yalnızca bu cihazda saklanır.
      </footer>

      <HowToPlayModal isOpen={showHelp} onClose={() => { localStorage.setItem(HAS_SEEN_HELP_KEY, JSON.stringify(true)); setShowHelp(false); }} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default HomePage;
