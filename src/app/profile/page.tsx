"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import Gamification, {
  LevelDisplay,
  BadgesGrid,
  WeeklyGoal,
  getLevelInfo,
  loadBadges,
} from "@/components/Gamification";

interface UserStats {
  words_mastered: number;
  daily_streak: number;
  xp_total: number;
  xp_today: number;
  current_hsk_level: number;
  words_in_progress: number;
  words_to_review: number;
  total_reviews?: number;
  correct_answers?: number;
  total_answers?: number;
  favorite_category?: string;
}

interface StreakDay {
  date: string;
  active: boolean;
}

function getStreakCalendar(streak: number): StreakDay[] {
  const days: StreakDay[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split("T")[0],
      active: i < streak,
    });
  }
  return days;
}

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export default function ProfilePage() {
  const { user, logout, getUserKey } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<UserStats>({
    words_mastered: 0,
    daily_streak: 0,
    xp_total: 0,
    xp_today: 0,
    current_hsk_level: 1,
    words_in_progress: 0,
    words_to_review: 0,
    total_reviews: 0,
    correct_answers: 0,
    total_answers: 0,
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(getUserKey("user_stats"));
      if (saved) setStats(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [getUserKey]);

  const accuracy =
    stats.total_answers && stats.total_answers > 0
      ? Math.round(((stats.correct_answers || 0) / stats.total_answers) * 100)
      : 0;

  const level = getLevelInfo(stats.xp_total);
  const streakDays = getStreakCalendar(stats.daily_streak);
  const badges = loadBadges();
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const handleReset = useCallback(() => {
    localStorage.removeItem(getUserKey("user_stats"));
    localStorage.removeItem(getUserKey("srs_progress"));
    localStorage.removeItem(getUserKey("badges"));
    localStorage.removeItem(getUserKey("weekly_goal"));
    localStorage.removeItem(getUserKey("chat_messages"));
    localStorage.removeItem(getUserKey("visited_sections"));
    setStats({
      words_mastered: 0,
      daily_streak: 0,
      xp_total: 0,
      xp_today: 0,
      current_hsk_level: 1,
      words_in_progress: 0,
      words_to_review: 0,
      total_reviews: 0,
      correct_answers: 0,
      total_answers: 0,
    });
    setShowResetConfirm(false);
  }, [getUserKey]);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="text-lg font-extrabold text-[#1A1A1A]">
            {user ? `Profil de ${user.displayName}` : "Mon Profil"}
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-10">
        {/* Level & XP */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E5E7EB] animate-fade-in">
          <h2 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest mb-4">
            Niveau
          </h2>
          <LevelDisplay xp={stats.xp_total} />
        </div>

        {/* Streak Calendar */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E5E7EB] animate-fade-in animate-delay-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest">
              Streak
            </h2>
            <div className="flex items-center gap-1.5 bg-[#FF9600]/15 px-3 py-1 rounded-full">
              <span className="text-sm">🔥</span>
              <span className="font-bold text-sm text-[#FF9600]">
                {stats.daily_streak} jours
              </span>
            </div>
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <div
                key={`label-${i}`}
                className="text-center text-[10px] font-semibold text-[#6B7280] pb-1"
              >
                {label}
              </div>
            ))}
            {/* Offset for first day alignment */}
            {(() => {
              const firstDate = new Date(streakDays[0].date);
              const dayOfWeek = firstDate.getDay();
              const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              return Array.from({ length: offset }, (_, i) => (
                <div key={`offset-${i}`} />
              ));
            })()}
            {streakDays.map((day) => (
              <div
                key={day.date}
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all ${
                  day.active
                    ? "bg-[#58CC02] text-white shadow-glow-green"
                    : "bg-[#F3F4F6] text-[#9CA3AF]"
                }`}
              >
                {new Date(day.date).getDate()}
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E5E7EB] animate-fade-in animate-delay-2">
          <BadgesGrid />
        </div>

        {/* Weekly Goal */}
        <div className="animate-fade-in animate-delay-3">
          <WeeklyGoal />
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E5E7EB] animate-fade-in animate-delay-4">
          <h2 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest mb-4">
            Statistiques
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon="📚"
              label="Mots appris"
              value={stats.words_mastered.toString()}
              color="#58CC02"
            />
            <StatCard
              icon="🧠"
              label="R\u00e9visions totales"
              value={(stats.total_reviews || 0).toString()}
              color="#1CB0F6"
            />
            <StatCard
              icon="🎯"
              label="Pr\u00e9cision"
              value={`${accuracy}%`}
              color="#FF9600"
            />
            <StatCard
              icon="⭐"
              label="Badges"
              value={`${unlockedCount}/${badges.length}`}
              color="#CE82FF"
            />
          </div>
        </div>

        {/* Reset */}
        <div className="animate-fade-in animate-delay-5">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-[#6B7280] bg-white border border-[#E5E7EB] shadow-card hover:bg-[#F3F4F6] transition-colors"
            >
              R&eacute;initialiser la progression
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-card border border-[#FF4B4B]/30 space-y-3">
              <p className="text-sm font-semibold text-[#1A1A1A] text-center">
                Toute ta progression sera perdue. Continuer ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                  style={{ background: "linear-gradient(135deg, #FF4B4B, #E63E3E)" }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="animate-fade-in animate-delay-6">
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white shadow-card transition-colors"
            style={{ background: "linear-gradient(135deg, #6B7280, #4B5563)" }}
          >
            D&eacute;connexion
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#F7F7F5] rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-semibold text-[#6B7280]">{label}</span>
      </div>
      <div className="text-2xl font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
