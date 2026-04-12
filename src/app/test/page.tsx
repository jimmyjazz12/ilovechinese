"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { getToneNumber } from "@/lib/pinyin";

import hsk1Data from "@/data/hsk1.json";
import hsk2Data from "@/data/hsk2.json";
import hsk3Data from "@/data/hsk3.json";
import hsk4Data from "@/data/hsk4.json";
import grammarData from "@/data/grammar.json";

interface Word {
  simplified: string;
  traditional: string;
  pinyin: string;
  french: string;
  hsk_level: number;
  category: string;
  components: string[];
}

interface GrammarRule {
  id: string;
  hsk_level: number;
  title: string;
  explanation_fr: string;
  pattern: string;
  examples: { chinese: string; pinyin: string; french: string }[];
}

type QuizType =
  | "char_to_french"
  | "french_to_char"
  | "pinyin_tone"
  | "char_to_pinyin"
  | "grammar";

interface TestQuestion {
  type: QuizType;
  word?: Word;
  grammar?: GrammarRule;
  question: string;
  questionLabel: string;
  options: { text: string; correct: boolean }[];
}

const allWords: Word[] = [
  ...(hsk1Data as Word[]),
  ...(hsk2Data as Word[]),
  ...(hsk3Data as Word[]),
  ...(hsk4Data as Word[]),
];

const allGrammar: GrammarRule[] = grammarData as GrammarRule[];

const MAX_HSK_LEVEL = 4;
const TOTAL_QUESTIONS = 30;
const PASS_THRESHOLD = 80;

