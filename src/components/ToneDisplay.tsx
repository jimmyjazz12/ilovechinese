"use client";

import { useState } from "react";

interface ToneDisplayProps {
  pinyin: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const toneColors: Record<number, string> = {
  1: "var(--color-tone1)",
  2: "var(--color-tone2)",
  3: "var(--color-tone3)",
  4: "var(--color-tone4)",
  5: "var(--color-tone5)",
};

const toneNames: Record<number, string> = {
  1: "1er ton (haut)",
  2: "2e ton (montant)",
  3: "3e ton (descendant-montant)",
  4: "4e ton (descendant)",
  5: "Ton neutre",
};

const sizeClasses: Record<string, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

/**
 * Detect the tone number from a pinyin syllable.
 */
function getTone(syllable: string): number {
  const trimmed = syllable.trim();
  if (!trimmed) return 5;

  const lastChar = trimmed[trimmed.length - 1];
  if (/[1-4]/.test(lastChar)) return parseInt(lastChar, 10);

  if (/[\u0101\u0113\u012B\u014D\u016B\u01D6]/.test(trimmed)) return 1;
  if (/[\u00E1\u00E9\u00ED\u00F3\u00FA\u01D8]/.test(trimmed)) return 2;
  if (/[\u01CE\u011B\u01D0\u01D2\u01D4\u01DA]/.test(trimmed)) return 3;
  if (/[\u00E0\u00E8\u00EC\u00F2\u00F9\u01DC]/.test(trimmed)) return 4;

  return 5;
}

/**
 * Split a pinyin string into syllables.
 */
function splitPinyin(pinyin: string): string[] {
  if (pinyin.includes(" ")) {
    return pinyin.split(/\s+/).filter(Boolean);
  }
  const parts = pinyin.match(/[a-zA-Z\u00FC\u00DC\u01D6\u01D8\u01DA\u01DC\u0101\u00E1\u01CE\u00E0\u0113\u00E9\u011B\u00E8\u012B\u00ED\u01D0\u00EC\u014D\u00F3\u01D2\u00F2\u016B\u00FA\u01D4\u00F9]+[1-5]?/g);
  return parts ?? [pinyin];
}

export default function ToneDisplay({ pinyin, size = "md", className = "" }: ToneDisplayProps) {
  const syllables = splitPinyin(pinyin);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <span className={`inline-flex gap-1.5 font-semibold ${sizeClasses[size]} ${className}`}>
      {syllables.map((syl, i) => {
        const tone = getTone(syl);
        const color = toneColors[tone];

        return (
          <span
            key={i}
            className="relative cursor-default transition-all duration-300"
            style={{
              color,
              textShadow: `0 0 12px ${color}40, 0 1px 2px rgba(0, 0, 0, 0.3)`,
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {syl}
            {hoveredIdx === i && (
              <span
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-xs font-medium text-white whitespace-nowrap animate-fade-in pointer-events-none z-10"
                style={{
                  background: "rgba(19, 31, 36, 0.95)",
                  border: `1px solid ${color}50`,
                  fontSize: "11px",
                }}
              >
                {toneNames[tone]}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
