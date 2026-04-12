"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { USERS, type AppUser } from "@/lib/auth";

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
}

const DEFAULT_STATS: UserStats = {
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
};

const LOCAL_STORAGE_KEYS = [
  "user_stats",
  "srs_progress",
  "badges",
  "weekly_goal",
  "chat_history",
  "study_calendar",
  "daily_plan",
  "drill_progress",
  "learning_stats",
  "civilization-favorites",
];

function getUserStats(userId: string): UserStats {
  try {
    const raw = localStorage.getItem(`${userId}_user_stats`);
    if (raw) return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_STATS };
}

function getLastActive(userId: string): string {
  try {
    const cal = localStorage.getItem(`${userId}_study_calendar`);
    if (cal) {
      const data = JSON.parse(cal);
      const dates = Object.keys(data).sort().reverse();
      if (dates.length > 0) return dates[0];
    }
  } catch {}
  return "Jamais";
}

function getSrsWordCount(userId: string): number {
  try {
    const raw = localStorage.getItem(`${userId}_srs_progress`);
    if (raw) return Object.keys(JSON.parse(raw)).length;
  } catch {}
  return 0;
}

export default function AdminPage() {
  const router = useRouter();
  const [usersData, setUsersData] = useState<
    (AppUser & { stats: UserStats; lastActive: string; srsWords: number })[]
  >([]);
  const [resetConfirm, setResetConfirm] = useState<string | null>(null);
  const [editHsk, setEditHsk] = useState<string | null>(null);
  const [hskValue, setHskValue] = useState(1);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const data = USERS.map((u) => ({
      ...u,
      stats: getUserStats(u.id),
      lastActive: getLastActive(u.id),
      srsWords: getSrsWordCount(u.id),
    }));
    setUsersData(data);
  }, []);

  useEffect(() => {
    // Check admin auth
    const current = localStorage.getItem("current_user");
    if (current !== "admin") {
      router.replace("/login");
      return;
    }
    loadData();
  }, [router, loadData]);

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    router.push("/login");
  };

  const handleResetUser = (userId: string) => {
    for (const key of LOCAL_STORAGE_KEYS) {
      localStorage.removeItem(`${userId}_${key}`);
    }
    setResetConfirm(null);
    loadData();
  };

  const handleChangeHsk = (userId: string, newLevel: number) => {
    const statsKey = `${userId}_user_stats`;
    const raw = localStorage.getItem(statsKey);
    const stats = raw ? JSON.parse(raw) : { ...DEFAULT_STATS };
    stats.current_hsk_level = newLevel;
    localStorage.setItem(statsKey, JSON.stringify(stats));
    setEditHsk(null);
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-[#1A1A1A] flex items-center gap-2">
            <span>&#x1F527;</span> Administration
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
          >
            D&eacute;connexion
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {usersData.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
          >
            {/* User header row */}
            <button
              onClick={() =>
                setExpandedUser(expandedUser === u.id ? null : u.id)
              }
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F7F7F5] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58CC02] to-[#1CB0F6] flex items-center justify-center text-white font-bold text-sm">
                  {u.displayName.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-bold text-[#1A1A1A]">{u.displayName}</p>
                  <p className="text-xs text-[#6B7280]">HSK {u.stats.current_hsk_level}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#FF9600] font-bold">
                  <span className="text-xs">&#x26A1;</span> {u.stats.xp_total} XP
                </span>
                <span className="text-[#6B7280]">
                  <span className="text-xs">&#x1F525;</span> {u.stats.daily_streak}j
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${
                    expandedUser === u.id ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            {/* Expanded details */}
            {expandedUser === u.id && (
              <div className="border-t border-[#E5E7EB] px-5 py-4 space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatItem label="Mots appris" value={String(u.stats.words_mastered)} />
                  <StatItem label="Mots SRS" value={String(u.srsWords)} />
                  <StatItem label="XP total" value={String(u.stats.xp_total)} />
                  <StatItem label="XP aujourd'hui" value={String(u.stats.xp_today)} />
                  <StatItem label="Streak" value={`${u.stats.daily_streak} jours`} />
                  <StatItem label="Dernier actif" value={u.lastActive} />
                  <StatItem label="Niveau HSK" value={`HSK ${u.stats.current_hsk_level}`} />
                  <StatItem
                    label="R&eacute;visions"
                    value={String(u.stats.total_reviews || 0)}
                  />
                  <StatItem
                    label="Pr&eacute;cision"
                    value={
                      u.stats.total_answers
                        ? `${Math.round(
                            ((u.stats.correct_answers || 0) /
                              u.stats.total_answers) *
                              100
                          )}%`
                        : "N/A"
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {/* Change HSK Level */}
                  {editHsk === u.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={hskValue}
                        onChange={(e) => setHskValue(Number(e.target.value))}
                        className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-lg px-2 py-1.5 text-sm"
                      >
                        {[1, 2, 3, 4].map((l) => (
                          <option key={l} value={l}>
                            HSK {l}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleChangeHsk(u.id, hskValue)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1CB0F6] hover:bg-[#1899D6] transition-colors"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setEditHsk(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditHsk(u.id);
                        setHskValue(u.stats.current_hsk_level);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1CB0F6] bg-[#1CB0F6]/10 hover:bg-[#1CB0F6]/20 transition-colors"
                    >
                      Changer HSK
                    </button>
                  )}

                  {/* Reset */}
                  {resetConfirm === u.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#FF4B4B] font-semibold">
                        Confirmer ?
                      </span>
                      <button
                        onClick={() => handleResetUser(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#FF4B4B] hover:bg-[#E63E3E] transition-colors"
                      >
                        Oui, r&eacute;initialiser
                      </button>
                      <button
                        onClick={() => setResetConfirm(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResetConfirm(u.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FF4B4B] bg-[#FF4B4B]/10 hover:bg-[#FF4B4B]/20 transition-colors"
                    >
                      R&eacute;initialiser
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F7F7F5] rounded-xl px-3 py-2">
      <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">{value}</p>
    </div>
  );
}
