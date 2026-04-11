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

  const getOptionClass = (idx: number) => {
    const base =
      "w-full p-4 rounded-2xl text-left font-semibold text-base transition-all duration-200 border-2 cursor-pointer";

    if (!answered) {
      return `${base} bg-[var(--color-card)] border-[var(--color-border)] text-white hover:border-[var(--color-blue)] hover:bg-[var(--color-card-hover)]`;
    }

    const opt = options[idx];

    if (opt.correct) {
      return `${base} bg-[var(--color-green)]/20 border-[var(--color-green)] text-[var(--color-green)] animate-correct`;
    }

    if (idx === selectedIdx && !opt.correct) {
      return `${base} bg-[var(--color-red)]/20 border-[var(--color-red)] text-[var(--color-red)] animate-shake`;
    }

    return `${base} bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-50`;
  };

  const showProgress = currentQuestion != null && totalQuestions != null && totalQuestions > 0;
  const progress = showProgress ? (currentQuestion! / totalQuestions!) * 100 : 0;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-2.5 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-green)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-[var(--color-text-secondary)] font-semibold whitespace-nowrap">
            {currentQuestion}/{totalQuestions}
          </span>
        </div>
      )}

      {/* Question */}
      <div className="text-center mb-8">
        {questionLabel && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">{questionLabel}</p>
        )}
        <h2
          className={`text-xl font-bold text-white ${
            showChinese ? "chinese-char text-4xl" : ""
          }`}
        >
          {question}
        </h2>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={answered}
            className={getOptionClass(idx)}
          >
            <span className={showChinese ? "" : option.text.length <= 4 ? "chinese-char text-lg" : ""}>
              {option.text}
            </span>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {answered && (
        <div className="mt-6 text-center">
          {selectedIdx !== null && options[selectedIdx].correct ? (
            <p className="text-[var(--color-green)] font-bold text-lg">Correct !</p>
          ) : (
            <p className="text-[var(--color-red)] font-bold text-lg">
              Incorrect. La bonne reponse etait :{" "}
              <span className="text-white">
                {options.find((o) => o.correct)?.text}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
