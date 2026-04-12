"use client";

import { useEffect, useState, useRef } from "react";

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
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const percent = goalXp > 0 ? Math.min(currentXp / goalXp, 1) : 0;
  const [offset, setOffset] = useState(circ);
  const [displayXp, setDisplayXp] = useState(0);
  const animFrameRef = useRef<number>(0);

  // Animate the ring
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setOffset(circ - percent * circ);
    });
    return () => cancelAnimationFrame(t);
  }, [percent, circ]);

  // Count-up animation
  useEffect(() => {
    const duration = 1000;
    const startTime = performance.now();
    const startVal = 0;
    const endVal = currentXp;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXp(Math.round(startVal + (endVal - startVal) * eased));
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentXp]);

  const gradientId = "progress-gradient";

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#58CC02" />
              <stop offset="100%" stopColor="#1CB0F6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
            opacity="0.7"
          />
          {/* Progress ring with gradient + glow */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            filter="url(#glow)"
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-extrabold text-[#1A1A1A]"
          >
            {displayXp}
          </span>
          <span className="text-xs text-[#6B7280] font-semibold tracking-wide">
            XP
          </span>
        </div>
      </div>

      <p className="text-sm text-[#6B7280] font-medium">
        Objectif du jour : <span className="text-[#1A1A1A] font-bold">{currentXp}</span>/{goalXp} XP
      </p>

      {streak > 0 && (
        <div className="flex items-center gap-2 text-[#FF9600] font-bold">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-[0_0_6px_rgba(255,150,0,0.5)]"
          >
            <defs>
              <linearGradient id="flame-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FF4B4B" />
                <stop offset="50%" stopColor="#FF9600" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
            <path
              d="M12 2c.5 3.5 3 6 3 9.5a6 6 0 0 1-12 0C3 8 5.5 5.5 6 2c1 3 2.5 4 3 5.5C9.5 5 11 3 12 2z"
              fill="url(#flame-grad)"
            />
          </svg>
          <span className="text-base">{streak} jours</span>
        </div>
      )}
    </div>
  );
}
