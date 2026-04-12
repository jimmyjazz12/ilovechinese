"use client";

import { useState, useEffect, useCallback } from "react";
import { triggerAchievementNotification } from "./NotificationManager";

// ─── Level System ────────────────────────────────────────────────────────────

interface LevelInfo {
  level: number;
  name: string;
  icon: string;
  minXp: number;
  maxXp: number;
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: "D\u00e9butant", icon: "\ud83c\udf31", minXp: 0, maxXp: 99 },
  { level: 2, name: "Explorateur", icon: "\ud83c\udf3f", minXp: 100, maxXp: 299 },
  { level: 3, name: "Apprenti", icon: "\ud83c\udf8b", minXp: 300, maxXp: 599 },
  { level: 4, name: "Disciple", icon: "\ud83c\udfee", minXp: 600, maxXp: 999 },
  { level: 5, name: "Pratiquant", icon: "\u26e9\ufe0f", minXp: 1000, maxXp: 1999 },
  { level: 6, name: "Ma\u00eetre", icon: "\ud83d\udc09", minXp: 2000, maxXp: 3999 },
  { level: 7, name: "Grand Ma\u00eetre", icon: "\ud83d\udc51", minXp: 4000, maxXp: Infinity },
];

function getLevelInfo(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

function getXpProgressInLevel(xp: number): { current: number; needed: number } {
  const level = getLevelInfo(xp);
  if (level.maxXp === Infinity) return { current: xp - level.minXp, needed: 1000 };
  const current = xp - level.minXp;
  const needed = level.maxXp - level.minXp + 1;
  return { current, needed };
}

// ─── Badge System ────────────────────────────────────────────────────────────

export interface BadgeData {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  date_unlocked: string | null;
}

const DEFAULT_BADGES: BadgeData[] = [
  { id: "premier_pas", icon: "\ud83d\udc63", name: "Premier pas", description: "Compl\u00e9ter sa premi\u00e8re session de r\u00e9vision", unlocked: false, date_unlocked: null },
  { id: "serie_3", icon: "\ud83d\udd25", name: "S\u00e9rie de 3", description: "Streak de 3 jours", unlocked: false, date_unlocked: null },
  { id: "semaine_parfaite", icon: "\u2b50", name: "Semaine parfaite", description: "Streak de 7 jours", unlocked: false, date_unlocked: null },
  { id: "mois_or", icon: "\ud83c\udfc6", name: "Mois d'or", description: "Streak de 30 jours", unlocked: false, date_unlocked: null },
  { id: "polyglotte_hsk1", icon: "\ud83c\udf93", name: "Polyglotte HSK1", description: "Ma\u00eetriser tous les mots HSK 1", unlocked: false, date_unlocked: null },
  { id: "tonnerre", icon: "\u26a1", name: "Tonnerre", description: "10 exercices de tons corrects d'affil\u00e9e", unlocked: false, date_unlocked: null },
  { id: "bavard", icon: "\ud83d\udcac", name: "Bavard", description: "Envoyer 20 messages \u00e0 Prof Wang", unlocked: false, date_unlocked: null },
  { id: "explorateur", icon: "\ud83e\udded", name: "Explorateur", description: "Visiter toutes les sections de l'app", unlocked: false, date_unlocked: null },
  { id: "centurion", icon: "\ud83d\udcaf", name: "Centurion", description: "Apprendre 100 mots", unlocked: false, date_unlocked: null },
  { id: "marathonien", icon: "\ud83c\udfc3", name: "Marathonien", description: "\u00c9tudier 30 minutes d'affil\u00e9e", unlocked: false, date_unlocked: null },
];

function loadBadges(): BadgeData[] {
  try {
    const saved = localStorage.getItem("badges");
    if (saved) {
      const parsed: BadgeData[] = JSON.parse(saved);
      // Merge with defaults to handle new badges added later
      return DEFAULT_BADGES.map((def) => {
        const existing = parsed.find((b) => b.id === def.id);
        return existing || def;
      });
    }
  } catch {
    // ignore
  }
  return DEFAULT_BADGES.map((b) => ({ ...b }));
}

function saveBadges(badges: BadgeData[]): void {
  localStorage.setItem("badges", JSON.stringify(badges));
}

// ─── Weekly Goal ─────────────────────────────────────────────────────────────

interface WeeklyGoalData {
  target: number;
  current: number;
  weekStart: string; // ISO date string of Monday
}

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function loadWeeklyGoal(): WeeklyGoalData {
  try {
    const saved = localStorage.getItem("weekly_goal");
    if (saved) {
      const data: WeeklyGoalData = JSON.parse(saved);
      const currentMonday = getCurrentMonday();
      if (data.weekStart === currentMonday) return data;
      // New week, reset progress but keep target
      return { target: data.target, current: 0, weekStart: currentMonday };
    }
  } catch {
    // ignore
  }
  return { target: 20, current: 0, weekStart: getCurrentMonday() };
}

function saveWeeklyGoal(goal: WeeklyGoalData): void {
  localStorage.setItem("weekly_goal", JSON.stringify(goal));
}

// ─── Unlock Badge Helper ─────────────────────────────────────────────────────

export function unlockBadge(badgeId: string): boolean {
  const badges = loadBadges();
  const badge = badges.find((b) => b.id === badgeId);
  if (!badge || badge.unlocked) return false;
  badge.unlocked = true;
  badge.date_unlocked = new Date().toISOString();
  saveBadges(badges);
  triggerAchievementNotification(
    `Badge d\u00e9bloqu\u00e9 : ${badge.name}`,
    badge.description
  );
  // Dispatch event so the Gamification component can re-render
  window.dispatchEvent(new CustomEvent("badge-unlocked", { detail: { badgeId } }));
  return true;
}

// ─── Components ──────────────────────────────────────────────────────────────

interface LevelDisplayProps {
  xp: number;
  compact?: boolean;
}

export function LevelDisplay({ xp, compact = false }: LevelDisplayProps) {
  const level = getLevelInfo(xp);
  const { current, needed } = getXpProgressInLevel(xp);
  const percent = Math.min((current / needed) * 100, 100);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level.level);

  useEffect(() => {
    if (level.level > prevLevel) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 2500);
      setPrevLevel(level.level);
      return () => clearTimeout(timer);
    }
    setPrevLevel(level.level);
  }, [level.level, prevLevel]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{level.icon}</span>
        <span className="text-sm font-bold text-[#1A1A1A]">Niv. {level.level}</span>
        <div className="flex-1 h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percent}%`,
              background: "linear-gradient(90deg, #58CC02, #8DE84E)",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showLevelUp && (
        <div className="absolute inset-0 z-10 flex items-center justify-center animate-level-up">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-card-hover text-center border border-[#E5E7EB]">
            <div className="text-5xl mb-2 animate-bounce-in">{level.icon}</div>
            <div className="text-lg font-extrabold text-[#1A1A1A]">Level up !</div>
            <div className="text-sm text-[#6B7280] font-semibold">{level.name}</div>
          </div>
        </div>
      )}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-card border border-[#E5E7EB]">
          <span className="text-4xl">{level.icon}</span>
          <div className="text-left">
            <div className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
              Niveau {level.level}
            </div>
            <div className="text-lg font-extrabold text-[#1A1A1A]">{level.name}</div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-[#6B7280]">
            <span>{current} XP</span>
            <span>{level.maxXp === Infinity ? "---" : needed} XP</span>
          </div>
          <div className="h-3 rounded-full bg-[#E5E7EB] overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{
                width: `${percent}%`,
                background: "linear-gradient(90deg, #58CC02, #8DE84E)",
                boxShadow: "0 0 8px rgba(88, 204, 2, 0.3)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                  animation: "shimmer 2s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Badges Grid ─────────────────────────────────────────────────────────────

interface BadgesGridProps {
  compact?: boolean;
}

export function BadgesGrid({ compact = false }: BadgesGridProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);

  useEffect(() => {
    setBadges(loadBadges());

    const handleUnlock = () => setBadges(loadBadges());
    window.addEventListener("badge-unlocked", handleUnlock);
    return () => window.removeEventListener("badge-unlocked", handleUnlock);
  }, []);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest">
            Badges
          </h3>
          <span className="text-xs font-semibold text-[#6B7280]">
            {unlockedCount}/{badges.length}
          </span>
        </div>
      )}
      <div className={`grid ${compact ? "grid-cols-5" : "grid-cols-5"} gap-2`}>
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`relative flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${
              badge.unlocked
                ? "bg-white shadow-card border border-[#E5E7EB] badge-glow"
                : "bg-[#F3F4F6] border border-[#E5E7EB] opacity-40 grayscale"
            }`}
            title={`${badge.name}: ${badge.description}`}
          >
            <span className={`text-2xl ${badge.unlocked ? "" : "grayscale"}`}>
              {badge.icon}
            </span>
            {!compact && (
              <span className="text-[9px] font-semibold text-[#1A1A1A] text-center mt-1 leading-tight">
                {badge.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly Goal ─────────────────────────────────────────────────────────────

interface WeeklyGoalProps {
  className?: string;
}

export function WeeklyGoal({ className = "" }: WeeklyGoalProps) {
  const [goal, setGoal] = useState<WeeklyGoalData>({ target: 20, current: 0, weekStart: "" });

  useEffect(() => {
    const loaded = loadWeeklyGoal();
    setGoal(loaded);
    saveWeeklyGoal(loaded); // Persist in case week was reset
  }, []);

  const percent = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
  const isComplete = goal.current >= goal.target;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-card border border-[#E5E7EB] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest">
          Objectif hebdomadaire
        </h3>
        {isComplete && <span className="text-xs font-bold text-[#58CC02]">Complet !</span>}
      </div>
      <p className="text-sm text-[#1A1A1A] font-semibold mb-3">
        Apprendre {goal.target} nouveaux mots cette semaine
      </p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-[#6B7280]">
          <span>{goal.current} mots</span>
          <span>{goal.target} mots</span>
        </div>
        <div className="h-3 rounded-full bg-[#E5E7EB] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percent}%`,
              background: isComplete
                ? "linear-gradient(90deg, #58CC02, #FFD700)"
                : "linear-gradient(90deg, #1CB0F6, #58CC02)",
              boxShadow: isComplete
                ? "0 0 8px rgba(88, 204, 2, 0.4)"
                : "0 0 8px rgba(28, 176, 246, 0.3)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Full Gamification Component ─────────────────────────────────────────────

interface GamificationProps {
  xp?: number;
  showBadges?: boolean;
  showWeeklyGoal?: boolean;
  compact?: boolean;
}

export default function Gamification({
  xp,
  showBadges = true,
  showWeeklyGoal = true,
  compact = false,
}: GamificationProps) {
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    if (xp !== undefined) {
      setTotalXp(xp);
      return;
    }
    try {
      const stats = localStorage.getItem("user_stats");
      if (stats) {
        const data = JSON.parse(stats);
        setTotalXp(data.xp_total || 0);
      }
    } catch {
      // ignore
    }
  }, [xp]);

  return (
    <div className="space-y-4">
      <LevelDisplay xp={totalXp} compact={compact} />
      {showBadges && <BadgesGrid compact={compact} />}
      {showWeeklyGoal && !compact && <WeeklyGoal />}
    </div>
  );
}

// ─── Exports for external use ────────────────────────────────────────────────

export { getLevelInfo, getXpProgressInLevel, loadBadges, saveBadges, loadWeeklyGoal, saveWeeklyGoal };
