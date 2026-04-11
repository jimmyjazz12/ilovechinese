"use client";

import { useState } from "react";

interface SrsProgressIndicatorProps {
  level: number; // 0-5
  showLabel?: boolean;
  className?: string;
}

const labels = [
  "Inconnu",
  "Vu",
  "Apprentissage",
  "Familier",
  "Bon",
  "Maitrise",
];

const segmentColors = [
  "var(--color-red)",
  "var(--color-orange)",
  "#EAB308",
  "var(--color-blue)",
  "var(--color-green)",
];

export default function SrsProgressIndicator({
  level,
  showLabel = true,
  className = "",
}: SrsProgressIndicatorProps) {
  const clamped = Math.min(5, Math.max(0, level));
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Connected progress bar */}
      <div className="flex items-center gap-0.5 relative">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < clamped;
          const isCurrent = i === clamped - 1;
          const color = filled ? segmentColors[i] : "var(--color-border)";

          return (
            <div
              key={i}
              className="relative"
              onMouseEnter={() => setHoveredSeg(i)}
              onMouseLeave={() => setHoveredSeg(null)}
            >
              <div
                className="h-2.5 transition-all duration-500 ease-out"
                style={{
                  width: "20px",
                  background: filled
                    ? color
                    : "var(--color-border)",
                  borderRadius:
                    i === 0
                      ? "4px 0 0 4px"
                      : i === 4
                      ? "0 4px 4px 0"
                      : "0",
                  boxShadow: isCurrent
                    ? `0 0 8px ${color}80, 0 0 16px ${color}40`
                    : "none",
                }}
              />
              {/* Tooltip on hover */}
              {hoveredSeg === i && (
                <span
                  className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap animate-fade-in z-10"
                  style={{
                    background: "rgba(19, 31, 36, 0.95)",
                    border: `1px solid ${segmentColors[i]}50`,
                  }}
                >
                  {labels[i + 1]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showLabel && (
        <span
          className="text-xs font-bold transition-colors duration-300"
          style={{
            color:
              clamped <= 1
                ? "var(--color-red)"
                : clamped <= 3
                ? "var(--color-orange)"
                : "var(--color-green)",
          }}
        >
          {labels[clamped]}
        </span>
      )}
    </div>
  );
}
