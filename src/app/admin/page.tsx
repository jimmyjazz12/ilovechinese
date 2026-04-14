"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { USERS, type AppUser } from "@/lib/auth";
import {
  getErrorReports,
  updateReportStatus,
  applyCorrection,
  type ErrorReport,
} from "@/lib/corrections";

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
  const [activeTab, setActiveTab] = useState<"users" | "reports">("users");
  const [reports, setReports] = useState<ErrorReport[]>([]);

  const loadData = useCallback(() => {
    const data = USERS.map((u) => ({
      ...u,
      stats: getUserStats(u.id),
      lastActive: getLastActive(u.id),
      srsWords: getSrsWordCount(u.id),
    }));
    setUsersData(data);
    setReports(getErrorReports());
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

  const handleApproveReport = (report: ErrorReport) => {
    applyCorrection(report.word, report.field, report.suggestedValue);
    updateReportStatus(report.id, "approved");
    setReports(getErrorReports());
  };

  const handleRejectReport = (id: string) => {
    updateReportStatus(id, "rejected");
    setReports(getErrorReports());
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  const typeLabels: Record<string, string> = {
    wrong_translation: "Traduction",
    wrong_pinyin: "Pinyin",
    wrong_tone: "Ton",
    other: "Autre",
  };

  const statusBadge = (status: ErrorReport["status"]) => {
    if (status === "pending")
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3E0] text-[#FF9600]">
          En attente
        </span>
      );
    if (status === "approved")
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669]">
          &#x2713; Approuv&eacute;
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
        &#x2717; Rejet&eacute;
      </span>
    );
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
        {/* Tab selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "users"
                ? "bg-[#1CB0F6] text-white shadow-md"
                : "bg-white text-[#6B7280] border border-[#E5E7EB]"
            }`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
              activeTab === "reports"
                ? "bg-[#FF9600] text-white shadow-md"
                : "bg-white text-[#6B7280] border border-[#E5E7EB]"
            }`}
          >
            Signalements
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FF4B4B] text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Reports tab */}
        {activeTab === "reports" && (
          <div className="space-y-3">
            {/* Export buttons */}
            {reports.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    const pending = reports.filter(r => r.status === "pending");
                    const text = pending.map(r =>
                      `${r.word} | ${r.type} | Actuel: "${r.currentValue}" → Suggéré: "${r.suggestedValue}"${r.comment ? ` | Note: ${r.comment}` : ""}`
                    ).join("\n");
                    navigator.clipboard.writeText(text);
                    alert(`${pending.length} signalement(s) copié(s) dans le presse-papier !\nCollez-les dans le chat Claude pour correction.`);
                  }}
                  className="flex-1 bg-[#CE82FF] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#B86EE6] transition-all"
                >
                  📋 Copier pour Claude ({reports.filter(r => r.status === "pending").length})
                </button>
                <button
                  onClick={() => {
                    const json = JSON.stringify(reports.filter(r => r.status === "pending"), null, 2);
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `signalements-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-white border border-[#E5E7EB] text-[#6B7280] font-bold py-2.5 px-4 rounded-xl text-sm hover:bg-[#F7F7F5] transition-all"
                >
                  💾 JSON
                </button>
              </div>
            )}

            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] text-center">
                <div className="text-3xl mb-2">&#x2705;</div>
                <p className="text-[#6B7280] text-sm">Aucun signalement pour le moment.</p>
              </div>
            ) : (
              reports
                .sort((a, b) => {
                  // pending first, then by date desc
                  if (a.status === "pending" && b.status !== "pending") return -1;
                  if (a.status !== "pending" && b.status === "pending") return 1;
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                })
                .map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xl font-bold text-[#1A1A1A] mr-2">{report.word}</span>
                        {statusBadge(report.status)}
                      </div>
                      <span className="text-[10px] text-[#6B7280]">
                        {new Date(report.date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#F7F7F5] rounded-lg px-2 py-1.5">
                        <span className="text-[#6B7280]">Type : </span>
                        <span className="font-semibold text-[#1A1A1A]">{typeLabels[report.type] || report.type}</span>
                      </div>
                      <div className="bg-[#F7F7F5] rounded-lg px-2 py-1.5">
                        <span className="text-[#6B7280]">Champ : </span>
                        <span className="font-semibold text-[#1A1A1A]">{report.field}</span>
                      </div>
                      <div className="bg-[#FEF2F2] rounded-lg px-2 py-1.5">
                        <span className="text-[#6B7280]">Actuel : </span>
                        <span className="font-semibold text-[#DC2626]">{report.currentValue || "—"}</span>
                      </div>
                      <div className="bg-[#ECFDF5] rounded-lg px-2 py-1.5">
                        <span className="text-[#6B7280]">Suggestion : </span>
                        <span className="font-semibold text-[#059669]">{report.suggestedValue}</span>
                      </div>
                    </div>

                    {report.comment && (
                      <p className="text-xs text-[#6B7280] italic bg-[#F7F7F5] rounded-lg px-2 py-1.5">
                        {report.comment}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#6B7280]">
                        Par : {report.userId}
                      </span>
                      {report.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveReport(report)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#58CC02] hover:bg-[#46A302] transition-colors"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={() => handleRejectReport(report.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#FF4B4B] hover:bg-[#E63E3E] transition-colors"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Users tab */}
        {activeTab === "users" && usersData.map((u) => (
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
