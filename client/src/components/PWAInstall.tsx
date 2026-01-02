import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranding } from "@/hooks/useBranding";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstall() {
  const { t } = useTranslation();
  const { companyName } = useBranding();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowInstallDialog(true);
      return;
    }

    if (!deferredPrompt) {
      setShowInstallDialog(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleInstallClick}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-6 rounded-lg font-semibold text-base shadow-lg transition-all flex items-center justify-center gap-2"
          data-testid="button-install-pwa"
        >
          <Smartphone className="w-5 h-5" />
          {t('pwa.downloadButton')}
        </Button>
      </div>

      {/* iOS Install Instructions Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-md bg-[#ffffff]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t('pwa.dialogTitle', { companyName })}
            </DialogTitle>
            <DialogDescription className="text-left pt-4">
              {isIOS ? (
                <div className="space-y-3">
                  <p className="font-semibold">{t('pwa.ios.title')}</p>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>{t('pwa.ios.step1')} <span className="inline-block">📤</span></li>
                    <li>{t('pwa.ios.step2')}</li>
                    <li>{t('pwa.ios.step3')}</li>
                    <li>{t('pwa.ios.step4')}</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-semibold">{t('pwa.android.title')}</p>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>{t('pwa.android.step1')}</li>
                    <li>{t('pwa.android.step2')}</li>
                    <li>{t('pwa.android.step3')}</li>
                    <li>{t('pwa.android.step4')}</li>
                  </ol>
                </div>
              )}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>{t('pwa.benefits.title')}</strong> {t('pwa.benefits.description')}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
