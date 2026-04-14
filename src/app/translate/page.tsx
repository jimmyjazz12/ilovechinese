"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";
import { useChineseAudio } from "@/lib/useAudio";
import { removeTones, isValidSyllable } from "@/lib/pinyin";
import { useUser } from "@/lib/UserContext";
import ReportError from "@/components/ReportError";

import hsk1Data from "@/data/hsk1.json";
import hsk2Data from "@/data/hsk2.json";
import hsk3Data from "@/data/hsk3.json";
import hsk4Data from "@/data/hsk4.json";

// ── Types ──

interface Example {
  chinese: string;
  pinyin: string;
  french: string;
}

interface Word {
  simplified: string;
  pinyin: string;
  french: string;
  hsk_level: number;
  examples?: Example[];
}

interface TranslationItem {
  chinese: string;
  pinyin: string;
  french: string;
  type: "word" | "sentence";
}

// ── Data ──

const allWords: Word[] = [
  ...(hsk1Data as Word[]),
  ...(hsk2Data as Word[]),
  ...(hsk3Data as Word[]),
  ...(hsk4Data as Word[]),
];

// ── Tone helper ──

const TONE_MAP: Record<string, string[]> = {
  a: ["a", "\u0101", "\u00e1", "\u01ce", "\u00e0"],
  e: ["e", "\u0113", "\u00e9", "\u011b", "\u00e8"],
  i: ["i", "\u012b", "\u00ed", "\u01d0", "\u00ec"],
  o: ["o", "\u014d", "\u00f3", "\u01d2", "\u00f2"],
  u: ["u", "\u016b", "\u00fa", "\u01d4", "\u00f9"],
  "\u00fc": ["\u00fc", "\u01d6", "\u01d8", "\u01da", "\u01dc"],
};

/**
 * Pinyin tone placement rule: the tone mark goes on the vowel determined by
 * these rules (in order):
 *   1. If there is an "a" or "e", it takes the tone mark.
 *   2. If there is "ou", the "o" takes the tone mark.
 *   3. Otherwise, the LAST vowel takes the tone mark.
 */
function addToneToSyllable(syllable: string, tone: number): string {
  if (tone < 1 || tone > 4) return syllable;
  const lower = syllable.toLowerCase();
  const vowels = "aeiou\u00fc";

  // Rule 1: a or e
  for (const ch of lower) {
    if (ch === "a" || ch === "e") {
      const variants = TONE_MAP[ch];
      return lower.replace(ch, variants[tone]);
    }
  }

  // Rule 2: ou -> mark the o
  if (lower.includes("ou")) {
    return lower.replace("o", TONE_MAP["o"][tone]);
  }

  // Rule 3: last vowel
  for (let i = lower.length - 1; i >= 0; i--) {
    const ch = lower[i];
    if (vowels.includes(ch)) {
      const variants = TONE_MAP[ch] || TONE_MAP[ch === "v" ? "\u00fc" : ch];
      if (variants) {
        return lower.slice(0, i) + variants[tone] + lower.slice(i + 1);
      }
    }
  }

  return syllable;
}

// ── Build exercise pool ──

function buildPool(maxHsk: number): TranslationItem[] {
  const pool: TranslationItem[] = [];
  const filtered = allWords.filter((w) => w.hsk_level <= maxHsk);

  for (const word of filtered) {
    // Add the word itself
    pool.push({
      chinese: word.simplified,
      pinyin: word.pinyin,
      french: word.french,
      type: "word",
    });

    // Add example sentences
    if (word.examples) {
      for (const ex of word.examples) {
        pool.push({
          chinese: ex.chinese,
          pinyin: ex.pinyin,
          french: ex.french,
          type: "sentence",
        });
      }
    }
  }

  return pool;
}

function pickItem(pool: TranslationItem[]): TranslationItem {
  const words = pool.filter((p) => p.type === "word");
  const sentences = pool.filter((p) => p.type === "sentence");

  // 40% words, 60% sentences (fall back to words if no sentences)
  const useSentence = sentences.length > 0 && Math.random() < 0.6;
  const source = useSentence ? sentences : words;
  return source[Math.floor(Math.random() * source.length)];
}

