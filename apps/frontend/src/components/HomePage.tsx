import { useState } from "react";
import { Calendar, Infinity, Trophy, Sun, Moon } from "lucide-react";
import { useThemeContext } from "../context/ThemeContext";
import type { HomePageProps, WordLength } from "../types";

const WORD_LENGTHS: WordLength[] = [4, 5, 6, 7];

const HomePage = ({ onSelectMode }: HomePageProps): React.JSX.Element => {
  const { isDark, toggleTheme } = useThemeContext();
  const [selectedLength, setSelectedLength] = useState<WordLength>(5);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 relative">
      {/* Tema Toggle - Sağ Üst */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 hover:bg-tile-empty rounded-full transition-colors"
        aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      >
        {isDark ? (
          <Sun size={24} className="text-text-primary" />
        ) : (
          <Moon size={24} className="text-text-primary" />
        )}
      </button>

      {/* Logo ve Başlık */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-correct rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-4xl">N</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-wider mb-2">
          NURDLE
        </h1>
        <p className="text-text-secondary text-lg">Risale-i Nur Kelime Oyunu</p>
      </div>

      {/* Mod Seçimi */}
      <div className="w-full max-w-md space-y-4">
        {/* Kelime Uzunluğu Seçimi */}
        <div>
          <p className="text-text-secondary text-sm text-center mb-2">Kelime uzunluğu</p>
          <div className="flex gap-2 justify-center">
            {WORD_LENGTHS.map((len) => (
              <button
                key={len}
                onClick={() => setSelectedLength(len)}
                className={`
                  w-14 h-12 rounded-lg font-bold text-lg transition-all cursor-pointer
                  ${selectedLength === len
                    ? 'bg-correct text-white'
                    : 'bg-tile-empty text-text-primary hover:bg-tile-filled'
                  }
                `}
              >
                {len}
              </button>
            ))}
          </div>
        </div>

        {/* Günlük Mod */}
        <button
          onClick={() => onSelectMode("daily", selectedLength)}
          className="w-full bg-correct hover:bg-correct/90 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar size={28} />
            </div>
            <div className="text-left flex-1">
              <h2 className="text-xl font-bold mb-1">Günlük Nurdle</h2>
              <p className="text-white/80 text-sm">
                Her gün yeni bir kelime. Herkes aynı kelimeyi çözer.
              </p>
            </div>
            <Trophy size={24} className="text-white/60" />
          </div>
        </button>

        {/* Sınırsız Mod */}
        <button
          onClick={() => onSelectMode("unlimited", selectedLength)}
          className="w-full bg-present hover:bg-present/90 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
              <Infinity size={28} />
            </div>
            <div className="text-left flex-1">
              <h2 className="text-xl font-bold mb-1">Sınırsız Mod</h2>
              <p className="text-white/80 text-sm">
                Dilediğin kadar oyna. Her seferinde yeni kelime.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Alt Bilgi */}
      <div className="mt-12 text-center">
        <p className="text-text-secondary text-sm">
          Risale-i Nur külliyatından kelimelerle
        </p>
        <p className="text-text-secondary/60 text-xs mt-1">v2.0.0</p>
      </div>
    </div>
  );
};

export default HomePage;
