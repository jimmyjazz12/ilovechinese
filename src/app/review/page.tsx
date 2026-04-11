"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";
import QuizCard from "@/components/QuizCard";
import XpAnimation from "@/components/XpAnimation";
import { getToneNumber, removeTones } from "@/lib/pinyin";
import { calculateNextReview, getMasteryLabel } from "@/lib/srs";

import hsk1Data from "@/data/hsk1.json";
import hsk2Data from "@/data/hsk2.json";
import hsk3Data from "@/data/hsk3.json";
import hsk4Data from "@/data/hsk4.json";

interface Word {
  simplified: string;
  traditional: string;
  pinyin: string;
  french: string;
  hsk_level: number;
  category: string;
  components: string[];
}

interface Progress {
  vocabulary_id: string;
  overall_mastery: number;
  easiness_factor: number;
  interval_days: number;
  next_review: string;
  last_reviewed: string;
  correct_count: number;
  incorrect_count: number;
  streak: number;
  tone_mastery: number;
  pinyin_mastery: number;
  character_mastery: number;
}

type QuizType =
  | "char_to_french"
  | "french_to_char"
  | "audio_to_char"
  | "pinyin_tone"
  | "char_to_pinyin";

const allWords: Word[] = [
  ...(hsk1Data as Word[]),
  ...(hsk2Data as Word[]),
  ...(hsk3Data as Word[]),
  ...(hsk4Data as Word[]),
];

function getRandomOptions(correct: Word, allOpts: Word[], count: number): Word[] {
  const sameLevel = allOpts.filter(
    (w) => w.hsk_level === correct.hsk_level && w.simplified !== correct.simplified
  );
  const shuffled = [...sameLevel].sort(() => Math.random() - 0.5);
  const options = shuffled.slice(0, count - 1);
  options.push(correct);
  return options.sort(() => Math.random() - 0.5);
}

