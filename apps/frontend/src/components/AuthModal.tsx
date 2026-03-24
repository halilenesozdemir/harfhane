import { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'login' | 'register';

export default function AuthModal({ isOpen, onClose }: AuthModalProps): React.JSX.Element {
  const { login, register, loginWithGoogle, googleAuthFailed } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = (): void => {
    setEmail(''); setUsername(''); setPassword(''); setError(''); setShowPassword(false);
  };

  const switchTab = (t: Tab): void => {
    setTab(t);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-border bg-bg-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-tile-correct text-sm';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}>
      {/* Tab */}
      <div className="flex border border-border rounded-lg overflow-hidden mb-5">
        <button
          onClick={() => switchTab('login')}
          className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${tab === 'login' ? 'bg-tile-correct text-white' : 'text-text-secondary hover:bg-bg-primary'}`}
        >
          <span className="flex items-center justify-center gap-1.5"><LogIn size={14} /> Giriş</span>
        </button>
        <button
          onClick={() => switchTab('register')}
          className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${tab === 'register' ? 'bg-tile-correct text-white' : 'text-text-secondary hover:bg-bg-primary'}`}
        >
          <span className="flex items-center justify-center gap-1.5"><UserPlus size={14} /> Kayıt</span>
        </button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className={inputClass}
        />

        {tab === 'register' && (
          <input
            type="text"
            placeholder="Kullanıcı adı (3-20 karakter, harf/rakam/_)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
            className={inputClass}
          />
        )}

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Şifre (en az 8 karakter)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && (
          <p className="text-sm text-tile-absent">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full py-2.5 rounded-lg bg-tile-correct text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
        >
          {loading ? 'Bekleniyor...' : tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-secondary">veya</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={loginWithGoogle}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-border bg-bg-primary hover:bg-bg-secondary text-text-primary text-sm font-medium cursor-pointer transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google ile devam et
      </button>

      {googleAuthFailed && (
        <p className="mt-2 text-sm text-tile-absent text-center">Google ile giriş başarısız oldu. Tekrar deneyin.</p>
      )}
    </Modal>
  );
}
