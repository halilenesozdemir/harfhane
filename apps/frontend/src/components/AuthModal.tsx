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
  const { login, register } = useAuth();
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
    </Modal>
  );
}
