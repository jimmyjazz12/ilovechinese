"use client";

import { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import DailyGoal from "@/components/DailyGoal";
import StreakCalendar from "@/components/StreakCalendar";
import Link from "next/link";

interface Stats {
  words_mastered: number;
  daily_streak: number;
  xp_total: number;
  xp_today: number;
  current_hsk_level: number;
  words_in_progress: number;
  words_to_review: number;
}

interface DailyPlan {
  date: string;
  urgent_review: boolean;
  consolidate_review: boolean;
  new_words: boolean;
  grammar: boolean;
  civilization: boolean;
}

interface DayData {
  xp: number;
  completed: boolean;
}

type StudyCalendar = Record<string, DayData>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Bonne nuit";
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    words_mastered: 0,
    daily_streak: 0,
    xp_total: 0,
    xp_today: 0,
    current_hsk_level: 1,
    words_in_progress: 0,
    words_to_review: 0,
  });

  const [urgentCount, setUrgentCount] = useState(0);
  const [consolidateCount, setConsolidateCount] = useState(0);
  const [newWordsCount] = useState(3);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan>({
    date: todayKey(),
    urgent_review: false,
    consolidate_review: false,
    new_words: false,
    grammar: false,
    civilization: false,
  });

  // Calculate streak from study_calendar
  const calculateStreak = useCallback((cal: StudyCalendar): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let current = 0;
    const d = new Date(today);

    const key = d.toISOString().split("T")[0];
    if (cal[key] && cal[key].xp > 0) {
      current = 1;
      d.setDate(d.getDate() - 1);
    } else {
      // Check yesterday
      d.setDate(d.getDate() - 1);
      const yKey = d.toISOString().split("T")[0];
      if (!(cal[yKey] && cal[yKey].xp > 0)) return 0;
      current = 1;
      d.setDate(d.getDate() - 1);
    }

    while (true) {
      const k = d.toISOString().split("T")[0];
      if (cal[k] && cal[k].xp > 0) {
        current++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return current;
  }, []);

  useEffect(() => {
    // Load user stats
    const savedStats = localStorage.getItem("user_stats");
    let currentStats: Stats = {
      words_mastered: 0,
      daily_streak: 0,
      xp_total: 0,
      xp_today: 0,
      current_hsk_level: 1,
      words_in_progress: 0,
      words_to_review: 0,
    };
    if (savedStats) {
      try {
        currentStats = JSON.parse(savedStats);
      } catch {
        /* ignore */
      }
    }

    // Read SRS progress to count words by box
    let urgent = 0;
    let consolidate = 0;
    const srsData = localStorage.getItem("srs_progress");
    if (srsData) {
      try {
        const progress = JSON.parse(srsData);
        // progress is expected to be { [word]: { box: number, ... } } or an array
        if (Array.isArray(progress)) {
          for (const item of progress) {
            const box = item.box ?? item.level ?? 0;
            if (box <= 2) urgent++;
            else if (box <= 4) consolidate++;
          }
        } else if (typeof progress === "object") {
          for (const key of Object.keys(progress)) {
            const box = progress[key].box ?? progress[key].level ?? 0;
            if (box <= 2) urgent++;
            else if (box <= 4) consolidate++;
          }
        }
      } catch {
        /* ignore */
      }
    }
    setUrgentCount(urgent);
    setConsolidateCount(consolidate);

    // Update words_to_review in stats
    currentStats.words_to_review = urgent + consolidate;

    // Load daily plan
    const savedPlan = localStorage.getItem("daily_plan");
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        if (plan.date === todayKey()) {
          setDailyPlan(plan);
        } else {
          // New day, reset plan
          const fresh: DailyPlan = {
            date: todayKey(),
            urgent_review: false,
            consolidate_review: false,
            new_words: false,
            grammar: false,
            civilization: false,
          };
          setDailyPlan(fresh);
          localStorage.setItem("daily_plan", JSON.stringify(fresh));
        }
      } catch {
        /* ignore */
      }
    }

    // Update study_calendar for today
    const calRaw = localStorage.getItem("study_calendar");
    let cal: StudyCalendar = {};
    if (calRaw) {
      try {
        cal = JSON.parse(calRaw);
      } catch {
        /* ignore */
      }
    }
    const tk = todayKey();
    const todayEntry = cal[tk] || { xp: 0, completed: false };
    todayEntry.xp = currentStats.xp_today;
    // Check if plan is fully completed
    const planForCheck = savedPlan ? JSON.parse(savedPlan) : null;
    if (planForCheck && planForCheck.date === tk) {
      const allDone =
        planForCheck.urgent_review &&
        planForCheck.consolidate_review &&
        planForCheck.new_words &&
        planForCheck.grammar &&
        planForCheck.civilization;
      todayEntry.completed = allDone;
    }
    cal[tk] = todayEntry;
    localStorage.setItem("study_calendar", JSON.stringify(cal));

    // Calculate and save streak
    const streak = calculateStreak(cal);
    currentStats.daily_streak = streak;
    localStorage.setItem("user_stats", JSON.stringify(currentStats));
    setStats(currentStats);
  }, [calculateStreak]);

  const togglePlanItem = (item: keyof Omit<DailyPlan, "date">) => {
    setDailyPlan((prev) => {
      const updated = { ...prev, [item]: !prev[item] };
      localStorage.setItem("daily_plan", JSON.stringify(updated));

      // Update study_calendar completion status
      const calRaw = localStorage.getItem("study_calendar");
      let cal: StudyCalendar = {};
      if (calRaw) {
        try { cal = JSON.parse(calRaw); } catch { /* */ }
      }
      const tk = todayKey();
      const entry = cal[tk] || { xp: 0, completed: false };
      entry.completed =
        updated.urgent_review &&
        updated.consolidate_review &&
        updated.new_words &&
        updated.grammar &&
        updated.civilization;
      cal[tk] = entry;
      localStorage.setItem("study_calendar", JSON.stringify(cal));

      return updated;
    });
  };

  const completedCount = [
    dailyPlan.urgent_review,
    dailyPlan.consolidate_review,
    dailyPlan.new_words,
    dailyPlan.grammar,
    dailyPlan.civilization,
  ].filter(Boolean).length;

  const planItems = [
    {
      key: "urgent_review" as const,
      icon: "🔴",
      label: `${urgentCount} mots à revoir`,
      sublabel: "Urgents (boîtes 0-2)",
      href: "/review",
      checked: dailyPlan.urgent_review,
    },
    {
      key: "consolidate_review" as const,
      icon: "🟡",
      label: `${consolidateCount} mots à consolider`,
      sublabel: "Boîtes 3-4",
      href: "/review",
      checked: dailyPlan.consolidate_review,
    },
    {
      key: "new_words" as const,
      icon: "🟢",
      label: `${newWordsCount} nouveaux mots à découvrir`,
      sublabel: "Apprentissage",
      href: "/vocabulary",
      checked: dailyPlan.new_words,
    },
    {
      key: "grammar" as const,
      icon: "📝",
      label: "1 règle de grammaire",
      sublabel: "Compréhension",
      href: "/grammar",
      checked: dailyPlan.grammar,
    },
    {
      key: "civilization" as const,
      icon: "🏯",
      label: "Anecdote du jour",
      sublabel: "Culture",
      href: "/civilization",
      checked: dailyPlan.civilization,
    },
  ];

  const quickActions = [
    {
      href: "/review",
      icon: "🧠",
      title: "Révision",
      color: "bg-[#58CC02]",
    },
    {
      href: "/vocabulary",
      icon: "📚",
      title: "Vocabulaire",
      color: "bg-[#1CB0F6]",
    },
    {
      href: "/translate",
      icon: "🔄",
      title: "Traduction",
      color: "bg-[#FF9600]",
    },
    {
      href: "/pronunciation",
      icon: "🎙️",
      title: "Prononciation",
      color: "bg-[#CE82FF]",
    },
    {
      href: "/grammar",
      icon: "📝",
      title: "Grammaire",
      color: "bg-[#FF4B4B]",
    },
    {
      href: "/chat",
      icon: "👨‍🏫",
      title: "Prof Wang",
      color: "bg-[#1899D6]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF4B4B] to-[#FF9600] rounded-xl flex items-center justify-center text-xl shadow-card">
              🐉
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-[#1A1A1A]">I Love Chinese</h1>
              <p className="text-xs text-[#6B7280]">{getGreeting()} !</p>
            </div>
          </div>
          <div className="flex items-center gap-3 animate-fade-in animate-delay-1">
            <div className="flex items-center gap-1.5 bg-[#FF9600]/15 px-3 py-1.5 rounded-full">
              <span className="text-sm">🔥</span>
              <span className="font-bold text-sm text-[#FF9600]">{stats.daily_streak}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FFD900]/15 px-3 py-1.5 rounded-full">
              <span className="text-sm">⚡</span>
              <span className="font-bold text-sm text-[#FFD900]">{stats.xp_total}</span>
            </div>
            <Link
              href="/profile"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#58CC02] to-[#1CB0F6] flex items-center justify-center shadow-card hover:scale-110 transition-transform"
              aria-label="Profil"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-28">
        {/* Quick session button */}
        <Link
          href="/review"
          className="block w-full bg-gradient-to-r from-[#58CC02] to-[#46A302] text-white text-center font-bold text-base py-4 rounded-2xl shadow-card hover-lift transition-all duration-200 animate-fade-in btn-3d"
        >
          Session rapide (5 min)
        </Link>

        {/* Daily Plan */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-card animate-fade-in animate-delay-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest">
              Ton plan du jour
            </h2>
            <span className="text-xs font-bold text-[#58CC02]">
              {completedCount}/5
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#58CC02] to-[#1CB0F6] rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            {planItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 group"
              >
                {/* Checkbox */}
                <button
                  onClick={() => togglePlanItem(item.key)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    item.checked
                      ? "bg-[#58CC02] border-[#58CC02]"
                      : "border-[#E5E7EB] hover:border-[#58CC02]"
                  }`}
                >
                  {item.checked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {/* Item content */}
                <Link
                  href={item.href}
                  className={`flex-1 flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200 hover:bg-[#F7F7F5] ${
                    item.checked ? "opacity-60" : ""
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-semibold text-[#1A1A1A] ${
                        item.checked ? "line-through" : ""
                      }`}
                    >
                      {item.label}
                    </span>
                    <p className="text-[10px] text-[#6B7280]">{item.sublabel}</p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[#6B7280] group-hover:text-[#1A1A1A] transition-colors"
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            ))}

            {/* XP Objective */}
            <div className="flex items-center gap-3 pt-1">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <span className="text-base">🎯</span>
              </div>
              <div className="flex-1 py-2 px-3">
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  Objectif : {stats.xp_today}/50 XP
                </span>
                <div className="w-full h-1 bg-[#E5E7EB] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#FFD900] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.xp_today / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal Ring */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-card animate-fade-in animate-delay-2">
          <DailyGoal currentXp={stats.xp_today} goalXp={50} streak={stats.daily_streak} />
        </div>

        {/* Streak Calendar */}
        <div className="animate-fade-in animate-delay-3">
          <StreakCalendar />
        </div>

        {/* Quick Access Grid */}
        <div className="animate-fade-in animate-delay-4">
          <h2 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest mb-3">
            Activités
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {quickActions.map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-xl p-3 border border-[#E5E7EB] shadow-card hover-lift transition-all duration-200 flex flex-col items-center gap-2 text-center animate-fade-in"
                style={{ animationDelay: `${400 + i * 60}ms` }}
              >
                <div
                  className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-lg shadow-card`}
                >
                  {action.icon}
                </div>
                <span className="font-bold text-xs text-[#1A1A1A]">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
