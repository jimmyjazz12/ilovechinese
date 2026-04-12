"use client";

import { useState } from "react";
import Badge from "./ui/Badge";
import ToneDisplay, { ToneColoredText } from "./ToneDisplay";

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
          className="flip-card-front flex flex-col items-center justify-center gap-4 p-6 rounded-2xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Badge level={word.hsk_level} className="shadow-lg" />
          <ToneColoredText characters={word.simplified} pinyin={word.pinyin} size="xl" />
          <span className="text-[#6B7280] text-sm mt-2">
            Appuyer pour retourner
          </span>
        </div>

        {/* Back */}
        <div
          className="flip-card-back flex flex-col items-center justify-center gap-5 p-6 rounded-2xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <ToneColoredText characters={word.simplified} pinyin={word.pinyin} size="lg" />
          <ToneDisplay pinyin={word.pinyin} size="lg" />
          <p className="text-xl text-[#6B7280] font-medium">{word.french}</p>
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
              bg-gradient-to-r from-[#1CB0F6] to-[#1899D6]
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
