"use client";

import { useEffect, useState } from "react";

interface DailyGoalProps {
  currentXp: number;
  goalXp: number;
  streak?: number;
  className?: string;
}

export default function DailyGoal({
  currentXp,
  goalXp,
  streak = 0,
  className = "",
}: DailyGoalProps) {
  const [offset, setOffset] = useState(circumference());
  const percent = goalXp > 0 ? Math.min(currentXp / goalXp, 1) : 0;
  const radius = 54;

  function circumference() {
    return 2 * Math.PI * radius;
  }

  useEffect(() => {
    const c = circumference();
    const t = requestAnimationFrame(() => {
      setOffset(c - percent * c);
    });
    return () => cancelAnimationFrame(t);
  }, [percent]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="var(--color-border)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="var(--color-green)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference()}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{currentXp}</span>
          <span className="text-xs text-[var(--color-text-secondary)]">XP</span>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] font-medium">
        Objectif du jour : {currentXp}/{goalXp} XP
      </p>

      {streak > 0 && (
        <div className="flex items-center gap-1.5 text-[var(--color-orange)] font-bold">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2c.5 3.5 3 6 3 9.5a6 6 0 0 1-12 0C3 8 5.5 5.5 6 2c1 3 2.5 4 3 5.5C9.5 5 11 3 12 2z" />
          </svg>
          <span>{streak} jours</span>
        </div>
      )}
    </div>
  );
}
