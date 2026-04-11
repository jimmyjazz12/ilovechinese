"use client";

import ToneDisplay from "./ToneDisplay";

interface AssociatedWord {
  simplified: string;
  pinyin: string;
  french: string;
}

interface CharacterGroup {
  character: string;
  words: AssociatedWord[];
}

interface CharacterAssociationsProps {
  groups: CharacterGroup[];
  onWordClick?: (word: AssociatedWord) => void;
  className?: string;
}

export default function CharacterAssociations({
  groups,
  onWordClick,
  className = "",
}: CharacterAssociationsProps) {
  if (groups.length === 0) return null;

  return (
    <div className={`space-y-5 ${className}`}>
      <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
        Mots associes
      </h3>
      {groups.map((group, groupIdx) => (
        <div
          key={group.character}
          className="animate-fade-in"
          style={{ animationDelay: `${groupIdx * 100}ms` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className="chinese-char text-2xl font-bold text-[var(--color-blue)]"
              style={{ textShadow: "0 0 12px rgba(28, 176, 246, 0.3)" }}
            >
              {group.character}
            </span>
            <div
              className="flex-1 h-px"
              style={{
                background: "linear-gradient(90deg, rgba(28, 176, 246, 0.4), transparent)",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {group.words.map((word, i) => (
              <button
                key={`${word.simplified}-${i}`}
                onClick={() => onWordClick?.(word)}
                className="
                  flex flex-col items-start gap-1 px-4 py-3
                  rounded-xl shadow-card hover-lift
                  transition-all duration-300 cursor-pointer
                  border border-[var(--color-border)]
                  hover:border-[var(--color-blue)]
                "
                style={{
                  background: "rgba(26, 44, 52, 0.8)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="chinese-char text-lg font-bold text-white"
                  style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)" }}
                >
                  {word.simplified}
                </span>
                <ToneDisplay pinyin={word.pinyin} size="sm" />
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  {word.french}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
