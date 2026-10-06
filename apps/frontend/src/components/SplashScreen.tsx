import { useEffect, useState } from 'react';

const SPLASH_TILES = ['H', 'A', 'R', 'F'] as const;
const TILE_COLORS = ['bg-correct', 'bg-present', 'bg-correct', 'bg-present'] as const;

// R6: the splash is a brief brand moment, not a load screen — it no longer
// holds the app behind a fixed 1.9s wait. ENTER_DELAY_MS starts the pop-in
// transition on the next frame, HOLD_START_MS begins the fade-out, and
// FADE_DURATION_MS is the fade's own CSS transition duration. It must
// match the literal `duration-200` class below — Tailwind's build-time
// scanner needs a static class name, so this can't be interpolated into
// the className. TOTAL_DURATION_MS is defined from the other two so
// onDone never unmounts mid-fade.
const ENTER_DELAY_MS = 50;
const HOLD_START_MS = 400;
const FADE_DURATION_MS = 200;
const TOTAL_DURATION_MS = HOLD_START_MS + FADE_DURATION_MS;
// prefers-reduced-motion: skip the animated wait entirely instead of
// sitting through a now-instant (CSS-collapsed) animation with nothing to
// look at.
const REDUCED_MOTION_DONE_DELAY_MS = 0;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps): React.JSX.Element {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    if (prefersReducedMotion()) {
      const reducedMotionTimer = setTimeout(() => onDone(), REDUCED_MOTION_DONE_DELAY_MS);
      return () => clearTimeout(reducedMotionTimer);
    }
    const t1 = setTimeout(() => setPhase('hold'), ENTER_DELAY_MS);
    const t2 = setTimeout(() => setPhase('out'), HOLD_START_MS);
    const t3 = setTimeout(() => onDone(), TOTAL_DURATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary transition-opacity duration-200 ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center gap-3 transition-all duration-500 ${
          phase === 'in' ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="flex gap-1.5">
          {SPLASH_TILES.map((letter, i) => (
            <div
              key={letter}
              className={`w-10 h-10 flex items-center justify-center rounded font-bold text-lg text-white ${TILE_COLORS[i]} animate-breathe`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {letter}
            </div>
          ))}
        </div>
        <p className="text-text-secondary text-xs tracking-widest uppercase">Harfhane</p>
      </div>
    </div>
  );
}
