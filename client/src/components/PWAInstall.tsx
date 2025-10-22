import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
          Download Mobile App
        </Button>
      </div>

      {/* iOS Install Instructions Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Install USA Luxury Limo App
            </DialogTitle>
            <DialogDescription className="text-left pt-4">
              {isIOS ? (
                <div className="space-y-3">
                  <p className="font-semibold">For iPhone/iPad:</p>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>Tap the Share button <span className="inline-block">📤</span> at the bottom of Safari</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right corner</li>
                    <li>The app will appear on your home screen</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-semibold">For Android:</p>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>Open this website in Chrome browser</li>
                    <li>Tap the menu (⋮) in the top right</li>
                    <li>Select "Add to Home screen" or "Install app"</li>
                    <li>Follow the prompts to install</li>
                  </ol>
                </div>
              )}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Benefits:</strong> Works offline, faster loading, native app experience, home screen access
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
