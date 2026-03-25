import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';
import type { GameMode, WordLength } from './types';

const GamePage = lazy(() => import('./components/GamePage'));
const HomePage = lazy(() => import('./components/HomePage'));
const ListsPage = lazy(() => import('./components/ListsPage'));
const SlugGame = lazy(() => import('./components/SlugGame'));

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
  const { googleAuthFailed } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (googleAuthFailed) setShowAuth(true);
  }, [googleAuthFailed]);

  return (
    <>
      <HomePage
        onSelectMode={(mode: GameMode, length: WordLength) => navigate(`/${mode}/${length}`)}
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
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

function AdminApp(): React.JSX.Element {
  const [secret, setSecret] = useState<string | null>(
    () => sessionStorage.getItem('nurdle-admin-secret')
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
      sessionStorage.setItem('nurdle-admin-secret', s);
      setSecret(s);
    } catch {
      setAuthError('Bağlantı hatası.');
    }
  };

  const handleLogout = (): void => {
    sessionStorage.removeItem('nurdle-admin-secret');
    setSecret(null);
  };

  if (!secret) {
    return <AdminLogin onLogin={(s) => void handleLogin(s)} error={authError} />;
  }
  return <AdminPanel secret={secret} onLogout={handleLogout} />;
}

function AppRoutes(): React.JSX.Element {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/lists" element={<ListsRoute />} />
          <Route path="/play/:slug" element={<SlugRoute />} />
          <Route path="/daily" element={<GameRoute mode="daily" />} />
          <Route path="/daily/:length" element={<GameRoute mode="daily" />} />
          <Route path="/unlimited" element={<GameRoute mode="unlimited" />} />
          <Route path="/unlimited/:length" element={<GameRoute mode="unlimited" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <InstallPrompt />
    </>
  );
}

function App(): React.JSX.Element {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  if (isAdmin) return <AdminApp />;
  if (!splashDone) return <SplashScreen onDone={handleSplashDone} />;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
