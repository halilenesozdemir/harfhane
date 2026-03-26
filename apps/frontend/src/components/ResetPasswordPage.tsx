import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../lib/auth-api';

export default function ResetPasswordPage(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şifre sıfırlanamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-bg-secondary border border-border rounded-2xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-block bg-correct rounded-xl px-4 py-2 mb-4">
            <span className="text-white font-bold text-2xl tracking-widest">HARFHANE</span>
          </div>
          <h1 className="text-text-primary font-semibold text-lg">Yeni Şifre Belirle</h1>
        </div>

        {!token ? (
          <p className="text-tile-absent text-sm text-center">Geçersiz bağlantı. Lütfen e-postanızdaki bağlantıyı kullanın.</p>
        ) : done ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-text-primary font-medium">Şifreniz güncellendi</p>
            <p className="text-text-secondary text-sm">Artık yeni şifrenizle giriş yapabilirsiniz.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90"
            >
              Ana Sayfaya Git
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Yeni şifre (en az 8 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
            />
            <input
              type="password"
              placeholder="Şifreyi tekrarla"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
            />
            {error && <p className="text-xs text-tile-absent">{error}</p>}
            <button
              onClick={() => void handleSubmit()}
              disabled={loading || !password || !confirm}
              className="w-full py-2.5 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40"
            >
              {loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
