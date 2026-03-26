import { useState } from 'react';
import Modal from './Modal';
import EmailAuthForm from './EmailAuthForm';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'google' | 'email';

export default function AuthModal({ isOpen, onClose }: AuthModalProps): React.JSX.Element {
  const { loginWithGoogle, googleAuthFailed } = useAuth();
  const [tab, setTab] = useState<Tab>('google');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Giriş Yap">
      <div className="flex flex-col gap-5 py-1">
        <div className="text-center space-y-1">
          <p className="text-text-primary font-medium">Serini ve istatistiklerini kaydet</p>
          <p className="text-text-secondary text-sm">Giriş yaparak XP kazan, rozet topla ve sıralamada yer al.</p>
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            onClick={() => setTab('google')}
            className={`flex-1 py-2 font-medium cursor-pointer transition-colors ${tab === 'google' ? 'bg-tile-filled text-white' : 'bg-bg-primary text-text-secondary hover:text-text-primary'}`}
          >
            Google
          </button>
          <button
            onClick={() => setTab('email')}
            className={`flex-1 py-2 font-medium cursor-pointer transition-colors ${tab === 'email' ? 'bg-tile-filled text-white' : 'bg-bg-primary text-text-secondary hover:text-text-primary'}`}
          >
            E-posta
          </button>
        </div>

        {tab === 'google' ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-bg-primary hover:bg-bg-secondary text-text-primary text-sm font-semibold cursor-pointer transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile devam et
            </button>
            {googleAuthFailed && (
              <p className="text-sm text-red-400 text-center">Google ile giriş başarısız oldu. Tekrar deneyin.</p>
            )}
          </div>
        ) : (
          <EmailAuthForm onSuccess={onClose} />
        )}
      </div>
    </Modal>
  );
}
