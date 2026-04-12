"use client";

import { useState, useEffect, useMemo } from "react";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";
import XpAnimation from "@/components/XpAnimation";
import { useUser } from "@/lib/UserContext";

import grammarData from "@/data/grammar.json";

interface GrammarExample {
  chinese: string;
  pinyin: string;
  french: string;
}

interface GrammarRule {
  id: string;
  hsk_level: number;
  title: string;
  explanation_fr: string;
  pattern: string;
  examples: GrammarExample[];
}

export default function GrammarReviewPage() {
  const { getUserKey } = useUser();
  const [maxHsk, setMaxHsk] = useState(1);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showXp, setShowXp] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const rules = useMemo(
    () =>
      (grammarData as GrammarRule[])
        .filter((r) => r.hsk_level <= maxHsk)
        .sort(() => Math.random() - 0.5)
        .slice(0, 10),
    [maxHsk, started]
  );

  const currentRule = rules[currentIndex];

  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (currentRule && started) {
      // Quiz: match pattern to rule title
      const allRules = grammarData as GrammarRule[];
      const wrong = allRules
        .filter((r) => r.id !== currentRule.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((r) => r.title);
      const opts = [...wrong, currentRule.title].sort(() => Math.random() - 0.5);
      setOptions(opts);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  }, [currentIndex, started]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const correct = answer === currentRule.title;
    setIsCorrect(correct);

    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    if (correct) {
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1500);
      const stats = JSON.parse(localStorage.getItem(getUserKey("user_stats")) || "{}");
      stats.xp_today = (stats.xp_today || 0) + 10;
      stats.xp_total = (stats.xp_total || 0) + 10;
      localStorage.setItem(getUserKey("user_stats"), JSON.stringify(stats));
    }

    setTimeout(() => {
      if (currentIndex + 1 < rules.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setSessionComplete(true);
      }
    }, 2000);
  };

  if (!started) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <h1 className="text-lg font-bold">📝 Quiz Grammaire</h1>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-8 text-center space-y-6">
          <div className="text-6xl">📝</div>
          <h2 className="text-2xl font-bold">Quiz de grammaire</h2>
          <p className="text-[#6B7280]">Testez votre connaissance des règles de grammaire.</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                onClick={() => setMaxHsk(level)}
                className={`px-4 py-2 rounded-xl font-bold ${
                  maxHsk === level ? "bg-[#58CC02] text-[#1A1A1A]" : "bg-white text-[#6B7280]"
                }`}
              >
                HSK {level}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setStarted(true); setCurrentIndex(0); setScore({ correct: 0, total: 0 }); setSessionComplete(false); }}
            className="btn-3d bg-[#58CC02] text-[#1A1A1A] font-bold px-8 py-3 rounded-xl text-lg"
          >
            Commencer
          </button>
        </main>
        <Navigation />
      </div>
    );
  }

  if (sessionComplete) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="min-h-screen">
        <main className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
          <div className="text-6xl">{pct >= 80 ? "🎉" : "💪"}</div>
          <h2 className="text-2xl font-bold">Quiz terminé !</h2>
          <div className="bg-gradient-card rounded-2xl p-6 border border-white/5 shadow-card">
            <div className="text-4xl font-bold text-[#58CC02]">{pct}%</div>
            <div className="text-[#6B7280]">{score.correct}/{score.total}</div>
          </div>
          <button
            onClick={() => { setStarted(false); }}
            className="btn-3d bg-[#58CC02] text-[#1A1A1A] font-bold px-6 py-3 rounded-xl"
          >
            Recommencer
          </button>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 bg-[#F7F7F5] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => setStarted(false)} className="text-[#6B7280]">✕</button>
          <div className="flex-1 h-3 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-[#58CC02] rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / rules.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-[#6B7280]">{currentIndex + 1}/{rules.length}</span>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {currentRule && (
          <>
            <div className="bg-gradient-card rounded-2xl p-6 border border-white/5 shadow-card text-center">
              <p className="text-sm text-[#6B7280] mb-2">Quelle règle correspond à ce pattern ?</p>
              <p className="text-2xl font-bold font-mono text-[#1CB0F6]">{currentRule.pattern}</p>
              {currentRule.examples[0] && (
                <div className="mt-4 bg-[#F7F7F5] rounded-lg p-3">
                  <p className="chinese-char text-lg">{currentRule.examples[0].chinese}</p>
                  <ToneDisplay pinyin={currentRule.examples[0].pinyin} size="sm" />
                  <p className="text-sm text-[#6B7280]">{currentRule.examples[0].french}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {options.map((opt, i) => {
                let style = "bg-white border-[#E5E7EB] hover:border-[#3A5060]";
                if (selectedAnswer) {
                  if (opt === currentRule.title) style = "bg-[#58CC02]/20 border-[#58CC02]";
                  else if (opt === selectedAnswer) style = "bg-[#FF4B4B]/20 border-[#FF4B4B]";
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!selectedAnswer}
                    className={`w-full p-4 rounded-xl border-2 text-left font-semibold transition-all ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      {showXp && <XpAnimation amount={10} />}
      <Navigation />
    </div>
  );
}