function getRandomOptions(correct: Word, pool: Word[], count: number): Word[] {
  const others = pool.filter((w) => w.simplified !== correct.simplified);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  const options = shuffled.slice(0, count - 1);
  options.push(correct);
  return options.sort(() => Math.random() - 0.5);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function buildTestQuestions(hskLevel: number): TestQuestion[] {
  const levelWords = allWords.filter((w) => w.hsk_level === hskLevel);
  const levelGrammar = allGrammar.filter((g) => g.hsk_level === hskLevel);

  // Distribution: char_to_french(8), french_to_char(8), pinyin_tone(6), char_to_pinyin(4), grammar(4)
  const distribution: { type: QuizType; count: number }[] = [
    { type: "char_to_french", count: 8 },
    { type: "french_to_char", count: 8 },
    { type: "pinyin_tone", count: 6 },
    { type: "char_to_pinyin", count: 4 },
    { type: "grammar", count: 4 },
  ];

  const questions: TestQuestion[] = [];
  const shuffledWords = [...levelWords].sort(() => Math.random() - 0.5);
  let wordIdx = 0;

  const getNextWord = (): Word => {
    if (wordIdx >= shuffledWords.length) wordIdx = 0;
    return shuffledWords[wordIdx++];
  };

  for (const { type, count } of distribution) {
    for (let i = 0; i < count; i++) {
      if (type === "grammar") {
        if (levelGrammar.length === 0) continue;
        const rule = levelGrammar[i % levelGrammar.length];
        if (!rule.examples || rule.examples.length === 0) continue;

        const correctExample = rule.examples[0];
        const otherRules = allGrammar.filter(
          (g) => g.id !== rule.id && g.examples && g.examples.length > 0
        );
        const shuffledOther = [...otherRules].sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [
          { text: correctExample.chinese, correct: true },
          ...shuffledOther.map((r) => ({
            text: r.examples[0].chinese,
            correct: false,
          })),
        ].sort(() => Math.random() - 0.5);

        questions.push({
          type: "grammar",
          grammar: rule,
          question: rule.title,
          questionLabel: `Grammaire: ${rule.pattern}`,
          options,
        });
      } else {
        const word = getNextWord();
        const pool = levelWords.length >= 4 ? levelWords : allWords.filter((w) => w.hsk_level <= hskLevel);

        switch (type) {
          case "char_to_french": {
            const opts = getRandomOptions(word, pool, 4);
            questions.push({
              type,
              word,
              question: word.simplified,
              questionLabel: "Quel est le sens de ce caractere ?",
              options: opts.map((w) => ({
                text: w.french,
                correct: w.simplified === word.simplified,
              })),
            });
            break;
          }
          case "french_to_char": {
            const opts = getRandomOptions(word, pool, 4);
            questions.push({
              type,
              word,
              question: word.french,
              questionLabel: "Quel caractere correspond ?",
              options: opts.map((w) => ({
                text: w.simplified,
                correct: w.simplified === word.simplified,
              })),
            });
            break;
          }
          case "pinyin_tone": {
            questions.push({
              type,
              word,
              question: word.simplified,
              questionLabel: "Quel est le ton correct ?",
              options: [1, 2, 3, 4].map((t) => ({
                text: `Ton ${t}`,
                correct: getToneNumber(word.pinyin) === t,
              })),
            });
            break;
          }
          case "char_to_pinyin": {
            const opts = getRandomOptions(word, pool, 4);
            questions.push({
              type,
              word,
              question: word.simplified,
              questionLabel: "Quel est le pinyin de ce caractere ?",
              options: opts.map((w) => ({
                text: w.pinyin,
                correct: w.simplified === word.simplified,
              })),
            });
            break;
          }
        }
      }
    }
  }

  // Shuffle all questions
  return questions.sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
}

export default function TestPage() {
  const [hskLevel, setHskLevel] = useState(1);
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load HSK level from localStorage
  useEffect(() => {
    try {
      const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
      const level = stats.current_hsk_level || 1;
      setHskLevel(level);
    } catch {
      /* ignore */
    }
  }, []);

  // Timer
  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, finished]);

  const startTest = useCallback(() => {
    const q = buildTestQuestions(hskLevel);
    setQuestions(q);
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedOption(null);
    setAnswered(false);
    setFinished(false);
    setElapsedSeconds(0);
    setShowCelebration(false);
    setStarted(true);
  }, [hskLevel]);

  const handleSelect = (optionIdx: number) => {
    if (answered) return;
    setSelectedOption(optionIdx);
    setAnswered(true);

    const isCorrect = questions[currentIdx].options[optionIdx].correct;
    setAnswers((prev) => [...prev, isCorrect]);
  };

  const advanceToNext = () => {
    setTransitioning(true);
    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
        setSelectedOption(null);
        setAnswered(false);
      } else {
        // Test complete
        setFinished(true);
        const correctCount = [...answers].filter(Boolean).length;
        const score = Math.round((correctCount / questions.length) * 100);

        if (score >= PASS_THRESHOLD && hskLevel < MAX_HSK_LEVEL) {
          // Level up!
          const newLevel = hskLevel + 1;
          try {
            const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
            stats.current_hsk_level = newLevel;
            localStorage.setItem("user_stats", JSON.stringify(stats));
          } catch {
            /* ignore */
          }
          setShowCelebration(true);
        }

        // Award XP for taking the test
        try {
          const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
          const xpBonus = score >= PASS_THRESHOLD ? 100 : 30;
          stats.xp_today = (stats.xp_today || 0) + xpBonus;
          stats.xp_total = (stats.xp_total || 0) + xpBonus;
          localStorage.setItem("user_stats", JSON.stringify(stats));
        } catch {
          /* ignore */
        }
      }
      setTransitioning(false);
    }, 300);
  };

  const score = useMemo(() => {
    if (!finished || answers.length === 0) return 0;
    return Math.round((answers.filter(Boolean).length / answers.length) * 100);
  }, [finished, answers]);

  const passed = score >= PASS_THRESHOLD;

  // ── INTRO SCREEN ──
  if (!started) {
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <Link href="/" className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-[#1A1A1A]">Test HSK {hskLevel}</h1>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#FFD700] to-[#FF9600] rounded-full flex items-center justify-center text-5xl shadow-lg">
              🏆
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Test de niveau HSK {hskLevel}</h2>
            <p className="text-[#6B7280] text-sm max-w-xs mx-auto">
              Prouve que tu maitrises le vocabulaire HSK {hskLevel} pour passer au niveau suivant !
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#1A1A1A]">Informations du test</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1CB0F6]/10 rounded-lg flex items-center justify-center text-sm">
                  📝
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{TOTAL_QUESTIONS} questions</p>
                  <p className="text-xs text-[#6B7280]">Mix de vocabulaire, tons et grammaire</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#58CC02]/10 rounded-lg flex items-center justify-center text-sm">
                  🎯
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{PASS_THRESHOLD}% pour reussir</p>
                  <p className="text-xs text-[#6B7280]">{Math.ceil(TOTAL_QUESTIONS * PASS_THRESHOLD / 100)} bonnes reponses minimum</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FFD700]/10 rounded-lg flex items-center justify-center text-sm">
                  ⚡
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">+100 XP si reussi</p>
                  <p className="text-xs text-[#6B7280]">+30 XP de participation</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
            <h3 className="font-bold text-sm text-[#1A1A1A] mb-3">Types de questions</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F7F7F5] rounded-lg p-2.5">
                <span className="font-semibold text-[#1A1A1A]">Caractere → Francais</span>
                <span className="block text-[#6B7280]">8 questions</span>
              </div>
              <div className="bg-[#F7F7F5] rounded-lg p-2.5">
                <span className="font-semibold text-[#1A1A1A]">Francais → Caractere</span>
                <span className="block text-[#6B7280]">8 questions</span>
              </div>
              <div className="bg-[#F7F7F5] rounded-lg p-2.5">
                <span className="font-semibold text-[#1A1A1A]">Tons</span>
                <span className="block text-[#6B7280]">6 questions</span>
              </div>
              <div className="bg-[#F7F7F5] rounded-lg p-2.5">
                <span className="font-semibold text-[#1A1A1A]">Pinyin</span>
                <span className="block text-[#6B7280]">4 questions</span>
              </div>
              <div className="col-span-2 bg-[#F7F7F5] rounded-lg p-2.5">
                <span className="font-semibold text-[#1A1A1A]">Grammaire</span>
                <span className="block text-[#6B7280]">4 questions</span>
              </div>
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full bg-gradient-to-r from-[#FFD700] to-[#FF9600] text-[#1A1A1A] font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Commencer le test
          </button>

          <Link
            href="/"
            className="block text-center text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          >
            Retour au tableau de bord
          </Link>
        </main>
        <Navigation />
      </div>
    );
  }

  // ── RESULTS SCREEN ──
  if (finished) {
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Celebration animation */}
          {showCelebration && (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="text-center animate-bounce">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute text-3xl animate-ping"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${10 + Math.random() * 60}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random() * 2}s`,
                    }}
                  >
                    {["🎉", "🎊", "⭐", "✨", "🏆", "🌟"][i % 6]}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-center space-y-3">
            <div className="text-6xl mb-2">
              {passed ? "🏆" : score >= 50 ? "💪" : "📚"}
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">
              {passed ? "Test reussi !" : "Test termine"}
            </h2>
            {passed && hskLevel < MAX_HSK_LEVEL && (
              <div className="bg-gradient-to-r from-[#FFD700] to-[#FF9600] text-[#1A1A1A] font-bold px-6 py-3 rounded-2xl text-lg inline-block shadow-lg animate-pulse">
                Felicitations ! Tu passes au HSK {hskLevel + 1} !
              </div>
            )}
            {passed && hskLevel >= MAX_HSK_LEVEL && (
              <div className="bg-gradient-to-r from-[#FFD700] to-[#FF9600] text-[#1A1A1A] font-bold px-6 py-3 rounded-2xl text-lg inline-block shadow-lg">
                Tu maitrises tous les niveaux disponibles !
              </div>
            )}
            {!passed && (
              <p className="text-[#6B7280] text-sm">
                Il faut {PASS_THRESHOLD}% pour passer au niveau suivant. Continue a apprendre !
              </p>
            )}
          </div>

          {/* Score card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm text-center">
            <div
              className={`text-5xl font-bold mb-1 ${
                passed ? "text-[#58CC02]" : "text-[#FF9600]"
              }`}
            >
              {score}%
            </div>
            <div className="text-[#6B7280] text-sm">
              {answers.filter(Boolean).length} / {answers.length} bonnes reponses
            </div>
            <div className="mt-3 w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${score}%`,
                  background: passed
                    ? "linear-gradient(90deg, #58CC02, #1CB0F6)"
                    : "linear-gradient(90deg, #FF9600, #FF4B4B)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-[#6B7280]">
              <span>0%</span>
              <span className="font-semibold">{PASS_THRESHOLD}% requis</span>
              <span>100%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <div className="text-2xl font-bold text-[#1CB0F6]">{formatTime(elapsedSeconds)}</div>
              <div className="text-xs text-[#6B7280]">Temps</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <div className="text-2xl font-bold text-[#FFD700]">+{passed ? 100 : 30}</div>
              <div className="text-xs text-[#6B7280]">XP gagnes</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!passed && (
              <button
                onClick={() => {
                  setStarted(false);
                  setFinished(false);
                }}
                className="w-full bg-[#FF9600] hover:bg-[#E08600] text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-md"
              >
                Reessayer le test
              </button>
            )}
            <Link
              href="/"
              className="block w-full bg-[#58CC02] hover:bg-[#46A302] text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-md text-center"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </main>
        <Navigation />
      </div>
    );
  }

  // ── QUIZ SCREEN ──
  const currentQ = questions[currentIdx];

  return (
    <div
      className={`min-h-screen bg-[#F7F7F5] transition-opacity duration-300 ${
        transitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm("Abandonner le test ? Ta progression ne sera pas sauvegardee.")) {
                  setStarted(false);
                  setFinished(false);
                }
              }}
              className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1 h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentIdx + 1) / questions.length) * 100}%`,
                  background: "linear-gradient(90deg, #FFD700, #FF9600)",
                }}
              />
            </div>
            <span className="text-xs text-[#6B7280] font-medium whitespace-nowrap">
              {currentIdx + 1}/{questions.length}
            </span>
            <span className="text-xs text-[#6B7280] font-mono bg-[#F7F7F5] px-2 py-0.5 rounded-md">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-semibold text-[#FF9600]">
              Test HSK {hskLevel}
            </span>
            <span className="text-xs text-[#6B7280]">
              {answers.filter(Boolean).length} correct{answers.filter(Boolean).length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Question card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm text-center">
          <p className="text-xs text-[#6B7280] mb-2 uppercase tracking-wide font-semibold">
            {currentQ.questionLabel}
          </p>
          {currentQ.type === "grammar" && currentQ.grammar ? (
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">{currentQ.grammar.title}</h2>
              <p className="text-sm text-[#6B7280]">{currentQ.grammar.pattern}</p>
              <p className="text-xs text-[#6B7280] mt-1">{currentQ.grammar.explanation_fr}</p>
            </div>
          ) : (
            <h2
              className={`font-bold text-[#1A1A1A] ${
                currentQ.type === "french_to_char"
                  ? "text-2xl"
                  : "text-4xl"
              }`}
            >
              {currentQ.question}
            </h2>
          )}
          {currentQ.word && currentQ.type !== "french_to_char" && (
            <button
              onClick={() => {
                const u = new SpeechSynthesisUtterance(currentQ.word!.simplified);
                u.lang = "zh-CN";
                u.rate = 0.8;
                speechSynthesis.speak(u);
              }}
              className="mt-3 text-[#1CB0F6] text-sm hover:underline"
            >
              🔊 Ecouter
            </button>
          )}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {currentQ.options.map((opt, idx) => {
            let btnClass =
              "w-full p-4 rounded-2xl text-left font-semibold text-sm transition-all border-2";

            if (!answered) {
              btnClass += " bg-white border-[#E5E7EB] text-[#1A1A1A] hover:border-[#FF9600] cursor-pointer active:scale-[0.98]";
            } else if (opt.correct) {
              btnClass += " border-[#58CC02] text-[#58CC02] bg-[#58CC02]/5";
            } else if (idx === selectedOption && !opt.correct) {
              btnClass += " border-[#FF4B4B] text-[#FF4B4B] bg-[#FF4B4B]/5";
            } else {
              btnClass += " bg-white border-[#E5E7EB] text-[#6B7280] opacity-40";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={btnClass}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      answered && opt.correct
                        ? "border-[#58CC02] bg-[#58CC02] text-white"
                        : answered && idx === selectedOption && !opt.correct
                        ? "border-[#FF4B4B] bg-[#FF4B4B] text-white"
                        : "border-[#E5E7EB] text-[#6B7280]"
                    }`}
                  >
                    {answered && opt.correct
                      ? "✓"
                      : answered && idx === selectedOption && !opt.correct
                      ? "✗"
                      : String.fromCharCode(65 + idx)}
                  </span>
                  <span className={currentQ.type === "french_to_char" || currentQ.type === "char_to_pinyin" ? "" : ""}>
                    {opt.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        {answered && (
          <button
            onClick={advanceToNext}
            className="w-full bg-gradient-to-r from-[#FFD700] to-[#FF9600] text-[#1A1A1A] font-bold py-3.5 rounded-xl text-base transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {currentIdx + 1 < questions.length ? "Suivant" : "Voir les resultats"}
          </button>
        )}
      </main>
      <Navigation />
    </div>
  );
}
