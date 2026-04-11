"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showFraction?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  label,
  showFraction = false,
  className = "",
}: ProgressBarProps) {
  const [animated, setAnimated] = useState(false);
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {(label || showFraction) && (
        <div className="flex justify-between items-center mb-1 text-sm">
          {label && <span className="text-[var(--color-text-secondary)]">{label}</span>}
          <span className="text-[var(--color-text-secondary)] ml-auto">
            {showFraction ? `${value}/${max}` : `${percent}%`}
          </span>
        </div>
      )}
      <div className="w-full h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-green)] rounded-full transition-all duration-700 ease-out"
          style={{ width: animated ? `${percent}%` : "0%" }}
        />
      </div>
    </div>
  );
}
