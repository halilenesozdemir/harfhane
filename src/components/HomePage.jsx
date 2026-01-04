import { Calendar, Infinity, Trophy } from "lucide-react";

const HomePage = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      {/* Logo ve Başlık */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-correct rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-4xl">N</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wider mb-2">
          NURDLE
        </h1>
        <p className="text-gray-400 text-lg">Risale-i Nur Kelime Oyunu</p>
      </div>

      {/* Mod Seçimi */}
      <div className="w-full max-w-md space-y-4">
        {/* Günlük Mod */}
        <button
          onClick={() => onSelectMode("daily")}
          className="w-full bg-correct hover:bg-correct/90 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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
          onClick={() => onSelectMode("unlimited")}
          className="w-full bg-present hover:bg-present/90 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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
        <p className="text-gray-500 text-sm">
          Risale-i Nur külliyatından kelimelerle
        </p>
        <p className="text-gray-600 text-xs mt-1">v1.0.0</p>
      </div>
    </div>
  );
};

export default HomePage;
