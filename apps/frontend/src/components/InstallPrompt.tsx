import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = (): React.JSX.Element | null => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // PWA zaten yüklü mü kontrol et
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Kullanıcı daha önce dismiss ettiyse gösterme
    const dismissed = localStorage.getItem('nurdle:install-prompt-dismissed');
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const daysSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) return; // 7 gün sonra tekrar göster
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 3 saniye sonra göster (kullanıcı siteyi keşfetsin)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async (): Promise<void> => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = (): void => {
    setShowPrompt(false);
    localStorage.setItem('nurdle:install-prompt-dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in">
      <div className="bg-bg-secondary border-2 border-correct rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-correct rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">H</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-text-primary font-bold mb-1">Ana Ekrana Ekle</h3>
            <p className="text-text-secondary text-sm mb-3">
              Harfhane'yi telefonunuza yükleyin, offline oynayın!
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-correct hover:bg-correct/90 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={16} />
                Yükle
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-md text-text-secondary hover:bg-tile-empty transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