export default function ReviewPage() {
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [currentHsk, setCurrentHsk] = useState(1);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizType, setQuizType] = useState<QuizType>("char_to_french");
  const [showXp, setShowXp] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("srs_progress");
    if (saved) setProgress(JSON.parse(saved));
  }, []);

  const startSession = () => {
    const hskWords = allWords.filter((w) => w.hsk_level <= currentHsk);

    // Get words due for review + new words
    const now = new Date().toISOString();
    const dueWords: Word[] = [];
    const newWords: Word[] = [];

    for (const word of hskWords) {
      const key = word.simplified;
      const prog = progress[key];
      if (!prog) {
        newWords.push(word);
      } else if (prog.next_review <= now) {
        dueWords.push(word);
      }
    }

    // Mix: prioritize due words, add new words up to 20 total
    const session = [
      ...dueWords.sort(() => Math.random() - 0.5).slice(0, 15),
      ...newWords.sort(() => Math.random() - 0.5).slice(0, 5),
    ].slice(0, 20);

    if (session.length === 0) {
      // No words to review, take random new words
      const random = [...hskWords].sort(() => Math.random() - 0.5).slice(0, 10);
      setSessionWords(random);
    } else {
      setSessionWords(session);
    }

    setCurrentIndex(0);
    setSessionScore({ correct: 0, total: 0 });
    setSessionComplete(false);
    setStarted(true);
    pickQuizType();
  };

  const pickQuizType = () => {
    const types: QuizType[] = [
      "char_to_french",
      "french_to_char",
      "audio_to_char",
      "pinyin_tone",
      "char_to_pinyin",
    ];
    setQuizType(types[Math.floor(Math.random() * types.length)]);
  };

  const handleAnswer = (correct: boolean) => {
    const word = sessionWords[currentIndex];
    if (!word) return;

    const key = word.simplified;
    const currentProg = progress[key] || {
      vocabulary_id: key,
      overall_mastery: 0,
      easiness_factor: 2.5,
      interval_days: 0,
      next_review: new Date().toISOString(),
      last_reviewed: new Date().toISOString(),
      correct_count: 0,
      incorrect_count: 0,
      streak: 0,
      tone_mastery: 0,
      pinyin_mastery: 0,
      character_mastery: 0,
    };

    const quality = correct ? 4 : 1;
    const srsResult = calculateNextReview(currentProg, quality);

    const updated: Progress = {
      ...currentProg,
      ...srsResult,
      last_reviewed: new Date().toISOString(),
    };

    // Update mastery flags based on quiz type
    if (correct) {
      if (quizType === "pinyin_tone") updated.tone_mastery = Math.min(5, currentProg.tone_mastery + 1);
      if (quizType === "char_to_pinyin") updated.pinyin_mastery = Math.min(5, currentProg.pinyin_mastery + 1);
      if (quizType === "char_to_french" || quizType === "french_to_char")
        updated.character_mastery = Math.min(5, currentProg.character_mastery + 1);
    }

    const newProgress = { ...progress, [key]: updated };
    setProgress(newProgress);
    localStorage.setItem("srs_progress", JSON.stringify(newProgress));

    // XP
    if (correct) {
      const xp = 10;
      setXpGained(xp);
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1500);

      const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
      stats.xp_today = (stats.xp_today || 0) + xp;
      stats.xp_total = (stats.xp_total || 0) + xp;
      localStorage.setItem("user_stats", JSON.stringify(stats));
    }

    setSessionScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    // Next question
    setTimeout(() => {
      if (currentIndex + 1 < sessionWords.length) {
        setCurrentIndex(currentIndex + 1);
        pickQuizType();
      } else {
        setSessionComplete(true);
      }
    }, 1500);
  };

  const currentWord = sessionWords[currentIndex];

  const quizData = useMemo(() => {
    if (!currentWord) return null;

    const options = getRandomOptions(currentWord, allWords, 4);

    switch (quizType) {
      case "char_to_french":
        return {
          question: currentWord.simplified,
          questionLabel: "Quel est le sens de ce caractère ?",
          options: options.map((w) => ({ text: w.french, correct: w.simplified === currentWord.simplified })),
          showChinese: true,
        };
      case "french_to_char":
        return {
          question: currentWord.french,
          questionLabel: "Quel caractère correspond ?",
          options: options.map((w) => ({ text: w.simplified, correct: w.simplified === currentWord.simplified })),
          showChinese: false,
        };
      case "audio_to_char":
        return {
          question: "🔊",
          questionLabel: "Écoutez et choisissez le bon caractère",
          options: options.map((w) => ({ text: w.simplified, correct: w.simplified === currentWord.simplified })),
          showChinese: false,
          autoPlay: true,
        };
      case "pinyin_tone":
        return {
          question: currentWord.simplified,
          questionLabel: "Quel est le ton correct ?",
          options: [1, 2, 3, 4].map((t) => ({
            text: `Ton ${t}`,
            correct: getToneNumber(currentWord.pinyin) === t,
          })),
          showChinese: true,
        };
      case "char_to_pinyin":
        return {
          question: currentWord.simplified,
          questionLabel: "Quel est le pinyin de ce caractère ?",
          options: options.map((w) => ({ text: w.pinyin, correct: w.simplified === currentWord.simplified })),
          showChinese: true,
        };
      default:
        return null;
    }
  }, [currentWord, quizType]);

  // Auto-play audio for audio quiz
  useEffect(() => {
    if (quizData?.autoPlay && currentWord) {
      const utterance = new SpeechSynthesisUtterance(currentWord.simplified);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  }, [quizData, currentWord]);

  if (!started) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <h1 className="text-lg font-bold">🧠 Révision</h1>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-8 text-center space-y-6">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-2xl font-bold">Session de révision</h2>
          <p className="text-[#9EAAB4]">
            Révisez votre vocabulaire avec des quiz intelligents adaptés à votre niveau.
          </p>

          <div className="space-y-3">
            <label className="text-sm text-[#9EAAB4]">Niveau maximum</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onClick={() => setCurrentHsk(level)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    currentHsk === level
                      ? "bg-[#58CC02] text-white"
                      : "bg-[#1A2C34] text-[#9EAAB4] hover:bg-[#223A44] hover-scale"
                  }`}
                >
                  HSK {level}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="btn-3d bg-[#58CC02] hover:bg-[#46A302] text-white font-bold px-8 py-3 rounded-xl text-lg"
          >
            Commencer la révision
          </button>
        </main>
        <Navigation />
      </div>
    );
  }

  if (sessionComplete) {
    const percentage = Math.round((sessionScore.correct / sessionScore.total) * 100);
    return (
      <div className="min-h-screen">
        <main className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
          <div className="text-6xl mb-4">{percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "💪"}</div>
          <h2 className="text-2xl font-bold">Session terminée !</h2>
          <div className="bg-gradient-card rounded-2xl p-6 border border-white/5 shadow-card">
            <div className="text-4xl font-bold text-[#58CC02] mb-2">{percentage}%</div>
            <div className="text-[#9EAAB4]">
              {sessionScore.correct} / {sessionScore.total} bonnes réponses
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startSession}
              className="btn-3d bg-[#58CC02] hover:bg-[#46A302] text-white font-bold px-6 py-3 rounded-xl"
            >
              Nouvelle session
            </button>
            <button
              onClick={() => setStarted(false)}
              className="btn-3d bg-[#1A2C34] border border-[#2A4050] text-white font-bold px-6 py-3 rounded-xl"
            >
              Retour
            </button>
          </div>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-[#131F24] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStarted(false)} className="text-[#9EAAB4]">
              ✕
            </button>
            <div className="flex-1 h-3 bg-[#1A2C34] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#58CC02] rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / sessionWords.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-[#9EAAB4]">
              {currentIndex + 1}/{sessionWords.length}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6">
        {quizData && (
          <QuizCard
            question={quizData.question}
            questionLabel={quizData.questionLabel}
            options={quizData.options}
            onAnswer={handleAnswer}
            showChinese={quizData.showChinese}
          />
        )}

        {/* Replay audio button for audio quiz */}
        {quizType === "audio_to_char" && currentWord && (
          <button
            onClick={() => {
              const u = new SpeechSynthesisUtterance(currentWord.simplified);
              u.lang = "zh-CN";
              u.rate = 0.8;
              speechSynthesis.speak(u);
            }}
            className="mx-auto mt-4 btn-3d bg-[#1CB0F6] text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2"
          >
            🔊 Réécouter
          </button>
        )}
      </main>

      {showXp && <XpAnimation amount={xpGained} />}
      <Navigation />
    </div>
  );
}
