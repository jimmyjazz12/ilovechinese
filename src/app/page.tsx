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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Bonne nuit";
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{display}</>;
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
    if (saved) setStats(JSON.parse(saved));
  }, []);

  const quickActions = [
    {
      href: "/review",
      icon: "🧠",
      title: "Révision",
      subtitle: `${stats.words_to_review} mots à revoir`,
      gradient: "from-[#58CC02] to-[#46A302]",
      glow: "shadow-glow-green",
    },
    {
      href: "/vocabulary",
      icon: "📚",
      title: "Vocabulaire",
      subtitle: `HSK ${stats.current_hsk_level}`,
      gradient: "from-[#1CB0F6] to-[#1899D6]",
      glow: "shadow-glow-blue",
    },
    {
      href: "/translate",
      icon: "🔄",
      title: "Traduction",
      subtitle: "FR ↔ 中文",
      gradient: "from-[#FF9600] to-[#E68600]",
      glow: "shadow-glow-orange",
    },
    {
      href: "/pronunciation",
      icon: "🎙️",
      title: "Prononciation",
      subtitle: "Sons & Mots",
      gradient: "from-[#CE82FF] to-[#A855F7]",
      glow: "shadow-glow-purple",
    },
    {
      href: "/grammar",
      icon: "📝",
      title: "Grammaire",
      subtitle: "Règles & Quiz",
      gradient: "from-[#FF4B4B] to-[#E63E3E]",
      glow: "",
    },
    {
      href: "/chat",
      icon: "👨‍🏫",
      title: "Prof Wang",
      subtitle: "Conversation IA",
      gradient: "from-[#1899D6] to-[#1480B8]",
      glow: "shadow-glow-blue",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF4B4B] to-[#FF9600] rounded-xl flex items-center justify-center text-xl shadow-card">
              🐉
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">I Love Chinese</h1>
              <p className="text-xs text-[#9EAAB4]">{getGreeting()} !</p>
            </div>
          </div>
          <div className="flex items-center gap-4 animate-fade-in animate-delay-1">
            <div className="flex items-center gap-1.5 bg-[#FF9600]/10 px-3 py-1.5 rounded-full">
              <span className="text-sm">🔥</span>
              <span className="font-bold text-sm text-[#FF9600]">{stats.daily_streak}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FFD900]/10 px-3 py-1.5 rounded-full">
              <span className="text-sm">⚡</span>
              <span className="font-bold text-sm text-[#FFD900]">{stats.xp_total}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Daily Goal */}
        <div className="animate-fade-in animate-delay-1">
          <DailyGoal currentXp={stats.xp_today} goalXp={50} streak={stats.daily_streak} />
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-card rounded-2xl p-5 border border-white/5 shadow-card animate-fade-in animate-delay-2">
          <h2 className="font-bold text-xs text-[#9EAAB4] uppercase tracking-widest mb-4">
            Progression HSK {stats.current_hsk_level}
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#58CC02]">
                <AnimatedNumber value={stats.words_mastered} />
              </div>
              <div className="text-[10px] text-[#9EAAB4] uppercase tracking-wider font-semibold">Maîtrisés</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#FF9600]">
                <AnimatedNumber value={stats.words_in_progress} />
              </div>
              <div className="text-[10px] text-[#9EAAB4] uppercase tracking-wider font-semibold">En cours</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#1CB0F6]">
                <AnimatedNumber value={stats.words_to_review} />
              </div>
              <div className="text-[10px] text-[#9EAAB4] uppercase tracking-wider font-semibold">À revoir</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in animate-delay-3">
          <h2 className="font-bold text-xs text-[#9EAAB4] uppercase tracking-widest mb-3">
            Activités
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group bg-gradient-card rounded-2xl p-4 border border-white/5 shadow-card hover-lift transition-all duration-200 animate-fade-in`}
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                <div className={`w-11 h-11 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center text-xl mb-3 shadow-card group-hover:scale-110 transition-transform duration-200`}>
                  {action.icon}
                </div>
                <div className="font-bold text-sm">{action.title}</div>
                <div className="text-xs text-[#9EAAB4] mt-0.5">{action.subtitle}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
