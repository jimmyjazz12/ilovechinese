"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import DailyGoal from "@/components/DailyGoal";
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

  useEffect(() => {
    const saved = localStorage.getItem("user_stats");
    if (saved) {
      setStats(JSON.parse(saved));
    }
  }, []);

  const quickActions = [
    {
      href: "/review",
      icon: "🧠",
      title: "Révision",
      subtitle: `${stats.words_to_review} mots à revoir`,
      color: "bg-[#58CC02]",
    },
    {
      href: "/vocabulary",
      icon: "📚",
      title: "Vocabulaire",
      subtitle: `HSK ${stats.current_hsk_level}`,
      color: "bg-[#1CB0F6]",
    },
    {
      href: "/translate",
      icon: "🔄",
      title: "Traduction",
      subtitle: "FR ↔ 中文",
      color: "bg-[#FF9600]",
    },
    {
      href: "/pronunciation",
      icon: "🎙️",
      title: "Prononciation",
      subtitle: "Initiales & Finales",
      color: "bg-[#CE82FF]",
    },
    {
      href: "/grammar",
      icon: "📝",
      title: "Grammaire",
      subtitle: "Règles & Quiz",
      color: "bg-[#FF4B4B]",
    },
    {
      href: "/chat",
      icon: "👨‍🏫",
      title: "Prof IA",
      subtitle: "Conversation",
      color: "bg-[#1899D6]",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#131F24] border-b border-[#2A4050] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐉</span>
            <h1 className="text-lg font-bold">I Love Chinese</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#FF9600]">
              <span>🔥</span>
              <span className="font-bold text-sm">{stats.daily_streak}</span>
            </div>
            <div className="flex items-center gap-1 text-[#FFD900]">
              <span>⚡</span>
              <span className="font-bold text-sm">{stats.xp_total}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Daily Goal */}
        <DailyGoal currentXp={stats.xp_today} goalXp={50} streak={stats.daily_streak} />

        {/* Progress Overview */}
        <div className="bg-[#1A2C34] rounded-2xl p-4 border border-[#2A4050]">
          <h2 className="font-bold text-sm text-[#9EAAB4] uppercase tracking-wide mb-3">
            Progression HSK {stats.current_hsk_level}
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-[#58CC02]">{stats.words_mastered}</div>
              <div className="text-xs text-[#9EAAB4]">Maîtrisés</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#FF9600]">{stats.words_in_progress}</div>
              <div className="text-xs text-[#9EAAB4]">En cours</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1CB0F6]">{stats.words_to_review}</div>
              <div className="text-xs text-[#9EAAB4]">À revoir</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-bold text-sm text-[#9EAAB4] uppercase tracking-wide mb-3">
            Activités
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-[#1A2C34] rounded-2xl p-4 border border-[#2A4050] hover:border-[#3A5060] transition-all active:scale-95"
              >
                <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-xl mb-2`}>
                  {action.icon}
                </div>
                <div className="font-bold text-sm">{action.title}</div>
                <div className="text-xs text-[#9EAAB4]">{action.subtitle}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
