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

const sizeClasses: Record<string, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

/**
 * Detect the tone number from a pinyin syllable.
 * Handles tone numbers at the end (e.g. "ma1") or diacritics.
 */
function getTone(syllable: string): number {
  const trimmed = syllable.trim();
  if (!trimmed) return 5;

  // Check trailing digit
  const lastChar = trimmed[trimmed.length - 1];
  if (/[1-4]/.test(lastChar)) return parseInt(lastChar, 10);

  // Check diacritics
  if (/[āēīōūǖ]/.test(trimmed)) return 1;
  if (/[áéíóúǘ]/.test(trimmed)) return 2;
  if (/[ǎěǐǒǔǚ]/.test(trimmed)) return 3;
  if (/[àèìòùǜ]/.test(trimmed)) return 4;

  return 5; // neutral tone
}

/**
 * Split a pinyin string into syllables.
 * Supports space-separated or number-delimited syllables.
 */
function splitPinyin(pinyin: string): string[] {
  // If space-separated, just split on spaces
  if (pinyin.includes(" ")) {
    return pinyin.split(/\s+/).filter(Boolean);
  }
  // If number-delimited (e.g. "ni3hao3"), split after each digit
  const parts = pinyin.match(/[a-zA-ZüÜǖǘǚǜāáǎàēéěèīíǐìōóǒòūúǔù]+[1-5]?/g);
  return parts ?? [pinyin];
}

export default function ToneDisplay({ pinyin, size = "md", className = "" }: ToneDisplayProps) {
  const syllables = splitPinyin(pinyin);

  return (
    <span className={`inline-flex gap-0.5 font-semibold ${sizeClasses[size]} ${className}`}>
      {syllables.map((syl, i) => {
        const tone = getTone(syl);
        return (
          <span key={i} style={{ color: toneColors[tone] }}>
            {syl}
          </span>
        );
      })}
    </span>
  );
}
