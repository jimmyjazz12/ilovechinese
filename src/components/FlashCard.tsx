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

  return (
    <div
      className={`flip-card w-72 h-96 cursor-pointer select-none ${flipped ? "flipped" : ""} ${className}`}
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="flip-card-inner w-full h-full">
        {/* Front */}
        <div className="flip-card-front flex flex-col items-center justify-center gap-4 bg-[var(--color-card)] border border-[var(--color-border)] p-6">
          <Badge level={word.hsk_level} />
          <span className="chinese-char text-6xl font-bold text-white">
            {word.simplified}
          </span>
          <span className="text-[var(--color-text-secondary)] text-sm">
            Appuyer pour retourner
          </span>
        </div>

        {/* Back */}
        <div className="flip-card-back flex flex-col items-center justify-center gap-5 bg-[var(--color-card)] border border-[var(--color-border)] p-6">
          <span className="chinese-char text-4xl text-white">{word.simplified}</span>
          <ToneDisplay pinyin={word.pinyin} size="lg" />
          <p className="text-xl text-[var(--color-text-secondary)]">{word.french}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAudioPlay?.();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-blue)] text-white font-semibold hover:brightness-110 transition cursor-pointer"
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