// ── Answer checking ──

function normalize(s: string): string {
  return s
    .replace(/[\s.,!?;:，。！？；：、""''«»\-—()（）\u3000]/g, "")
    .toLowerCase();
}

function checkFrToChAnswer(userInput: string, expected: string): boolean {
  return normalize(userInput) === normalize(expected);
}

function checkChToFrAnswer(userInput: string, expected: string): boolean {
  const inputNorm = normalize(userInput);
  const expectedNorm = normalize(expected);

  // Exact match after normalization (ignore case, punctuation, spaces)
  if (inputNorm === expectedNorm) return true;

  // Check if normalized input contains normalized expected or vice versa
  if (inputNorm.includes(expectedNorm) || expectedNorm.includes(inputNorm)) return true;

  // Split expected by comma/semicolon and check if any segment matches
  const segments = expected
    .split(/[,;，；\/]/)
    .map((s) => normalize(s))
    .filter(Boolean);

  for (const seg of segments) {
    if (inputNorm.includes(seg) || seg.includes(inputNorm)) return true;
  }

  // Check key words (3+ chars) — 50% threshold
  const input = userInput.trim().toLowerCase();
  const keyWords = expected.toLowerCase()
    .split(/[\s,;\/]+/)
    .filter((w) => w.length >= 3);
  if (keyWords.length > 0) {
    const matchCount = keyWords.filter((w) => input.includes(w)).length;
    if (matchCount >= Math.ceil(keyWords.length * 0.5)) return true;
  }
  return false;
}

// ── ToneSelector component ──

