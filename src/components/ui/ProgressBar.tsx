"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showFraction?: boolean;
  shimmer?: boolean;
  color?: string;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  label,
  showFraction = false,
  shimmer = false,
  color,
  className = "",
}: ProgressBarProps) {
  const [animated, setAnimated] = useState(false);
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const fillColor = color ?? "var(--color-green)";
  const fillColorLight = color ? `${color}99` : "#8DE84E";

  const showInnerLabel = percent >= 20;

  return (
    <div className={`w-full ${className}`}>
      {(label || showFraction) && (
        <div className="flex justify-between items-center mb-1.5 text-sm">
          {label && (
            <span className="text-[var(--color-text-secondary)] font-semibold">
              {label}
            </span>
          )}
          <span className="text-[var(--color-text-secondary)] ml-auto font-medium tabular-nums">
            {showFraction ? `${value}/${max}` : `${percent}%`}
          </span>
        </div>
      )}
      <div
        className="relative w-full h-4 rounded-full overflow-hidden"
        style={{
          backgroundColor: "#E5E7EB",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            width: animated ? `${percent}%` : "0%",
            background: `linear-gradient(90deg, ${fillColor}, ${fillColorLight})`,
            boxShadow: `0 0 8px ${fillColor}30, 0 0 3px ${fillColor}20`,
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Shimmer overlay */}
          {shimmer && animated && percent > 0 && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                animation: "shimmer 2s ease-in-out infinite",
              }}
            />
          )}

          {/* Inner label */}
          {showInnerLabel && (
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"
            >
              {showFraction ? `${value}/${max}` : `${percent}%`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
