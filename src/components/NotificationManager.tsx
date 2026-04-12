"use client";

import { useState, useEffect, useCallback } from "react";

interface UserStats {
  words_mastered: number;
  daily_streak: number;
  xp_total: number;
  xp_today: number;
  words_to_review: number;
}

function getWordsToReview(): number {
  try {
    const progress = localStorage.getItem("srs_progress");
    if (!progress) return 0;
    const data = JSON.parse(progress);
    if (Array.isArray(data)) {
      return data.filter(
        (w: { nextReview?: string }) =>
          w.nextReview && new Date(w.nextReview) <= new Date()
      ).length;
    }
    return 0;
  } catch {
    return 0;
  }
}

function getStreak(): number {
  try {
    const stats = localStorage.getItem("user_stats");
    if (!stats) return 0;
    const data: UserStats = JSON.parse(stats);
    return data.daily_streak || 0;
  } catch {
    return 0;
  }
}

function hasOpenedToday(): boolean {
  const lastOpen = localStorage.getItem("last_app_open");
  if (!lastOpen) return false;
  const today = new Date().toDateString();
  return lastOpen === today;
}

function markOpenedToday(): void {
  localStorage.setItem("last_app_open", new Date().toDateString());
}

export default function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Check support and current permission on mount
  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    const dismissed = localStorage.getItem("notification_banner_dismissed");
    if (dismissed) setBannerDismissed(true);

    if (Notification.permission === "default" && !dismissed) {
      setShowBanner(true);
    }

    // Mark that the user opened the app today
    markOpenedToday();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowBanner(false);
      if (result === "denied") {
        localStorage.setItem("notification_banner_dismissed", "true");
        setBannerDismissed(true);
      }
    } catch {
      setShowBanner(false);
    }
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    setBannerDismissed(true);
    localStorage.setItem("notification_banner_dismissed", "true");
  }, []);

  // Notification scheduler: check every minute
  useEffect(() => {
    if (permission !== "granted") return;

    const sendNotification = (title: string, body: string, tag: string) => {
      const lastSent = localStorage.getItem(`notif_${tag}_${new Date().toDateString()}`);
      if (lastSent) return; // Already sent today

      try {
        new Notification(title, {
          body,
          icon: "/icons/icon-192.png",
          tag,
          badge: "/icons/icon-192.png",
        });
        localStorage.setItem(`notif_${tag}_${new Date().toDateString()}`, "true");
      } catch {
        // Notification failed silently
      }
    };

    const checkAndNotify = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Morning notification at 8:00
      if (hours === 8 && minutes === 0) {
        if (!hasOpenedToday()) {
          const wordsToReview = getWordsToReview();
          sendNotification(
            "I Love Chinese",
            `Bonjour ! Tu as ${wordsToReview} mots \u00e0 revoir aujourd'hui \ud83d\udcda`,
            "morning"
          );
        }
      }

      // Evening notification at 19:00
      if (hours === 19 && minutes === 0) {
        const streak = getStreak();
        sendNotification(
          "I Love Chinese",
          `N'oublie pas ta session ! \ud83d\udd25 Streak de ${streak} jours en jeu`,
          "evening"
        );
      }
    };

    // Check immediately, then every minute
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60000);

    return () => clearInterval(interval);
  }, [permission]);

  // Achievement notification (callable from outside via custom event)
  useEffect(() => {
    if (permission !== "granted") return;

    const handleAchievement = (e: CustomEvent<{ title: string; body: string }>) => {
      try {
        new Notification(e.detail.title, {
          body: e.detail.body,
          icon: "/icons/icon-192.png",
          tag: "achievement",
        });
      } catch {
        // Notification failed silently
      }
    };

    window.addEventListener("achievement-unlocked", handleAchievement as EventListener);
    return () => window.removeEventListener("achievement-unlocked", handleAchievement as EventListener);
  }, [permission]);

  // Don't render anything if unsupported, already granted, or banner dismissed
  if (permission === "unsupported" || permission === "granted" || !showBanner || bannerDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-[60] animate-fade-in max-w-lg mx-auto">
      <div
        className="bg-white rounded-2xl p-4 shadow-card flex items-start gap-3"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <div className="text-2xl flex-shrink-0 mt-0.5">🔔</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">
            Activez les notifications pour ne pas oublier vos r&eacute;visions !
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={requestPermission}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white btn-3d"
              style={{
                background: "linear-gradient(135deg, #58CC02, #46A302)",
              }}
            >
              Activer
            </button>
            <button
              onClick={dismissBanner}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to trigger achievement notifications from anywhere in the app
export function triggerAchievementNotification(title: string, body: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("achievement-unlocked", {
        detail: { title, body },
      })
    );
  }
}
