import { useState } from 'react';
import { Home, MessageSquare } from 'lucide-react';
import CommentSection from './CommentSection';
import AuthModal from './AuthModal';

interface DailyDiscussPageProps {
  onGoHome: () => void;
}

function todaySlug(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `daily-${yyyy}-${mm}-${dd}`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DailyDiscussPage({ onGoHome }: DailyDiscussPageProps): React.JSX.Element {
  const [showAuth, setShowAuth] = useState(false);
  const slug = todaySlug();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-color">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <Home size={18} />
          <span className="text-sm">Ana Sayfa</span>
        </button>
        <div className="flex items-center gap-2 text-text-primary font-semibold">
          <MessageSquare size={18} />
          <span>Günlük Tartışma</span>
        </div>
        <div className="w-24" />
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
        <div className="text-center">
          <p className="text-text-secondary text-sm capitalize">{todayLabel()}</p>
          <p className="text-text-primary text-xs mt-1">
            Bugünkü kelimeyi tartışın — spoiler vermemeye dikkat edin!
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl p-4">
          <CommentSection slug={slug} onLoginRequired={() => setShowAuth(true)} />
        </div>
      </main>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
