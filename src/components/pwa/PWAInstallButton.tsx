import React, { useState } from 'react';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <Button
        onClick={install}
        className="flex items-center gap-2 bg-dpc-blue hover:bg-navy text-white shadow-lg animate-bounce"
        size="sm"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </Button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <Button
          onClick={() => setShowIOSGuide(true)}
          variant="outline"
          className="flex items-center gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          size="sm"
        >
          <Smartphone className="w-4 h-4" />
          <span>Add to Home Screen</span>
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl relative animate-in zoom-in-95">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Smartphone className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-navy">Install on iPhone</h3>
                  <p className="text-sm text-text-muted leading-relaxed px-4">
                    Get the best experience by adding <strong>Diaspora Point Connect</strong> to your home screen.
                  </p>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-6 text-left space-y-4 border border-neutral-100">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-xs font-bold text-navy shrink-0">1</div>
                    <p className="text-sm text-navy">Tap the <strong>Share</strong> icon (the square with an arrow) in Safari.</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-xs font-bold text-navy shrink-0">2</div>
                    <p className="text-sm text-navy">Scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-xs font-bold text-navy shrink-0">3</div>
                    <p className="text-sm text-navy">Tap <strong>"Add"</strong> in the top right corner.</p>
                  </div>
                </div>

                <Button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full bg-navy h-12 rounded-xl font-bold"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
