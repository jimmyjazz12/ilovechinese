"use client";

import { useState, useEffect } from "react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Check if mobile
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Check if user dismissed banner
    const dismissed = localStorage.getItem("pwa_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return; // Don't show for 7 days after dismiss
    }

    // Listen for beforeinstallprompt (Chrome/Edge/Samsung)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (mobile && !isStandalone) {
        setShowBanner(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For iOS Safari (no beforeinstallprompt), show manual instructions
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari && !isStandalone) {
      setShowBanner(true);
    }

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa_dismissed", Date.now().toString());
  };

  // Don't show if: not mobile, already installed, or banner hidden
  if (!showBanner || isInstalled || !isMobile) return null;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-slide-up">
      <div
        className="mx-3 mt-3 rounded-2xl p-4 border border-white/10 shadow-card-hover"
        style={{
          background: "rgba(19, 31, 36, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF4B4B] via-[#FF9600] to-[#58CC02] rounded-xl flex items-center justify-center text-xl shadow-card shrink-0">
            🐉
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-sm">Installer I Love Chinese</h3>
            {isIOS ? (
              <p className="text-xs text-[#9EAAB4] mt-1 leading-relaxed">
                Appuyez sur{" "}
                <span className="inline-flex items-center bg-[#223A44] px-1.5 py-0.5 rounded text-white font-semibold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-0.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Partager
                </span>{" "}
                puis <span className="text-white font-semibold">"Sur l'écran d'accueil"</span>
              </p>
            ) : (
              <p className="text-xs text-[#9EAAB4] mt-1">
                Accédez à l'app directement depuis votre écran d'accueil
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#9EAAB4] hover:text-white p-1 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-3 btn-3d bg-gradient-green text-white font-bold py-2.5 rounded-xl text-sm"
          >
            Installer l'application
          </button>
        )}
      </div>
    </div>
  );
}
