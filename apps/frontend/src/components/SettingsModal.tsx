import { Sun, Moon, Monitor, Check, Bell, BellOff, Mail, MailX, Trash2, Contrast } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { getEmailNotifications, patchEmailNotifications, deleteAccount } from '../lib/auth-api';
import type { Theme } from '../types';

interface ThemeOptionProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ThemeOption = ({ icon: Icon, label, isActive, onClick }: ThemeOptionProps): React.JSX.Element => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 w-full p-3 rounded-lg transition-all cursor-pointer
      ${isActive
        ? 'bg-correct text-white'
        : 'bg-bg-secondary text-text-primary hover:bg-tile-empty'
      }
    `}
  >
    <Icon size={20} />
    <span className="flex-1 text-left font-medium">{label}</span>
    {isActive && <Check size={18} />}
  </button>
);

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps): React.JSX.Element => {
  const { theme, setTheme, resolvedTheme, isHighContrast, setHighContrast } = useThemeContext();
  const { token, logout } = useAuth();
  const { state, isSubscribed, isLoading, subscribe, unsubscribe } = useNotifications(token);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'loading'>('idle');

  useEffect(() => {
    if (!token) return;
    getEmailNotifications(token).then(({ enabled }) => setEmailEnabled(enabled)).catch(() => undefined);
  }, [token]);

  async function handleDeleteAccount(): Promise<void> {
    if (!token) return;
    setDeleteStep('loading');
    try {
      await deleteAccount(token);
      logout();
      onClose();
    } catch {
      setDeleteStep('confirm');
    }
  }

  async function handleEmailToggle(): Promise<void> {
    if (!token) return;
    setEmailLoading(true);
    try {
      const { enabled } = await patchEmailNotifications(token, !emailEnabled);
      setEmailEnabled(enabled);
    } finally {
      setEmailLoading(false);
    }
  }

  const themeOptions: Array<{ icon: LucideIcon; label: string; value: Theme }> = [
    { icon: Sun, label: 'Açık Tema', value: 'light' },
    { icon: Moon, label: 'Koyu Tema', value: 'dark' },
    { icon: Monitor, label: 'Sistem Ayarı', value: 'system' },
  ];

  function handleClose(): void {
    setDeleteStep('idle');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ayarlar">
      <div className="space-y-6">
        {/* Tema Seçimi */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-3">Tema</h3>
          <div className="space-y-2">
            {themeOptions.map((option) => (
              <ThemeOption
                key={option.value}
                icon={option.icon}
                label={option.label}
                isActive={theme === option.value}
                onClick={() => setTheme(option.value)}
              />
            ))}
          </div>
          {theme === 'system' && (
            <p className="text-text-secondary text-sm mt-2">
              Şu an: {resolvedTheme === 'dark' ? 'Koyu' : 'Açık'} tema (sistem ayarına göre)
            </p>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={isHighContrast}
            onClick={() => setHighContrast(!isHighContrast)}
            className={`mt-3 flex items-center gap-3 w-full p-3 rounded-lg transition-all cursor-pointer ${
              isHighContrast
                ? 'bg-correct text-correct-fg hover:bg-correct/90'
                : 'bg-bg-secondary text-text-primary hover:bg-tile-empty'
            }`}
          >
            <Contrast size={20} />
            <span className="flex-1 text-left font-medium">Yüksek kontrast (renk körlüğü dostu)</span>
            {isHighContrast && <Check size={18} />}
          </button>
        </div>

        {token && (
          <div className="border-t border-border-color pt-4">
            <h3 className="text-lg font-bold text-text-primary mb-3">Bildirimler</h3>
            <div className="space-y-2">
              {state !== 'unsupported' && (
                state === 'denied' ? (
                  <p className="text-sm text-text-secondary">
                    Tarayıcı bildirimleri engellenmiş. Tarayıcı ayarlarından izin ver.
                  </p>
                ) : (
                  <button
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={isLoading}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                      isSubscribed
                        ? 'bg-correct text-white hover:bg-correct/90'
                        : 'bg-bg-secondary text-text-primary hover:bg-tile-empty'
                    }`}
                  >
                    {isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
                    <span className="flex-1 text-left font-medium">
                      {isLoading ? 'Bekle...' : isSubscribed ? 'Tarayıcı bildirimi açık' : 'Tarayıcı bildirimi kapalı'}
                    </span>
                    {isSubscribed && <Check size={18} />}
                  </button>
                )
              )}
              <button
                onClick={handleEmailToggle}
                disabled={emailLoading}
                className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                  emailEnabled
                    ? 'bg-correct text-white hover:bg-correct/90'
                    : 'bg-bg-secondary text-text-primary hover:bg-tile-empty'
                }`}
              >
                {emailEnabled ? <Mail size={20} /> : <MailX size={20} />}
                <span className="flex-1 text-left font-medium">
                  {emailLoading ? 'Bekle...' : emailEnabled ? 'E-posta bildirimi açık' : 'E-posta bildirimi kapat'}
                </span>
                {emailEnabled && <Check size={18} />}
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Her gün saat 20:00'de oynamayı unutmaman için bildirim gönderilir.
            </p>
          </div>
        )}

        {/* Geri Bildirim */}
        <div className="border-t border-border-color pt-4">
          <h3 className="text-lg font-bold text-text-primary mb-3">Hakkında</h3>
          <div className="space-y-2 text-text-secondary text-sm">
            <p>
              <strong>Harfhane</strong> - Her gün yeni bir Türkçe kelimeyi tahmin et.
            </p>
            <p className="text-text-secondary/60">
              Versiyon: 3.0.0
            </p>
          </div>
        </div>

        {token && (
          <div className="border-t border-border-color pt-4">
            <h3 className="text-lg font-bold text-text-primary mb-3">Hesap</h3>
            {deleteStep === 'idle' && (
              <button
                onClick={() => setDeleteStep('confirm')}
                className="flex items-center gap-3 w-full p-3 rounded-lg bg-bg-secondary text-tile-absent hover:bg-tile-absent/10 transition-all cursor-pointer"
              >
                <Trash2 size={20} />
                <span className="flex-1 text-left font-medium">Hesabı Sil</span>
              </button>
            )}
            {deleteStep === 'confirm' && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-text-secondary">
                  Hesabın ve tüm verilerin kalıcı olarak silinecek. Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleDeleteAccount()}
                    className="flex-1 py-2 rounded-lg bg-tile-absent text-white text-sm font-semibold cursor-pointer hover:opacity-90"
                  >
                    Evet, sil
                  </button>
                  <button
                    onClick={() => setDeleteStep('idle')}
                    className="flex-1 py-2 rounded-lg bg-bg-secondary text-text-primary text-sm font-semibold cursor-pointer hover:bg-tile-empty"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
            {deleteStep === 'loading' && (
              <p className="text-sm text-text-secondary text-center py-2">Hesap siliniyor...</p>
            )}
          </div>
        )}

        {/* Linkler */}
        <div className="border-t border-border-color pt-4">
          <div className="flex gap-4 justify-center">
            <a
              href="https://github.com/halilenesozdemir/harfhane"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              GitHub
            </a>
            <span className="text-text-secondary/40">•</span>
            <span className="text-text-secondary/40 text-sm cursor-default">
              Gizlilik
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
