"use client";

import { useState } from "react";
import { splitPinyin, getToneNumber, getToneColor, applyToneSandhi } from "@/lib/pinyin";

interface ToneDisplayProps {
  pinyin: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  applySandhi?: boolean;
}

interface ToneColoredTextProps {
  characters: string;
  pinyin: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  applySandhi?: boolean;
}

const toneColors: Record<number, string> = {
  1: "#FF4B4B",
  2: "#F5A623",
  3: "#58CC02",
  4: "#1CB0F6",
  5: "#9CA3AF",
};

const toneNames: Record<number, string> = {
  1: "1er ton (haut)",
  2: "2e ton (montant)",
  3: "3e ton (descendant-montant)",
  4: "4e ton (descendant)",
  5: "Ton neutre",
};

const sizeClasses: Record<string, string> = {
  sm: "text-base font-bold",
  md: "text-xl font-extrabold",
  lg: "text-3xl font-extrabold",
};

const charSizeClasses: Record<string, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

/**
 * Re-export getToneNumber as getTone for backward compatibility.
 */
function getTone(syllable: string): number {
  return getToneNumber(syllable);
}

export { getTone, splitPinyin };

export default function ToneDisplay({ pinyin, size = "md", className = "", applySandhi = false }: ToneDisplayProps) {
  let syllables = splitPinyin(pinyin);
  if (applySandhi) {
    syllables = applyToneSandhi(syllables);
  }
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <span className={`inline-flex gap-1.5 ${sizeClasses[size]} ${className}`}>
      {syllables.map((syl, i) => {
        const tone = getToneNumber(syl);
        const color = toneColors[tone];

        return (
          <span
            key={i}
            className="relative cursor-default transition-all duration-300 rounded-md px-1"
            style={{
              color,
              backgroundColor: `${color}1A`,
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {syl}
            {hoveredIdx === i && (
              <span
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap animate-fade-in pointer-events-none z-10"
                style={{
                  background: "#1A1A1A",
                  color: "#FFFFFF",
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

/**
 * Colors each Chinese character according to its corresponding pinyin tone.
 * Takes a Chinese word and its pinyin, splits pinyin into syllables,
 * and applies the matching tone color to each character.
 */
export function ToneColoredText({
  characters,
  pinyin,
  size = "lg",
  className = "",
  applySandhi = false,
}: ToneColoredTextProps) {
  let syllables = splitPinyin(pinyin);
  if (applySandhi) {
    syllables = applyToneSandhi(syllables);
  }
  const chars = Array.from(characters);

  return (
    <span className={`inline-flex chinese-char font-bold ${charSizeClasses[size]} ${className}`}>
      {chars.map((char, i) => {
        const tone = i < syllables.length ? getToneNumber(syllables[i]) : 5;
        const color = toneColors[tone];

        return (
          <span
            key={i}
            style={{ color }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
