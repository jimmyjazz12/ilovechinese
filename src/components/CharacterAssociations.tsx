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
      <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">
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
              className="chinese-char text-2xl font-bold text-[#1CB0F6]"
            >
              {group.character}
            </span>
            <div
              className="flex-1 h-px"
              style={{
                background: "linear-gradient(90deg, rgba(28, 176, 246, 0.3), transparent)",
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
                  rounded-xl
                  transition-all duration-300 cursor-pointer
                  hover:-translate-y-0.5
                "
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1CB0F6";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)";
                }}
              >
                <span
                  className="chinese-char text-lg font-bold text-[#1A1A1A]"
                >
                  {word.simplified}
                </span>
                <ToneDisplay pinyin={word.pinyin} size="sm" />
                <span className="text-xs text-[#6B7280] font-medium">
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
