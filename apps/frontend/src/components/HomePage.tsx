import { useState } from "react";
import { Calendar, Infinity, Sun, Moon, Flame, Trophy, BarChart2, HelpCircle, LogIn, TrendingUp, Shield } from "lucide-react";
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import HowToPlayModal from "./HowToPlayModal";
import AuthModal from "./AuthModal";
import type { HomePageProps, WordLength } from "../types";

const WORD_LENGTHS: WordLength[] = [4, 5, 6];

const HomePage = ({ onSelectMode }: HomePageProps): React.JSX.Element => {
  const { isDark, toggleTheme } = useThemeContext();
  const { user, token } = useAuth();
  const [selectedLength, setSelectedLength] = useState<WordLength>(5);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { data: profileData } = useProfile(token);

  const stats = profileData?.stats;

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
          onClick={toggleTheme}
          className="p-2 hover:bg-tile-empty rounded-full transition-colors cursor-pointer"
          aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
        >
          {isDark ? <Sun size={22} className="text-text-primary" /> : <Moon size={22} className="text-text-primary" />}
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-correct rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white font-bold text-4xl">H</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-wider mb-2">HARFHANE</h1>
        <p className="text-text-secondary text-base">Türkçe kelime oyunu</p>
      </div>

      {user && stats && (
        <div className="w-full max-w-md mb-6 bg-bg-secondary rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-correct rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{user.username}</p>
              <p className="text-xs text-text-secondary">
                {profileData?.playedToday ? 'Bugün oynadın' : 'Bugün oynamadın'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-1">
                <Flame size={16} className="text-present" />
                <span className="font-bold text-text-primary">{stats.currentStreak}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Trophy size={16} className="text-correct" />
              <span className="font-bold text-text-primary">{stats.totalWon}</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart2 size={16} className="text-text-secondary" />
              <span className="font-bold text-text-primary">{stats.winRate}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-3">
        <div>
          <p className="text-text-secondary text-sm text-center mb-2">Kelime uzunluğu</p>
          <div className="flex gap-2 justify-center">
            {WORD_LENGTHS.map((len) => (
              <button
                key={len}
                onClick={() => setSelectedLength(len)}
                className={`w-14 h-12 rounded-lg font-bold text-lg transition-all cursor-pointer ${
                  selectedLength === len
                    ? "bg-correct text-white shadow-md"
                    : "bg-tile-empty text-text-primary hover:bg-tile-filled"
                }`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSelectMode("daily", selectedLength)}
          className="w-full bg-correct hover:bg-correct/90 text-white rounded-2xl p-5 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Calendar size={26} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold">Günlük Oyun</h2>
              <p className="text-white/75 text-sm">Herkes aynı kelimeyi çözer. Serini koru.</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelectMode("unlimited", selectedLength)}
          className="w-full bg-present hover:bg-present/90 text-white rounded-2xl p-5 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Infinity size={26} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold">Sınırsız Mod</h2>
              <p className="text-white/75 text-sm">Dilediğin kadar oyna. Her seferinde yeni kelime.</p>
            </div>
          </div>
        </button>
      </div>

      {!user && (
        <button
          onClick={() => setShowAuth(true)}
          className="w-full max-w-md mt-4 bg-bg-secondary hover:bg-tile-empty rounded-2xl p-4 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <LogIn size={15} className="text-correct" />
              Giriş yaparak kazan
            </span>
            <span className="text-xs text-correct font-medium">Ücretsiz</span>
          </div>
          <div className="flex gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><TrendingUp size={12} className="text-correct" /> XP &amp; Seviye</span>
            <span className="flex items-center gap-1"><Flame size={12} className="text-present" /> Seri takibi</span>
            <span className="flex items-center gap-1"><Shield size={12} className="text-blue-400" /> Seri dondurma</span>
          </div>
        </button>
      )}

      <div className="mt-6 text-center">
        <p className="text-text-secondary/50 text-xs">v3.0.0</p>
      </div>

      <HowToPlayModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
};

export default HomePage;
