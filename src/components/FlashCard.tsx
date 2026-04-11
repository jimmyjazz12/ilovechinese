"use client";

import { useState } from "react";
import Badge from "./ui/Badge";
import ToneDisplay from "./ToneDisplay";

interface FlashCardWord {
  simplified: string;
  pinyin: string;
  french: string;
  hsk_level: number;
}

interface FlashCardProps {
  word: FlashCardWord;
  onAudioPlay?: () => void;
  className?: string;
}

export default function FlashCard({ word, onAudioPlay, className = "" }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [audioHover, setAudioHover] = useState(false);

  return (
    <div
      className={`flip-card w-72 h-96 cursor-pointer select-none ${flipped ? "flipped" : ""} ${className}`}
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="flip-card-inner w-full h-full">
        {/* Front */}
        <div
          className="flip-card-front flex flex-col items-center justify-center gap-4 p-6 shadow-xl gradient-border"
          style={{
            background: "rgba(26, 44, 52, 0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div className="shadow-glow-green rounded-full">
            <Badge level={word.hsk_level} className="shadow-lg" />
          </div>
          <span
            className="chinese-char text-7xl font-bold text-white"
            style={{ textShadow: "0 0 30px rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0, 0, 0, 0.3)" }}
          >
            {word.simplified}
          </span>
          <span className="text-[var(--color-text-secondary)] text-sm mt-2">
            Appuyer pour retourner
          </span>
        </div>

        {/* Back */}
        <div
          className="flip-card-back flex flex-col items-center justify-center gap-5 p-6 shadow-xl gradient-border"
          style={{
            background: "rgba(26, 44, 52, 0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <span
            className="chinese-char text-4xl text-white"
            style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }}
          >
            {word.simplified}
          </span>
          <div className="text-glow">
            <ToneDisplay pinyin={word.pinyin} size="lg" />
          </div>
          <p className="text-xl text-[var(--color-text-secondary)] font-medium">{word.french}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAudioPlay?.();
            }}
            onMouseEnter={() => setAudioHover(true)}
            onMouseLeave={() => setAudioHover(false)}
            className={`
              relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
              text-white transition-all duration-300 cursor-pointer
              bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-blue-dark)]
              hover:shadow-glow-blue hover:scale-105
              ${audioHover ? "shadow-glow-blue" : "shadow-lg"}
            `}
            aria-label="Lire la prononciation"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${audioHover ? "scale-110" : ""}`}
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            Audio
          </button>
          <Badge level={word.hsk_level} />
        </div>
      </div>
    </div>
  );
}
