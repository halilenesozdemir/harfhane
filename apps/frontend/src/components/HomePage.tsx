import { useState } from "react";
import { Calendar, Infinity, Sun, Moon, ListTree, ArrowRight } from "lucide-react";
import { useThemeContext } from "../context/ThemeContext";
import type { HomePageProps, WordLength } from "../types";

const WORD_LENGTHS: WordLength[] = [4, 5, 6];

const NURDLE_VARIANTS = [
  { slug: "nurdle-4", label: "4 Harf" },
  { slug: "nurdle",   label: "5 Harf" },
  { slug: "nurdle-6", label: "6 Harf" },
];

const HomePage = ({ onSelectMode, onGoLists }: HomePageProps): React.JSX.Element => {
  const { isDark, toggleTheme } = useThemeContext();
  const [selectedLength, setSelectedLength] = useState<WordLength>(5);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 relative">
      {/* Tema Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 hover:bg-tile-empty rounded-full transition-colors cursor-pointer"
        aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      >
        {isDark ? <Sun size={24} className="text-text-primary" /> : <Moon size={24} className="text-text-primary" />}
      </button>

      {/* Logo */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-correct rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-4xl">H</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-wider mb-2">HARFHANE</h1>
        <p className="text-text-secondary text-lg">Kendi kelime oyununu oluştur ve oyna</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* Nurdle — Öne çıkan listeler */}
        <div>
          <p className="text-text-secondary text-sm text-center mb-2">Nurdle — Risale-i Nur</p>
          <div className="flex gap-2">
            {NURDLE_VARIANTS.map(v => (
              <button
                key={v.slug}
                onClick={() => { window.location.href = `/play/${v.slug}`; }}
                className="flex-1 py-3 rounded-xl bg-bg-secondary hover:bg-tile-empty border border-border text-text-primary font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-secondary/50 text-xs">veya</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Kelime Uzunluğu */}
        <div>
          <p className="text-text-secondary text-sm text-center mb-2">Kelime uzunluğu</p>
          <div className="flex gap-2 justify-center">
            {WORD_LENGTHS.map((len) => (
              <button
                key={len}
                onClick={() => setSelectedLength(len)}
                className={`w-14 h-12 rounded-lg font-bold text-lg transition-all cursor-pointer ${
                  selectedLength === len
                    ? "bg-correct text-white"
                    : "bg-tile-empty text-text-primary hover:bg-tile-filled"
                }`}
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
              <h2 className="text-xl font-bold mb-1">Günlük Oyun</h2>
              <p className="text-white/80 text-sm">Her gün yeni bir kelime. Herkes aynı kelimeyi çözer.</p>
            </div>
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
              <p className="text-white/80 text-sm">Dilediğin kadar oyna. Her seferinde yeni kelime.</p>
            </div>
          </div>
        </button>

        {/* Tüm listeler */}
        <button
          onClick={onGoLists}
          className="w-full bg-bg-secondary hover:bg-tile-empty border border-border rounded-xl px-5 py-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <ListTree size={20} className="text-text-secondary" />
            <div className="text-left">
              <p className="font-semibold text-text-primary text-sm">Tüm listeler</p>
              <p className="text-text-secondary text-xs">Herkese açık kelime listelerini keşfet</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-text-secondary flex-shrink-0" />
        </button>
      </div>

      {/* Alt Bilgi */}
      <div className="mt-10 text-center">
        <p className="text-text-secondary text-sm">Kelime oyunu platformu</p>
        <p className="text-text-secondary/60 text-xs mt-1">v3.0.0</p>
      </div>
    </div>
  );
};

export default HomePage;
