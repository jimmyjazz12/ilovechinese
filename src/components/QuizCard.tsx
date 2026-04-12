"use client";

import { useState } from "react";

interface QuizOption {
  text: string;
  correct: boolean;
}

interface QuizCardProps {
  question: string;
  questionLabel?: string;
  options: QuizOption[];
  showChinese?: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
  onAnswer?: (correct: boolean) => void;
  className?: string;
}

export default function QuizCard({
  question,
  questionLabel,
  options,
  showChinese = false,
  currentQuestion,
  totalQuestions,
  onAnswer,
  className = "",
}: QuizCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedIdx(idx);
    setAnswered(true);
    onAnswer?.(options[idx].correct);
  };

  const getOptionClass = (idx: number): string => {
    const base =
      "relative w-full p-4 rounded-2xl text-left font-semibold text-base transition-all duration-300 border cursor-pointer";

    if (!answered) {
      return `${base} bg-white border-[#E5E7EB] text-[#1A1A1A] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#1CB0F6]`;
    }

    const opt = options[idx];

    if (opt.correct) {
      return `${base} border-[#58CC02] text-[#58CC02] animate-correct`;
    }

    if (idx === selectedIdx && !opt.correct) {
      return `${base} border-[#FF4B4B] text-[#FF4B4B] animate-shake`;
    }

    return `${base} bg-white border-[#E5E7EB] text-[#6B7280] opacity-40 pointer-events-none`;
  };

  const showProgress = currentQuestion != null && totalQuestions != null && totalQuestions > 0;
  const progress = showProgress ? (currentQuestion! / totalQuestions!) * 100 : 0;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Progress bar with gradient fill */}
      {showProgress && (
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #58CC02, #1CB0F6)",
              }}
            />
          </div>
          <span className="text-sm text-[#6B7280] font-semibold whitespace-nowrap">
            {currentQuestion}/{totalQuestions}
          </span>
        </div>
      )}

      {/* Question area with light card */}
      <div
        className="text-center mb-8 p-6 rounded-2xl"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        }}
      >
        {questionLabel && (
          <p className="text-sm text-[#6B7280] mb-2">{questionLabel}</p>
        )}
        <h2
          className={`text-xl font-bold text-[#1A1A1A] ${
            showChinese ? "chinese-char text-4xl" : ""
          }`}
        >
          {question}
        </h2>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((option, idx) => {
          const isCorrectRevealed = answered && option.correct;
          const isWrongSelected = answered && idx === selectedIdx && !option.correct;

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={getOptionClass(idx)}
              style={
                isCorrectRevealed
                  ? { background: "rgba(88, 204, 2, 0.08)", boxShadow: "0 0 12px rgba(88, 204, 2, 0.15)" }
                  : isWrongSelected
                  ? { background: "rgba(255, 75, 75, 0.08)", boxShadow: "0 0 12px rgba(255, 75, 75, 0.15)" }
                  : undefined
              }
            >
              <span className="flex items-center gap-3">
                {answered && option.correct && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#58CC02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isWrongSelected && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                <span className={showChinese ? "" : option.text.length <= 4 ? "chinese-char text-lg" : ""}>
                  {option.text}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className="mt-6 text-center animate-fade-in">
          {selectedIdx !== null && options[selectedIdx].correct ? (
            <p className="text-[#58CC02] font-bold text-lg">Correct !</p>
          ) : (
            <p className="text-[#FF4B4B] font-bold text-lg">
              Incorrect. La bonne reponse etait :{" "}
              <span className="text-[#1A1A1A]">
                {options.find((o) => o.correct)?.text}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
