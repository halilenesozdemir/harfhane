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
import { PageMeta } from './components/page-meta';
import type { GameMode, WordLength } from './types';

const CHUNK_RELOAD_KEY = 'harfhane:chunk-reload';

const DAILY_TITLES: Record<WordLength, string> = {
  4: 'Günlük Kelime Oyunu — 4 Harf | Harfhane',
  5: 'Günlük Kelime Oyunu — 5 Harf | Harfhane',
  6: 'Günlük Kelime Oyunu — 6 Harf | Harfhane',
};

const UNLIMITED_TITLES: Record<WordLength, string> = {
  4: 'Sınırsız Kelime Oyunu — 4 Harf | Harfhane',
  5: 'Sınırsız Kelime Oyunu — 5 Harf | Harfhane',
  6: 'Sınırsız Kelime Oyunu — 6 Harf | Harfhane',
};

type DailyOrUnlimited = Extract<GameMode, 'daily' | 'unlimited'>;

const GAME_TITLES: Record<DailyOrUnlimited, Record<WordLength, string>> = {
  daily: DAILY_TITLES,
  unlimited: UNLIMITED_TITLES,
};

const GAME_DESCRIPTIONS: Record<DailyOrUnlimited, (wordLength: WordLength) => string> = {
  daily: (wordLength) =>
    `Her gün yeni bir ${wordLength} harfli Türkçe kelimeyi 6 denemede bul. Ücretsiz günlük kelime bulmacası.`,
  unlimited: (wordLength) =>
    `Dilediğin kadar oyna! ${wordLength} harfli Türkçe kelime bulmacasında sınırsız pratik yap.`,
};

function reloadOnChunkError(): never {
  const lastReload = sessionStorage.getItem(CHUNK_RELOAD_KEY);
  const now = Date.now();
  if (!lastReload || now - Number(lastReload) > 10_000) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    window.location.reload();
  }
  throw new Error('Chunk load failed');
}

const GamePage = lazy(() => import('./components/GamePage').catch(reloadOnChunkError));
const HomePage = lazy(() => import('./components/HomePage').catch(reloadOnChunkError));
const ListsPage = lazy(() => import('./components/ListsPage').catch(reloadOnChunkError));
const SlugGame = lazy(() => import('./components/SlugGame').catch(reloadOnChunkError));
const TournamentPage = lazy(() => import('./components/TournamentPage').catch(reloadOnChunkError));

const queryClient = new QueryClient();
const VALID_LENGTHS = [4, 5, 6] as const;

function GameRoute({ mode }: { mode: DailyOrUnlimited }): React.JSX.Element {
  const { length } = useParams<{ length?: string }>();
  const navigate = useNavigate();
  const parsed = Number(length);
  const wordLength: WordLength = (VALID_LENGTHS as readonly number[]).includes(parsed)
    ? (parsed as WordLength)
    : 5;
  const canonicalPath = length === undefined ? `/${mode}` : `/${mode}/${wordLength}`;
  return (
    <>
      <PageMeta
        title={GAME_TITLES[mode][wordLength]}
        description={GAME_DESCRIPTIONS[mode](wordLength)}
        canonicalPath={canonicalPath}
      />
      <GamePage mode={mode} wordLength={wordLength} onGoHome={() => navigate('/')} />
    </>
  );
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
      <PageMeta
        title="Harfhane — Türkçe Kelime Oyunu | Günlük Bulmaca"
        description="Harfhane ile her gün yeni bir Türkçe kelime bul! Ücretsiz Türkçe kelime oyunu. Günlük bulmaca, sınırsız mod ve özel kelime listeleri."
        canonicalPath="/"
      />
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
      <PageMeta
        title="Kelime Listeleri | Harfhane"
        description="Türkçe kelime listelerini keşfet, kendi listeni oluştur ve arkadaşlarınla paylaş."
        canonicalPath="/lists"
      />
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
      <PageMeta
        title={`${slug} — Özel Kelime Oyunu | Harfhane`}
        description="Harfhane'de bir arkadaşının seçtiği özel kelimeyi tahmin et."
        canonicalPath={`/play/${slug}`}
      />
      <SlugGame slug={slug} onGoHome={() => navigate('/')} onAuthRequired={() => setShowAuth(true)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

function TournamentRoute(): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <>
      <PageMeta
        title="Turnuva Modu | Harfhane"
        description="Diğer oyuncularla yarış, Türkçe kelime turnuvasına katıl."
        canonicalPath="/tournament"
      />
      <TournamentPage onGoHome={() => navigate('/')} />
    </>
  );
}

function AppRoutes(): React.JSX.Element {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/lists" element={<ListsRoute />} />
          <Route path="/play/:slug" element={<SlugRoute />} />
          <Route path="/c/:wordId" element={<Navigate to="/" replace />} />
          <Route path="/daily" element={<GameRoute mode="daily" />} />
          <Route path="/daily/:length" element={<GameRoute mode="daily" />} />
          <Route path="/unlimited" element={<GameRoute mode="unlimited" />} />
          <Route path="/unlimited/:length" element={<GameRoute mode="unlimited" />} />
          <Route path="/tournament" element={<TournamentRoute />} />
          <Route path="/discuss" element={<Navigate to="/" replace />} />
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
