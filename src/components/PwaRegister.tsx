'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('PWA: Service Worker registered successfully, scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA: Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
      }

      // 3. Listen for install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Check if user dismissed before
        const dismissed = localStorage.getItem('sowasuco_pwa_dismissed');
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setShowInstallBanner(false);
        setDeferredPrompt(null);
      });

      // 4. Online/Offline status
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('sowasuco_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-900 text-xs px-4 py-2 text-center font-medium shadow-sm flex items-center justify-center gap-2 print:hidden z-50">
          <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping"></span>
          <span>Bạn đang ở chế độ ngoại tuyến (Offline). Các trang đã lưu vẫn có thể xem được.</span>
        </div>
      )}

      {/* Floating Install Prompt Banner (Mobile & Desktop) */}
      {showInstallBanner && !isInstalled && deferredPrompt && (
        <aside 
          aria-label="Cài đặt ứng dụng PWA"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-white/95 backdrop-blur-md border border-brand-200 rounded-2xl shadow-xl p-4 z-50 flex items-center gap-3 print:hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">Cài đặt ứng dụng QL Kho</h4>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              Mở nhanh từ màn hình chính, tra cứu mượt mà không cần mở trình duyệt.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Cài đặt
            </button>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              title="Để sau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