function ToneSelector({
  inputValue,
  onSelect,
  inputRef,
}: {
  inputValue: string;
  onSelect: (replacement: string, syllableLen: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [visible, setVisible] = useState(false);
  const [matchedSyllable, setMatchedSyllable] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Look at the trailing characters of the input to find a valid pinyin syllable
    const text = inputValue.toLowerCase();
    if (!text) {
      setVisible(false);
      return;
    }

    // Try longest match from the end (max 6 chars for pinyin)
    let found = "";
    for (let len = Math.min(6, text.length); len >= 1; len--) {
      const tail = text.slice(text.length - len);
      // Only match if it's purely ascii letters (no tones already applied)
      if (/^[a-z]+$/.test(tail) && isValidSyllable(tail)) {
        found = tail;
        break;
      }
    }

    if (found) {
      const toneVariants = [
        addToneToSyllable(found, 1),
        addToneToSyllable(found, 2),
        addToneToSyllable(found, 3),
        addToneToSyllable(found, 4),
        found, // neutral
      ];
      setMatchedSyllable(found);
      setVariants(toneVariants);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [inputValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setVisible(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!visible || variants.length === 0) return null;

  return (
    <div
      ref={popupRef}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg px-2 py-1.5 flex gap-1 z-50"
    >
      {variants.map((v, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // prevent input blur
            onSelect(v, matchedSyllable.length);
            setVisible(false);
            inputRef.current?.focus();
          }}
          className="px-2.5 py-1 rounded-lg text-base font-medium hover:bg-[#F3F0FF] hover:text-[#7C3AED] transition-colors text-[#1A1A1A]"
          title={i < 4 ? `Ton ${i + 1}` : "Neutre"}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// ── Main page ──

export default function TranslatePage() {
  const { getUserKey } = useUser();
  const [direction, setDirection] = useState<"fr_to_cn" | "cn_to_fr">(
    "fr_to_cn"
  );
  const [mode, setMode] = useState<"all" | "word" | "sentence">("all");
  const [maxHsk, setMaxHsk] = useState(1);
  const [userHskLevel, setUserHskLevel] = useState(1);
  const [currentItem, setCurrentItem] = useState<TranslationItem | null>(null);
  const [userInput, setUserInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isListening, setIsListening] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const poolRef = useRef<TranslationItem[]>([]);

  const speak = useChineseAudio();

  // Load user's HSK level on mount
  useEffect(() => {
    try {
      const stats = JSON.parse(localStorage.getItem(getUserKey("user_stats")) || "{}");
      const level = stats.current_hsk_level || 1;
      setUserHskLevel(level);
      setMaxHsk(level);
    } catch {
      /* ignore */
    }
  }, []);

  // Rebuild pool when maxHsk changes
  useEffect(() => {
    poolRef.current = buildPool(maxHsk);
  }, [maxHsk]);

  const newItem = useCallback(() => {
    if (poolRef.current.length === 0) {
      poolRef.current = buildPool(maxHsk);
    }
    let pool = poolRef.current;
    if (mode === "word") pool = pool.filter(p => p.type === "word");
    else if (mode === "sentence") pool = pool.filter(p => p.type === "sentence");
    if (pool.length === 0) pool = poolRef.current; // fallback
    setCurrentItem(pool[Math.floor(Math.random() * pool.length)]);
    setUserInput("");
    setShowResult(false);
  }, [maxHsk, mode]);

  useEffect(() => {
    poolRef.current = buildPool(maxHsk);
    newItem();
  }, [maxHsk, direction, mode, newItem]);

  // ── Voice dictation ──

  const toggleDictation = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI =
      win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = direction === "fr_to_cn" ? "zh-CN" : "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput((prev) => prev + transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, direction]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ── Answer checking ──

  const checkAnswer = () => {
    if (!currentItem || !userInput.trim()) return;

    let correct = false;
    if (direction === "fr_to_cn") {
      correct = checkFrToChAnswer(userInput, currentItem.chinese);
    } else {
      correct = checkChToFrAnswer(userInput, currentItem.french);
    }

    setIsCorrect(correct);
    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    if (correct) {
      try {
        const stats = JSON.parse(localStorage.getItem(getUserKey("user_stats")) || "{}");
        stats.xp_today = (stats.xp_today || 0) + 15;
        stats.xp_total = (stats.xp_total || 0) + 15;
        localStorage.setItem(getUserKey("user_stats"), JSON.stringify(stats));
      } catch {
        /* ignore */
      }
    }
  };

  // ── Tone selector callback ──

  const handleToneSelect = (replacement: string, syllableLen: number) => {
    setUserInput((prev) => prev.slice(0, prev.length - syllableLen) + replacement);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-[#1A1A1A] mb-3">
            Traduction
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setDirection("fr_to_cn")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                direction === "fr_to_cn"
                  ? "bg-[#58CC02] text-white shadow-md"
                  : "bg-white text-[#6B7280] border border-[#E5E7EB]"
              }`}
            >
              FR &rarr; CN
            </button>
            <button
              onClick={() => setDirection("cn_to_fr")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                direction === "cn_to_fr"
                  ? "bg-[#1CB0F6] text-white shadow-md"
                  : "bg-white text-[#6B7280] border border-[#E5E7EB]"
              }`}
            >
              CN &rarr; FR
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-28">
        {/* HSK Level selector */}
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              onClick={() => level <= userHskLevel && setMaxHsk(level)}
              disabled={level > userHskLevel}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                maxHsk === level
                  ? "bg-[#58CC02] text-white shadow-sm"
                  : level > userHskLevel
                    ? "bg-[#F3F4F6] text-[#D1D5DB] cursor-not-allowed"
                    : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#58CC02]"
              }`}
            >
              HSK {level}
            </button>
          ))}
        </div>

        {/* Mode selector: Tout / Mots / Phrases */}
        <div className="flex gap-2 justify-center">
          {([["all", "Tout"], ["word", "Mots"], ["sentence", "Phrases"]] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === m
                  ? "bg-[#CE82FF] text-white shadow-sm"
                  : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#CE82FF]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Score */}
        <div className="text-center text-sm text-[#6B7280] font-medium">
          Score : {score.correct}/{score.total}
          {score.total > 0 && (
            <span className="ml-2 text-xs">
              ({Math.round((score.correct / score.total) * 100)}%)
            </span>
          )}
        </div>

        {currentItem && (
          <div className="space-y-4">
            {/* Question card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm text-center">
              <p className="text-xs text-[#6B7280] mb-1 uppercase tracking-wide">
                {currentItem.type === "sentence" ? "Phrase" : "Mot"} &middot;
                Traduisez
              </p>
              {direction === "fr_to_cn" ? (
                <p className="text-2xl font-bold text-[#1A1A1A] mt-2">
                  {currentItem.french}
                </p>
              ) : (
                <div className="mt-2">
                  <p className="text-3xl font-bold text-[#1A1A1A] mb-2">
                    {currentItem.chinese}
                  </p>
                  <button
                    onClick={() => speak(currentItem.chinese)}
                    className="inline-flex items-center gap-1.5 text-[#1CB0F6] text-sm font-medium hover:underline"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z"
                      />
                    </svg>
                    Ecouter
                  </button>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="relative">
              {/* Tone selector popup (only for FR->CN pinyin input) */}
              {direction === "fr_to_cn" && !showResult && (
                <ToneSelector
                  inputValue={userInput}
                  onSelect={handleToneSelect}
                  inputRef={inputRef}
                />
              )}

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !showResult && checkAnswer()
                  }
                  placeholder={
                    direction === "fr_to_cn"
                      ? "Ecrivez en chinois..."
                      : "Écrivez en français..."
                  }
                  className="flex-1 bg-white rounded-xl px-4 py-3 text-lg text-center text-[#1A1A1A] placeholder-[#9CA3AF] border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                  disabled={showResult}
                />

                {/* Mic button */}
                <button
                  onClick={toggleDictation}
                  disabled={showResult}
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-[#7C3AED] text-white shadow-md animate-pulse"
                      : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#7C3AED] hover:border-[#7C3AED]"
                  } ${showResult ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={isListening ? "Arrêter" : "Dicter"}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
                    />
                  </svg>
                </button>
              </div>

              {isListening && (
                <p className="text-xs text-[#7C3AED] text-center mt-1 font-medium">
                  Ecoute en cours...
                </p>
              )}
            </div>

            {/* Check / Result */}
            {!showResult ? (
              <button
                onClick={checkAnswer}
                disabled={!userInput.trim()}
                className="w-full bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-lg btn-3d"
              >
                Vérifier
              </button>
            ) : (
              <div className="space-y-3">
                {/* Correct/Incorrect banner */}
                <div
                  className={`p-4 rounded-xl text-center font-bold text-lg ${
                    isCorrect
                      ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                      : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                  }`}
                >
                  {isCorrect ? "Correct !" : "Incorrect"}
                </div>

                {/* Expected answer */}
                {!isCorrect && (
                  <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-sm">
                    <p className="text-xs text-[#6B7280] mb-2 uppercase tracking-wide">
                      Réponse attendue
                    </p>
                    {direction === "fr_to_cn" ? (
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-[#1A1A1A]">
                          {currentItem.chinese}
                        </p>
                        <ToneDisplay pinyin={currentItem.pinyin} size="sm" />
                        <button
                          onClick={() => speak(currentItem.chinese)}
                          className="inline-flex items-center gap-1 text-[#1CB0F6] text-sm mt-1 hover:underline"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z"
                            />
                          </svg>
                          Ecouter
                        </button>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-[#1A1A1A]">
                        {currentItem.french}
                      </p>
                    )}
                    <div className="mt-3 flex justify-center">
                      <ReportError word={currentItem.chinese} currentFrench={currentItem.french} />
                    </div>
                  </div>
                )}

                {/* Correct answer also shows pinyin + audio */}
                {isCorrect && direction === "fr_to_cn" && (
                  <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-sm text-center">
                    <ToneDisplay pinyin={currentItem.pinyin} size="sm" />
                    <button
                      onClick={() => speak(currentItem.chinese)}
                      className="inline-flex items-center gap-1 text-[#1CB0F6] text-sm mt-2 hover:underline"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z"
                        />
                      </svg>
                      Ecouter
                    </button>
                  </div>
                )}

                {/* Next button */}
                <button
                  onClick={newItem}
                  className="w-full bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-lg btn-3d"
                >
                  Suivant &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
