import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps): React.JSX.Element {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('out'), 1400);
    const t3 = setTimeout(() => onDone(), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary transition-opacity duration-500 ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center gap-3 transition-all duration-500 ${
          phase === 'in' ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Letter tiles */}
        <div className="flex gap-1.5">
          {['N', 'U', 'R', 'D', 'L', 'E'].map((letter, i) => (
            <div
              key={letter}
              className="w-10 h-10 flex items-center justify-center rounded font-bold text-lg text-white animate-breathe"
              style={{
                backgroundColor: i < 2 ? 'var(--color-tile-correct, #538d4e)' : i < 4 ? 'var(--color-tile-present, #b59f3b)' : 'var(--color-tile-absent, #3a3a3c)',
                animationDelay: `${i * 80}ms`,
              }}
            >
              {letter}
            </div>
          ))}
        </div>
        <p className="text-text-secondary text-xs tracking-widest uppercase">Risale-i Nur</p>
      </div>
    </div>
  );
}
