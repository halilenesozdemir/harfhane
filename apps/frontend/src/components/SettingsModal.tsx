import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import Modal from './Modal';
import { useThemeContext } from '../context/ThemeContext';
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
  const { theme, setTheme, resolvedTheme } = useThemeContext();

  const themeOptions: Array<{ icon: LucideIcon; label: string; value: Theme }> = [
    { icon: Sun, label: 'Açık Tema', value: 'light' },
    { icon: Moon, label: 'Koyu Tema', value: 'dark' },
    { icon: Monitor, label: 'Sistem Ayarı', value: 'system' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ayarlar">
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
        </div>

        {/* Geri Bildirim */}
        <div className="border-t border-border-color pt-4">
          <h3 className="text-lg font-bold text-text-primary mb-3">Hakkında</h3>
          <div className="space-y-2 text-text-secondary text-sm">
            <p>
              <strong>Harfhane</strong> - Kendi kelime listeni oluştur, oyna ve paylaş.
            </p>
            <p>
              Wordle'dan ilham alınmıştır.
            </p>
            <p className="text-text-secondary/60">
              Versiyon: 3.0.0
            </p>
          </div>
        </div>

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
            <a
              href="#"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              Gizlilik
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
