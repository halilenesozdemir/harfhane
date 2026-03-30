import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';
import Toast from './components/Toast';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';
import ResetPasswordPage from './components/ResetPasswordPage';
import type { GameMode, WordLength } from './types';

const GamePage = lazy(() => import('./components/GamePage'));
const HomePage = lazy(() => import('./components/HomePage'));
const ListsPage = lazy(() => import('./components/ListsPage'));
const SlugGame = lazy(() => import('./components/SlugGame'));
const ChallengeGame = lazy(() => import('./components/ChallengeGame'));
const TournamentPage = lazy(() => import('./components/TournamentPage'));
const DailyDiscussPage = lazy(() => import('./components/DailyDiscussPage'));

const queryClient = new QueryClient();
const VALID_LENGTHS = [4, 5, 6] as const;

function GameRoute({ mode }: { mode: GameMode }): React.JSX.Element {
  const { length } = useParams<{ length?: string }>();
  const navigate = useNavigate();
  const parsed = Number(length);
  const wordLength: WordLength = (VALID_LENGTHS as readonly number[]).includes(parsed)
    ? (parsed as WordLength)
    : 5;
  return <GamePage mode={mode} wordLength={wordLength} onGoHome={() => navigate('/')} />;
}

function HomeRoute(): React.JSX.Element {
  const navigate = useNavigate();
  const { googleAuthFailed, justLoggedIn, clearJustLoggedIn, user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  useEffect(() => {
    if (googleAuthFailed) setShowAuth(true);
  }, [googleAuthFailed]);

  useEffect(() => {
    if (!justLoggedIn || !user) return;
    setWelcomeMessage(`Hoş geldin, ${user.username}!`);
    const timer = setTimeout(() => {
      setWelcomeMessage('');
      clearJustLoggedIn();
    }, 3000);
    return () => clearTimeout(timer);
  }, [justLoggedIn, user, clearJustLoggedIn]);

  return (
    <>
      <HomePage
        onSelectMode={(mode: GameMode, length: WordLength) => {
          if (mode === 'tournament') {
            navigate('/tournament');
            return;
          }
          navigate(`/${mode}/${length}`);
        }}
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <Toast message={welcomeMessage} />
    </>
  );
}

function ListsRoute(): React.JSX.Element {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  return (
    <>
      <ListsPage onGoHome={() => navigate('/')} onAuthRequired={() => setShowAuth(true)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

function SlugRoute(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  if (!slug) return <Navigate to="/" replace />;
  return (
    <>
      <SlugGame slug={slug} onGoHome={() => navigate('/')} onAuthRequired={() => setShowAuth(true)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

function TournamentRoute(): React.JSX.Element {
  const navigate = useNavigate();
  return <TournamentPage onGoHome={() => navigate('/')} />;
}

function DiscussRoute(): React.JSX.Element {
  const navigate = useNavigate();
  return <DailyDiscussPage onGoHome={() => navigate('/')} />;
}

function ChallengeRoute(): React.JSX.Element {
  const { wordId } = useParams<{ wordId: string }>();
  const navigate = useNavigate();
  const parsed = Number(wordId);
  if (!Number.isInteger(parsed) || parsed <= 0) return <Navigate to="/" replace />;
  return <ChallengeGame wordId={parsed} onGoHome={() => navigate('/')} />;
}

function AppRoutes(): React.JSX.Element {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/lists" element={<ListsRoute />} />
          <Route path="/play/:slug" element={<SlugRoute />} />
          <Route path="/c/:wordId" element={<ChallengeRoute />} />
          <Route path="/daily" element={<GameRoute mode="daily" />} />
          <Route path="/daily/:length" element={<GameRoute mode="daily" />} />
          <Route path="/unlimited" element={<GameRoute mode="unlimited" />} />
          <Route path="/unlimited/:length" element={<GameRoute mode="unlimited" />} />
          <Route path="/tournament" element={<TournamentRoute />} />
          <Route path="/discuss" element={<DiscussRoute />} />
          <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <InstallPrompt />
    </>
  );
}

function AppShell(): React.JSX.Element {
  const { isLoading, isAuthCallback } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  if (!splashDone) return <SplashScreen onDone={handleSplashDone} />;

  if (isAuthCallback && isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-correct rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-3xl">H</span>
        </div>
        <p className="text-text-secondary text-sm tracking-wide">Giriş yapılıyor...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AdminApp(): React.JSX.Element {
  const [secret, setSecret] = useState<string | null>(
    () => sessionStorage.getItem('harfhane-admin-secret')
  );
  const [authError, setAuthError] = useState('');

  const handleLogin = async (s: string): Promise<void> => {
    setAuthError('');
    try {
      const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
      const res = await fetch(`${BASE_URL}/admin/words?limit=1`, {
        headers: { 'X-Admin-Secret': s },
      });
      if (!res.ok) {
        setAuthError('Geçersiz anahtar.');
        return;
      }
      sessionStorage.setItem('harfhane-admin-secret', s);
      setSecret(s);
    } catch {
      setAuthError('Bağlantı hatası.');
    }
  };

  const handleLogout = (): void => {
    sessionStorage.removeItem('harfhane-admin-secret');
    setSecret(null);
  };

  if (!secret) {
    return <AdminLogin onLogin={(s) => void handleLogin(s)} error={authError} />;
  }
  return <AdminPanel secret={secret} onLogout={handleLogout} />;
}

function App(): React.JSX.Element {
  const isAdmin = window.location.pathname.startsWith('/admin');

  if (isAdmin) return <AdminApp />;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
