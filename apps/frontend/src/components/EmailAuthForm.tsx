import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { forgotPassword } from '../lib/auth-api';

type View = 'login' | 'register' | 'forgot' | 'forgot-sent';

interface EmailAuthFormProps {
  onSuccess: () => void;
}

export default function EmailAuthForm({ onSuccess }: EmailAuthFormProps): React.JSX.Element {
  const { login, register } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearForm = (nextView: View): void => {
    setError('');
    setView(nextView);
  };

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await register(email, username, password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setView('forgot-sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İstek gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'forgot-sent') {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-text-primary font-medium">E-posta gönderildi</p>
        <p className="text-text-secondary text-sm">
          Kayıtlı bir hesap varsa şifre sıfırlama bağlantısı e-postanıza iletildi. Gelen kutunuzu ve spam klasörünüzü kontrol edin.
        </p>
        <button
          onClick={() => clearForm('login')}
          className="text-sm text-tile-filled hover:underline cursor-pointer"
        >
          Giriş sayfasına dön
        </button>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-text-secondary text-sm">E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.</p>
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
        />
        {error && <p className="text-xs text-tile-absent">{error}</p>}
        <button
          onClick={() => void handleForgot()}
          disabled={loading || !email}
          className="w-full py-2.5 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
        </button>
        <button
          onClick={() => clearForm('login')}
          className="text-sm text-text-secondary hover:text-text-primary cursor-pointer"
        >
          Geri dön
        </button>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
        />
        <input
          type="text"
          placeholder="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
        />
        <input
          type="password"
          placeholder="Şifre (en az 8 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
        />
        {error && <p className="text-xs text-tile-absent">{error}</p>}
        <button
          onClick={() => void handleRegister()}
          disabled={loading || !email || !username || !password}
          className="w-full py-2.5 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>
        <button
          onClick={() => clearForm('login')}
          className="text-sm text-text-secondary hover:text-text-primary cursor-pointer"
        >
          Zaten hesabın var mı? Giriş yap
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
      />
      <input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void handleLogin(); }}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
      />
      {error && <p className="text-xs text-tile-absent">{error}</p>}
      <button
        onClick={() => void handleLogin()}
        disabled={loading || !email || !password}
        className="w-full py-2.5 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40"
      >
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
      <div className="flex justify-between text-sm">
        <button
          onClick={() => clearForm('register')}
          className="text-text-secondary hover:text-text-primary cursor-pointer"
        >
          Hesap oluştur
        </button>
        <button
          onClick={() => clearForm('forgot')}
          className="text-text-secondary hover:text-text-primary cursor-pointer"
        >
          Şifremi unuttum
        </button>
      </div>
    </div>
  );
}
