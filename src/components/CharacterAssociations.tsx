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
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
        Mots associes
      </h3>
      {groups.map((group) => (
        <div key={group.character}>
          <div className="flex items-center gap-2 mb-2">
            <span className="chinese-char text-xl font-bold text-[var(--color-blue)]">
              {group.character}
            </span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {group.words.map((word, i) => (
              <button
                key={`${word.simplified}-${i}`}
                onClick={() => onWordClick?.(word)}
                className="flex flex-col items-start gap-0.5 px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-blue)] hover:bg-[var(--color-card-hover)] transition-colors cursor-pointer"
              >
                <span className="chinese-char text-base font-bold text-white">
                  {word.simplified}
                </span>
                <ToneDisplay pinyin={word.pinyin} size="sm" />
                <span className="text-xs text-[var(--color-text-secondary)]">
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
