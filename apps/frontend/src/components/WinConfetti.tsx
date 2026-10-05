import { useEffect, useState } from 'react';

const COLORS = ['#6aaa64', '#c9b458', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa'];
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.8,
    duration: 1.2 + Math.random() * 0.8,
  }));
}

interface WinConfettiProps {
  active: boolean;
}

export default function WinConfetti({ active }: WinConfettiProps): React.JSX.Element | null {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [prevActive, setPrevActive] = useState(active);

  if (active !== prevActive) {
    setPrevActive(active);
    setParticles(active ? generateParticles() : []);
  }

  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => setParticles([]), 2500);
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall rounded-sm"
          style={{
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
