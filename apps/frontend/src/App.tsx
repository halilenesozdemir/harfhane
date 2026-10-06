import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';
import { PageMeta } from './components/page-meta';
import { usePlayableLengths, usePlayableLengthsQuery } from './hooks/usePlayableLengths';
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

const queryClient = new QueryClient();
const DEFAULT_WORD_LENGTH: WordLength = 5;
const SCHEDULED_WORD_LENGTHS: readonly WordLength[] = [4, 5, 6];

function GameRoute({ mode }: { mode: DailyOrUnlimited }): React.JSX.Element {
  const { length } = useParams<{ length?: string }>();
  const navigate = useNavigate();
  const playableLengths = usePlayableLengths();
  const { isLoading: lengthsLoading } = usePlayableLengthsQuery();
  const parsed = Number(length);
  const isScheduled = (SCHEDULED_WORD_LENGTHS as readonly number[]).includes(parsed);
  const isPlayable = (playableLengths as readonly number[]).includes(parsed);
  const fallbackLength = playableLengths[0] ?? DEFAULT_WORD_LENGTH;

  // A length outside 4/5/6 is never valid; redirect right away.
  if (length !== undefined && !isScheduled) {
    return <Navigate to={`/${mode}/${fallbackLength}`} replace />;
  }

  // AE1: once the playable-lengths answer is in, a scheduled-but-not-playable
  // length redirects to the default one. Waiting for lengthsLoading avoids
  // redirecting on the fallback [5] before the real list has arrived.
  if (length !== undefined && !lengthsLoading && !isPlayable) {
    return <Navigate to={`/${mode}/${fallbackLength}`} replace />;
  }

  const wordLength: WordLength = length === undefined ? fallbackLength : (parsed as WordLength);
  const canonicalPath = length === undefined ? `/${mode}` : `/${mode}/${wordLength}`;
  return (
    <>
      <PageMeta
        title={GAME_TITLES[mode][wordLength]}
        description={GAME_DESCRIPTIONS[mode](wordLength)}
        canonicalPath={canonicalPath}
      />
      <GamePage mode={mode} wordLength={wordLength} playableLengths={playableLengths} onGoHome={() => navigate('/')} />
    </>
  );
}

function HomeRoute(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="Harfhane — Türkçe Kelime Oyunu | Günlük Bulmaca"
        description="Harfhane ile her gün yeni bir Türkçe kelime bul! Ücretsiz Türkçe kelime oyunu. Günlük bulmaca ve sınırsız mod."
        canonicalPath="/"
      />
      <HomePage
        onSelectMode={(mode: GameMode, length: WordLength) => {
          navigate(`/${mode}/${length}`);
        }}
      />
    </>
  );
}

function AppRoutes(): React.JSX.Element {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/lists" element={<Navigate to="/" replace />} />
          <Route path="/play/:slug" element={<Navigate to="/" replace />} />
          <Route path="/c/:wordId" element={<Navigate to="/" replace />} />
          <Route path="/daily" element={<GameRoute mode="daily" />} />
          <Route path="/daily/:length" element={<GameRoute mode="daily" />} />
          <Route path="/unlimited" element={<GameRoute mode="unlimited" />} />
          <Route path="/unlimited/:length" element={<GameRoute mode="unlimited" />} />
          <Route path="/tournament" element={<Navigate to="/" replace />} />
          <Route path="/discuss" element={<Navigate to="/" replace />} />
          <Route path="/sifre-sifirla" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <InstallPrompt />
    </>
  );
}

function AppShell(): React.JSX.Element {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

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
        <AppShell />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
