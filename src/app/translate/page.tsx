"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";

import hsk1Data from "@/data/hsk1.json";
import hsk2Data from "@/data/hsk2.json";
import hsk3Data from "@/data/hsk3.json";
import hsk4Data from "@/data/hsk4.json";
import { useChineseAudio } from "@/lib/useAudio";

interface Word {
  simplified: string;
  pinyin: string;
  french: string;
  hsk_level: number;
}

const allWords: Word[] = [
  ...(hsk1Data as Word[]),
  ...(hsk2Data as Word[]),
  ...(hsk3Data as Word[]),
  ...(hsk4Data as Word[]),
];

interface Sentence {
  chinese: string;
  pinyin: string;
  french: string;
  words: string[];
}

function generateSentence(maxHsk: number): Sentence {
  const available = allWords.filter((w) => w.hsk_level <= maxHsk);
  // Simple sentence patterns
  const patterns = [
    { template: "{subj}{verb}{obj}", types: ["pronom", "verbe", "nom"] },
    { template: "{subj}很{adj}", types: ["pronom", "adjectif"] },
    { template: "{subj}在{lieu}{verb}", types: ["pronom", "lieu", "verbe"] },
  ];

  // Pick a random word and build a simple display
  const word = available[Math.floor(Math.random() * available.length)];
  return {
    chinese: word.simplified,
    pinyin: word.pinyin,
    french: word.french,
    words: [word.simplified],
  };
}

export default function TranslatePage() {
  const [direction, setDirection] = useState<"fr_to_cn" | "cn_to_fr">("fr_to_cn");
  const [maxHsk, setMaxHsk] = useState(1);
  const [userHskLevel, setUserHskLevel] = useState(1);
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [userInput, setUserInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Load user's HSK level on mount
  useEffect(() => {
    try {
      const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
      const level = stats.current_hsk_level || 1;
      setUserHskLevel(level);
      setMaxHsk(level);
    } catch {
      /* ignore */
    }
  }, []);

  const newSentence = () => {
    setCurrentSentence(generateSentence(maxHsk));
    setUserInput("");
    setShowResult(false);
  };

  useEffect(() => {
    newSentence();
  }, [maxHsk, direction]);

  const checkAnswer = () => {
    if (!currentSentence || !userInput.trim()) return;

    let correct = false;
    if (direction === "fr_to_cn") {
      correct = userInput.trim() === currentSentence.chinese;
    } else {
      // Be lenient with French answers
      correct = userInput.trim().toLowerCase().includes(
        currentSentence.french.toLowerCase().split(",")[0].trim()
      );
    }

    setIsCorrect(correct);
    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    if (correct) {
      const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
      stats.xp_today = (stats.xp_today || 0) + 15;
      stats.xp_total = (stats.xp_total || 0) + 15;
      localStorage.setItem("user_stats", JSON.stringify(stats));
    }
  };

  const speak = useChineseAudio();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold mb-3">🔄 Traduction</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setDirection("fr_to_cn")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                direction === "fr_to_cn"
                  ? "bg-[#58CC02] text-[#1A1A1A]"
                  : "bg-white text-[#6B7280]"
              }`}
            >
              FR → 中文
            </button>
            <button
              onClick={() => setDirection("cn_to_fr")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                direction === "cn_to_fr"
                  ? "bg-[#1CB0F6] text-[#1A1A1A]"
                  : "bg-white text-[#6B7280]"
              }`}
            >
              中文 → FR
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* HSK Level */}
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              onClick={() => setMaxHsk(level)}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                maxHsk === level
                  ? "bg-[#58CC02] text-[#1A1A1A]"
                  : "bg-white text-[#6B7280]"
              }`}
            >
              HSK {level}
            </button>
          ))}
        </div>

        {/* Score */}
        <div className="text-center text-sm text-[#6B7280]">
          Score: {score.correct}/{score.total}
        </div>

        {currentSentence && (
          <div className="space-y-4">
            {/* Question */}
            <div className="bg-gradient-card rounded-2xl p-6 border border-white/5 shadow-card text-center">
              <p className="text-sm text-[#6B7280] mb-2">Traduisez :</p>
              {direction === "fr_to_cn" ? (
                <p className="text-2xl font-bold">{currentSentence.french}</p>
              ) : (
                <div>
                  <p className="chinese-char text-4xl font-bold mb-2">
                    {currentSentence.chinese}
                  </p>
                  <button
                    onClick={() => speak(currentSentence.chinese)}
                    className="text-[#1CB0F6] text-sm"
                  >
                    🔊 Écouter
                  </button>
                </div>
              )}
            </div>

            {/* Input */}
            <div>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !showResult && checkAnswer()}
                placeholder={
                  direction === "fr_to_cn"
                    ? "Écrivez en chinois..."
                    : "Écrivez en français..."
                }
                className="w-full bg-white rounded-xl px-4 py-3 text-lg text-center placeholder-[#6B7280] input-focus"
                disabled={showResult}
              />
            </div>

            {!showResult ? (
              <button
                onClick={checkAnswer}
                disabled={!userInput.trim()}
                className="w-full btn-3d bg-[#58CC02] hover:bg-[#46A302] disabled:bg-[#2A4050] disabled:text-[#6B7280] text-[#1A1A1A] font-bold py-3 rounded-xl"
              >
                Vérifier
              </button>
            ) : (
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-xl text-center font-bold ${
                    isCorrect
                      ? "bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30"
                      : "bg-[#FF4B4B]/20 text-[#FF4B4B] border border-[#FF4B4B]/30"
                  }`}
                >
                  {isCorrect ? "✓ Correct !" : "✗ Incorrect"}
                </div>

                {!isCorrect && (
                  <div className="bg-white rounded-xl p-4 border border-[#E5E7EB]">
                    <p className="text-sm text-[#6B7280] mb-1">Réponse attendue :</p>
                    {direction === "fr_to_cn" ? (
                      <div>
                        <p className="chinese-char text-xl font-bold">{currentSentence.chinese}</p>
                        <ToneDisplay pinyin={currentSentence.pinyin} size="sm" />
                      </div>
                    ) : (
                      <p className="text-lg font-bold">{currentSentence.french}</p>
                    )}
                  </div>
                )}

                <button
                  onClick={newSentence}
                  className="w-full btn-3d bg-[#1CB0F6] hover:bg-[#1899D6] text-[#1A1A1A] font-bold py-3 rounded-xl"
                >
                  Suivant →
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
