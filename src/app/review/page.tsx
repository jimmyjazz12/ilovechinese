"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Navigation from "@/components/Navigation";
import QuizCard from "@/components/QuizCard";
import XpAnimation from "@/components/XpAnimation";
import { getToneNumber, removeTones } from "@/lib/pinyin";
import {
  calculateNextReview,
  getBoxLabel,
  getBoxColor,
  isWordMastered,
  getWordsToReview,
  getWordsByBox,
  getDueCount,
} from "@/lib/srs";

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

interface Progress {
  vocabulary_id: string;
  overall_mastery: number;
  box_level: number;
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
  | "audio_to_char"
  | "pinyin_tone"
  | "char_to_pinyin"
  | "pronunciation"
  | "grammar";

type SessionType = "smart" | "srs_only" | "new_words" | "tones_pinyin";

interface SessionItem {
  type: "vocabulary" | "grammar" | "pronunciation";
  word?: Word;
  grammar?: GrammarRule;
  quizType: QuizType;
}

interface SessionResult {
  word?: string;
  correct: boolean;
  oldBox: number;
  newBox: number;
  isNew: boolean;
}

const allWords: Word[] = [
  ...(hsk1Data as Word[]),
  ...(hsk2Data as Word[]),
  ...(hsk3Data as Word[]),
  ...(hsk4Data as Word[]),
];

const allGrammar: GrammarRule[] = grammarData as GrammarRule[];

function getRandomOptions(correct: Word, allOpts: Word[], count: number): Word[] {
  const sameLevel = allOpts.filter(
    (w) => w.hsk_level === correct.hsk_level && w.simplified !== correct.simplified
  );
  const shuffled = [...sameLevel].sort(() => Math.random() - 0.5);
  const options = shuffled.slice(0, count - 1);
  options.push(correct);
  return options.sort(() => Math.random() - 0.5);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ReviewPage() {
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [currentHsk, setCurrentHsk] = useState(1);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showXp, setShowXp] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [started, setStarted] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("smart");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pronunciation state
  const [pronResult, setPronResult] = useState<"idle" | "listening" | "correct" | "incorrect">("idle");
  const [pronTranscript, setPronTranscript] = useState("");

  // Grammar quiz state
  const [grammarAnswer, setGrammarAnswer] = useState<number | null>(null);
  const [grammarAnswered, setGrammarAnswered] = useState(false);

  useEffect(() => {
    // Load SRS progress
    const saved = localStorage.getItem("srs_progress");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old progress entries that lack box_level
      const migrated: Record<string, Progress> = {};
      for (const [key, val] of Object.entries(parsed)) {
        const p = val as Progress;
        if (p.box_level === undefined || p.box_level === null) {
          p.box_level = p.overall_mastery ?? 0;
        }
        migrated[key] = p;
      }
      setProgress(migrated);
    }

    // Auto-set HSK level from user_stats
    try {
      const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
      const level = stats.current_hsk_level || 1;
      setCurrentHsk(level);
    } catch {
      /* ignore */
    }
  }, []);

  // Timer
  useEffect(() => {
    if (started && !sessionComplete) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, sessionComplete]);

  const buildSession = useCallback(() => {
    const hskWords = allWords.filter((w) => w.hsk_level <= currentHsk);
    const hskGrammar = allGrammar.filter((g) => g.hsk_level <= currentHsk);
    const now = new Date().toISOString();
    const dueWords: Word[] = [];
    const newWords: Word[] = [];

    // Due reviews can come from any level <= currentHsk
    // New words only come from the current HSK level
    for (const word of hskWords) {
      const key = word.simplified;
      const prog = progress[key];
      if (!prog) {
        // Only introduce new words from the current level
        if (word.hsk_level === currentHsk) {
          newWords.push(word);
        }
      } else if (prog.next_review <= now) {
        dueWords.push(word);
      }
    }

    // Sort due words by box level (lowest first = most urgent)
    dueWords.sort((a, b) => {
      const boxA = progress[a.simplified]?.box_level ?? 0;
      const boxB = progress[b.simplified]?.box_level ?? 0;
      return boxA - boxB;
    });

    const shuffledNew = [...newWords].sort(() => Math.random() - 0.5);

    const vocabTypes: QuizType[] = [
      "char_to_french",
      "french_to_char",
      "audio_to_char",
      "pinyin_tone",
      "char_to_pinyin",
    ];
    const toneTypes: QuizType[] = ["pinyin_tone", "char_to_pinyin", "audio_to_char"];

    const pickVocabType = (): QuizType => vocabTypes[Math.floor(Math.random() * vocabTypes.length)];
    const pickToneType = (): QuizType => toneTypes[Math.floor(Math.random() * toneTypes.length)];

    let items: SessionItem[] = [];

    if (sessionType === "smart") {
      // 60% SRS due, 20% new, 10% grammar, 10% pronunciation
      const targetTotal = 20;
      const srsCount = Math.min(Math.round(targetTotal * 0.6), dueWords.length);
      const newCount = Math.min(Math.round(targetTotal * 0.2), shuffledNew.length);
      const grammarCount = Math.min(Math.round(targetTotal * 0.1), hskGrammar.length);
      const pronCount = Math.round(targetTotal * 0.1);

      // SRS due words
      for (let i = 0; i < srsCount; i++) {
        items.push({ type: "vocabulary", word: dueWords[i], quizType: pickVocabType() });
      }
      // New words
      for (let i = 0; i < newCount; i++) {
        items.push({ type: "vocabulary", word: shuffledNew[i], quizType: pickVocabType() });
      }
      // Grammar
      const shuffledGrammar = [...hskGrammar].sort(() => Math.random() - 0.5);
      for (let i = 0; i < grammarCount && i < shuffledGrammar.length; i++) {
        items.push({ type: "grammar", grammar: shuffledGrammar[i], quizType: "grammar" });
      }
      // Pronunciation
      const pronWords = [...hskWords].sort(() => Math.random() - 0.5);
      for (let i = 0; i < pronCount && i < pronWords.length; i++) {
        items.push({ type: "pronunciation", word: pronWords[i], quizType: "pronunciation" });
      }

      // Fill remaining slots if needed
      const remaining = targetTotal - items.length;
      if (remaining > 0) {
        const filler = [...hskWords].sort(() => Math.random() - 0.5);
        for (let i = 0; i < remaining && i < filler.length; i++) {
          items.push({ type: "vocabulary", word: filler[i], quizType: pickVocabType() });
        }
      }
    } else if (sessionType === "srs_only") {
      const count = Math.min(20, dueWords.length);
      for (let i = 0; i < count; i++) {
        items.push({ type: "vocabulary", word: dueWords[i], quizType: pickVocabType() });
      }
      if (items.length === 0) {
        // No due words, take random
        const random = [...hskWords].sort(() => Math.random() - 0.5).slice(0, 10);
        for (const w of random) {
          items.push({ type: "vocabulary", word: w, quizType: pickVocabType() });
        }
      }
    } else if (sessionType === "new_words") {
      const count = Math.min(20, shuffledNew.length);
      for (let i = 0; i < count; i++) {
        items.push({ type: "vocabulary", word: shuffledNew[i], quizType: pickVocabType() });
      }
      if (items.length === 0) {
        const random = [...hskWords].sort(() => Math.random() - 0.5).slice(0, 10);
        for (const w of random) {
          items.push({ type: "vocabulary", word: w, quizType: pickVocabType() });
        }
      }
    } else if (sessionType === "tones_pinyin") {
      const count = Math.min(20, hskWords.length);
      const shuffled = [...hskWords].sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        items.push({ type: "vocabulary", word: shuffled[i], quizType: pickToneType() });
      }
    }

    // Shuffle to mix types
    items = items.sort(() => Math.random() - 0.5);
    return items.slice(0, 20);
  }, [currentHsk, progress, sessionType]);

  const startSession = () => {
    const items = buildSession();
    setSessionItems(items);
    setCurrentIndex(0);
    setSessionScore({ correct: 0, total: 0 });
    setSessionComplete(false);
    setSessionResults([]);
    setElapsedSeconds(0);
    setTotalXpEarned(0);
    setStarted(true);
    setPronResult("idle");
    setPronTranscript("");
    setGrammarAnswer(null);
    setGrammarAnswered(false);
  };

  const handleVocabAnswer = (correct: boolean) => {
    const item = sessionItems[currentIndex];
    if (!item?.word) return;

    const word = item.word;
    const key = word.simplified;
    const currentProg = progress[key] || {
      vocabulary_id: key,
      overall_mastery: 0,
      box_level: 0,
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

    const oldBox = currentProg.box_level ?? 0;
    const isNew = !progress[key];
    const quality = correct ? 4 : 1;
    const srsResult = calculateNextReview(currentProg, quality);

    const updated: Progress = {
      ...currentProg,
      ...srsResult,
      last_reviewed: new Date().toISOString(),
    };

    // Update mastery flags based on quiz type
    if (correct) {
      const qt = item.quizType;
      if (qt === "pinyin_tone") updated.tone_mastery = Math.min(5, currentProg.tone_mastery + 1);
      if (qt === "char_to_pinyin" || qt === "audio_to_char") updated.pinyin_mastery = Math.min(5, currentProg.pinyin_mastery + 1);
      if (qt === "char_to_french" || qt === "french_to_char")
        updated.character_mastery = Math.min(5, currentProg.character_mastery + 1);
    }

    const newProgress = { ...progress, [key]: updated };
    setProgress(newProgress);
    localStorage.setItem("srs_progress", JSON.stringify(newProgress));

    // XP
    const xp = correct ? (isNew ? 15 : 10) : 2;
    setXpGained(xp);
    setTotalXpEarned((prev) => prev + xp);
    if (correct) {
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1500);
    }

    const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
    stats.xp_today = (stats.xp_today || 0) + xp;
    stats.xp_total = (stats.xp_total || 0) + xp;
    localStorage.setItem("user_stats", JSON.stringify(stats));

    setSessionResults((prev) => [
      ...prev,
      {
        word: key,
        correct,
        oldBox,
        newBox: updated.box_level,
        isNew,
      },
    ]);

    setSessionScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    // Transition to next
    setTimeout(() => {
      advanceToNext();
    }, 1500);
  };

  const handleGrammarAnswer = (optionIdx: number, isCorrect: boolean) => {
    if (grammarAnswered) return;
    setGrammarAnswer(optionIdx);
    setGrammarAnswered(true);

    setSessionScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    if (isCorrect) {
      const xp = 10;
      setXpGained(xp);
      setTotalXpEarned((prev) => prev + xp);
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1500);

      const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
      stats.xp_today = (stats.xp_today || 0) + xp;
      stats.xp_total = (stats.xp_total || 0) + xp;
      localStorage.setItem("user_stats", JSON.stringify(stats));
    }

    setSessionResults((prev) => [
      ...prev,
      { correct: isCorrect, oldBox: -1, newBox: -1, isNew: false },
    ]);

    setTimeout(() => {
      advanceToNext();
    }, 2000);
  };

  const pronRecognitionRef = useRef<any>(null);

  const handlePronunciation = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      // No speech recognition: skip and mark as correct
      setPronResult("correct");
      setPronTranscript("(reconnaissance vocale non disponible)");
      setSessionScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      setSessionResults((prev) => [...prev, { correct: true, oldBox: -1, newBox: -1, isNew: false }]);
      setTimeout(() => advanceToNext(), 1500);
      return;
    }

    setPronResult("listening");
    setPronTranscript("");

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;
    pronRecognitionRef.current = recognition;

    let hasResult = false;

    recognition.onresult = (event: any) => {
      hasResult = true;
      const item = sessionItems[currentIndex];
      if (!item?.word) return;

      const target = item.word.simplified;
      let matched = false;
      let bestTranscript = "";

      for (let i = 0; i < (event.results[0]?.length || 1); i++) {
        const transcript = (event.results[0]?.[i]?.transcript || "").trim();
        if (!bestTranscript) bestTranscript = transcript;
        if (transcript.includes(target) || target.includes(transcript)) {
          matched = true;
          bestTranscript = transcript;
          break;
        }
      }

      setPronTranscript(bestTranscript);
      setPronResult(matched ? "correct" : "incorrect");
      setSessionScore((prev) => ({ correct: prev.correct + (matched ? 1 : 0), total: prev.total + 1 }));

      if (matched) {
        setXpGained(15);
        setTotalXpEarned((prev) => prev + 15);
        setShowXp(true);
        setTimeout(() => setShowXp(false), 1500);
      }

      setSessionResults((prev) => [...prev, { word: target, correct: matched, oldBox: -1, newBox: -1, isNew: false }]);
      setTimeout(() => advanceToNext(), 2000);
    };

    recognition.onerror = (e: any) => {
      console.log("Speech recognition error:", e?.error);
      if (!hasResult) {
        setPronResult("incorrect");
        setPronTranscript("Erreur micro - réessayez");
        setSessionScore((prev) => ({ ...prev, total: prev.total + 1 }));
        setSessionResults((prev) => [...prev, { correct: false, oldBox: -1, newBox: -1, isNew: false }]);
        setTimeout(() => advanceToNext(), 2000);
      }
    };

    recognition.onend = () => {
      pronRecognitionRef.current = null;
      // If no result received, timeout
      if (!hasResult) {
        setPronResult("incorrect");
        setPronTranscript("Rien détecté - réessayez");
        setSessionScore((prev) => ({ ...prev, total: prev.total + 1 }));
        setSessionResults((prev) => [...prev, { correct: false, oldBox: -1, newBox: -1, isNew: false }]);
        setTimeout(() => advanceToNext(), 2000);
      }
    };

    try {
      recognition.start();
      // Auto-stop after 5 seconds
      setTimeout(() => {
        try { recognition.stop(); } catch {}
      }, 5000);
    } catch (err) {
      setPronResult("incorrect");
      setPronTranscript("Erreur : vérifiez les permissions micro");
      setTimeout(() => advanceToNext(), 2000);
    }
  };

  const stopPronRecording = () => {
    if (pronRecognitionRef.current) {
      try { pronRecognitionRef.current.stop(); } catch {}
      pronRecognitionRef.current = null;
    }
  };

  const advanceToNext = () => {
    setTransitioning(true);
    setTimeout(() => {
      if (currentIndex + 1 < sessionItems.length) {
        setCurrentIndex(currentIndex + 1);
        setPronResult("idle");
        setPronTranscript("");
        setGrammarAnswer(null);
        setGrammarAnswered(false);
      } else {
        setSessionComplete(true);
      }
      setTransitioning(false);
    }, 300);
  };

  const currentItem = sessionItems[currentIndex];

  // Build quiz data for vocabulary items
  const quizData = useMemo(() => {
    if (!currentItem || currentItem.type !== "vocabulary" || !currentItem.word) return null;
    const word = currentItem.word;
    const qt = currentItem.quizType;
    if (qt === "pronunciation" || qt === "grammar") return null;
    const options = getRandomOptions(word, allWords, 4);

    switch (qt) {
      case "char_to_french":
        return {
          question: word.simplified,
          questionLabel: "Quel est le sens de ce caractere ?",
          options: options.map((w) => ({ text: w.french, correct: w.simplified === word.simplified })),
          showChinese: true,
        };
      case "french_to_char":
        return {
          question: word.french,
          questionLabel: "Quel caractere correspond ?",
          options: options.map((w) => ({ text: w.simplified, correct: w.simplified === word.simplified })),
          showChinese: false,
        };
      case "audio_to_char":
        return {
          question: "🔊 Appuyez pour écouter",
          questionLabel: "Écoutez et choisissez le bon caractère",
          options: options.map((w) => ({ text: w.simplified, correct: w.simplified === word.simplified })),
          showChinese: false,
          isAudio: true,
        };
      case "pinyin_tone":
        return {
          question: word.simplified,
          questionLabel: "Quel est le ton correct ?",
          options: [1, 2, 3, 4].map((t) => ({
            text: `Ton ${t}`,
            correct: getToneNumber(word.pinyin) === t,
          })),
          showChinese: true,
        };
      case "char_to_pinyin":
        return {
          question: word.simplified,
          questionLabel: "Quel est le pinyin de ce caractere ?",
          options: options.map((w) => ({ text: w.pinyin, correct: w.simplified === word.simplified })),
          showChinese: true,
        };
      default:
        return null;
    }
  }, [currentItem]);

  // Speak function that works on mobile (must be called from user interaction)
  const speakWord = (text: string) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.7;
    // Try to find a Chinese voice
    const voices = speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith("zh"));
    if (zhVoice) u.voice = zhVoice;
    speechSynthesis.speak(u);
  };

  // Grammar quiz data
  const grammarQuizData = useMemo(() => {
    if (!currentItem || currentItem.type !== "grammar" || !currentItem.grammar) return null;
    const rule = currentItem.grammar;
    // Create a fill-in quiz: show a sentence with blank
    if (rule.examples.length === 0) return null;
    const correctExample = rule.examples[0];
    // Pick 3 wrong grammar rules' examples
    const otherRules = allGrammar.filter((g) => g.id !== rule.id && g.examples.length > 0);
    const shuffledOther = [...otherRules].sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [
      { text: correctExample.chinese, correct: true, french: correctExample.french },
      ...shuffledOther.map((r) => ({
        text: r.examples[0].chinese,
        correct: false,
        french: r.examples[0].french,
      })),
    ].sort(() => Math.random() - 0.5);

    return { rule, options };
  }, [currentItem]);

  // ── Computed stats for results screen ──
  const resultStats = useMemo(() => {
    const promoted = sessionResults.filter((r) => r.newBox > r.oldBox && r.oldBox >= 0);
    const demoted = sessionResults.filter((r) => r.newBox < r.oldBox && r.oldBox >= 0);
    const newLearned = sessionResults.filter((r) => r.isNew && r.correct);
    const accuracy = sessionScore.total > 0 ? Math.round((sessionScore.correct / sessionScore.total) * 100) : 0;
    return { promoted, demoted, newLearned, accuracy };
  }, [sessionResults, sessionScore]);

  // ── Due count for display ──
  const dueCount = useMemo(() => {
    return getDueCount(progress);
  }, [progress]);

  const boxCounts = useMemo(() => {
    return getWordsByBox(progress);
  }, [progress]);

  // ── START SCREEN ──
  if (!started) {
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-4 py-3">
          <div className="max-w-lg mx-auto">
            <h1 className="text-lg font-bold text-[#1A1A1A]">Revision</h1>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="text-5xl mb-2">&#x1F9E0;</div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Session de revision</h2>
            <p className="text-[#6B7280] text-sm">
              Revisez votre vocabulaire avec des quiz intelligents adaptes a votre niveau.
            </p>
            {dueCount > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-[#FFF3E0] text-[#FF9600] text-sm font-semibold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#FF9600] animate-pulse" />
                {dueCount} mot{dueCount > 1 ? "s" : ""} a reviser
              </div>
            )}
          </div>

          {/* Box distribution */}
          {Object.values(progress).length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm">
              <h3 className="text-sm font-semibold text-[#6B7280] mb-3">Progression par boite</h3>
              <div className="flex gap-1 items-end h-16">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((box) => {
                  const count = boxCounts[box] || 0;
                  const maxCount = Math.max(...Object.values(boxCounts), 1);
                  const height = count > 0 ? Math.max(8, (count / maxCount) * 100) : 4;
                  return (
                    <div key={box} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[#6B7280]">{count}</span>
                      <div
                        className="w-full rounded-t-sm transition-all duration-300"
                        style={{
                          height: `${height}%`,
                          backgroundColor: getBoxColor(box),
                          opacity: count > 0 ? 1 : 0.3,
                        }}
                      />
                      <span className="text-[9px] text-[#6B7280] truncate w-full text-center">
                        {getBoxLabel(box).slice(0, 4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HSK Level indicator */}
          <div className="space-y-2">
            <label className="text-sm text-[#6B7280] font-medium">Niveau actuel</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`px-4 py-2 rounded-xl font-bold text-sm ${
                    level === currentHsk
                      ? "bg-[#58CC02] text-white shadow-md"
                      : level < currentHsk
                      ? "bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30"
                      : "bg-[#E5E7EB]/50 text-[#6B7280]/40 border border-[#E5E7EB]"
                  }`}
                >
                  HSK {level}
                  {level < currentHsk && " ✓"}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6B7280] text-center">
              Nouveaux mots : HSK {currentHsk} | Revisions : HSK 1-{currentHsk}
            </p>
          </div>

          {/* Session type selector */}
          <div className="space-y-3">
            <label className="text-sm text-[#6B7280] font-medium">Type de session</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "smart" as SessionType, label: "Session rapide", icon: "\u26A1", desc: "Mix intelligent ~5 min" },
                { key: "srs_only" as SessionType, label: "Revision SRS", icon: "\uD83D\uDD04", desc: "Mots a reviser" },
                { key: "new_words" as SessionType, label: "Nouveaux mots", icon: "\u2728", desc: "Vocabulaire neuf" },
                { key: "tones_pinyin" as SessionType, label: "Tons & Pinyin", icon: "\uD83C\uDFB5", desc: "Prononciation" },
              ].map(({ key, label, icon, desc }) => (
                <button
                  key={key}
                  onClick={() => setSessionType(key)}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    sessionType === key
                      ? "bg-white border-[#58CC02] shadow-md"
                      : "bg-white border-[#E5E7EB] hover:border-[#1CB0F6]"
                  }`}
                >
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">{label}</div>
                  <div className="text-xs text-[#6B7280]">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full bg-[#58CC02] hover:bg-[#46A302] text-white font-bold px-8 py-3.5 rounded-xl text-lg transition-all shadow-md hover:shadow-lg"
          >
            Commencer
          </button>
        </main>
        <Navigation />
      </div>
    );
  }

  // ── RESULTS SCREEN ──
  if (sessionComplete) {
    const { promoted, demoted, newLearned, accuracy } = resultStats;
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
          {/* Score header */}
          <div className="text-center space-y-2">
            <div className="text-5xl mb-2">
              {accuracy >= 80 ? "\uD83C\uDF89" : accuracy >= 50 ? "\uD83D\uDC4D" : "\uD83D\uDCAA"}
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Session terminee !</h2>
          </div>

          {/* Main score card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm text-center">
            <div className="text-5xl font-bold text-[#58CC02] mb-1">{accuracy}%</div>
            <div className="text-[#6B7280] text-sm">
              {sessionScore.correct} / {sessionScore.total} bonnes reponses
            </div>
          </div>

          {/* Detailed stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <div className="text-2xl font-bold text-[#58CC02]">{promoted.length}</div>
              <div className="text-xs text-[#6B7280]">Mots promus</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <div className="text-2xl font-bold text-[#FF4B4B]">{demoted.length}</div>
              <div className="text-xs text-[#6B7280]">Mots retrogrades</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <div className="text-2xl font-bold text-[#1CB0F6]">{newLearned.length}</div>
              <div className="text-xs text-[#6B7280]">Nouveaux mots</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
              <div className="text-2xl font-bold text-[#FFD700]">+{totalXpEarned}</div>
              <div className="text-xs text-[#6B7280]">XP gagnes</div>
            </div>
          </div>

          {/* Time spent */}
          <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
            <div className="text-lg font-bold text-[#1A1A1A]">{formatTime(elapsedSeconds)}</div>
            <div className="text-xs text-[#6B7280]">Temps de session</div>
          </div>

          {/* Word detail list */}
          {sessionResults.filter((r) => r.word).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <h3 className="text-sm font-semibold text-[#6B7280]">Detail des mots</h3>
              </div>
              <div className="divide-y divide-[#E5E7EB] max-h-60 overflow-y-auto">
                {sessionResults
                  .filter((r) => r.word)
                  .map((r, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="font-medium text-[#1A1A1A] text-sm">{r.word}</span>
                      <div className="flex items-center gap-2">
                        {r.correct ? (
                          <span className="text-[#58CC02] text-xs font-semibold">Correct</span>
                        ) : (
                          <span className="text-[#FF4B4B] text-xs font-semibold">Incorrect</span>
                        )}
                        {r.oldBox >= 0 && (
                          <span className="text-xs text-[#6B7280]">
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-0.5"
                              style={{ backgroundColor: getBoxColor(r.oldBox) }}
                            />
                            {r.oldBox}
                            <span className="mx-0.5">{"\u2192"}</span>
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-0.5"
                              style={{ backgroundColor: getBoxColor(r.newBox) }}
                            />
                            {r.newBox}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={startSession}
              className="flex-1 bg-[#58CC02] hover:bg-[#46A302] text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              Nouvelle session
            </button>
            <button
              onClick={() => setStarted(false)}
              className="flex-1 bg-white border border-[#E5E7EB] text-[#1A1A1A] font-bold px-6 py-3 rounded-xl hover:bg-[#F7F7F5] transition-all"
            >
              Retour
            </button>
          </div>
        </main>
        <Navigation />
      </div>
    );
  }

  // ── QUIZ SCREEN ──
  return (
    <div className={`min-h-screen bg-[#F7F7F5] transition-opacity duration-300 ${transitioning ? "opacity-0" : "opacity-100"}`}>
      {/* Top bar: close, progress, timer */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => setStarted(false)} className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1 h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentIndex + 1) / sessionItems.length) * 100}%`,
                  background: "linear-gradient(90deg, #58CC02, #1CB0F6)",
                }}
              />
            </div>
            <span className="text-xs text-[#6B7280] font-medium whitespace-nowrap">
              {currentIndex + 1}/{sessionItems.length}
            </span>
            <span className="text-xs text-[#6B7280] font-mono bg-[#F7F7F5] px-2 py-0.5 rounded-md">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Vocabulary quiz */}
        {currentItem?.type === "vocabulary" && currentItem.quizType !== "pronunciation" && quizData && (
          <>
            {/* Audio quiz: big listen button */}
            {currentItem.quizType === "audio_to_char" && currentItem.word && (
              <div className="flex flex-col items-center gap-3 mb-6">
                <p className="text-sm text-[#6B7280]">Écoutez et choisissez le bon caractère</p>
                <button
                  onClick={() => speakWord(currentItem.word!.simplified)}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1CB0F6] to-[#1899D6] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </button>
                <button
                  onClick={() => speakWord(currentItem.word!.simplified)}
                  className="text-[#1CB0F6] text-sm font-semibold"
                >
                  Appuyez pour écouter
                </button>
              </div>
            )}
            <QuizCard
              key={`quiz-${currentIndex}`}
              question={currentItem.quizType === "audio_to_char" ? "" : quizData.question}
              questionLabel={currentItem.quizType === "audio_to_char" ? "" : quizData.questionLabel}
              options={quizData.options}
              onAnswer={handleVocabAnswer}
              showChinese={quizData.showChinese}
            />
          </>
        )}

        {/* Pronunciation quiz */}
        {currentItem?.type === "pronunciation" && currentItem.word && (
          <div className="text-center space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
              <p className="text-sm text-[#6B7280] mb-2">Prononcez ce mot</p>
              <h2 className="chinese-char text-4xl font-bold text-[#1A1A1A] mb-2">{currentItem.word.simplified}</h2>
              <p className="text-lg text-[#6B7280]">{currentItem.word.pinyin}</p>
              <p className="text-sm text-[#6B7280] mt-1">{currentItem.word.french}</p>
            </div>

            {/* Step 1: Listen button */}
            <button
              onClick={() => speakWord(currentItem.word!.simplified)}
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#1CB0F6] to-[#1899D6] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <p className="text-xs text-[#6B7280]">Appuyez pour écouter</p>

            {/* Step 2: Record */}
            {pronResult === "idle" && (
              <button
                onClick={handlePronunciation}
                className="block mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#FF4B4B] to-[#E03E3E] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}

            {pronResult === "listening" && (
              <div className="space-y-3">
                <button
                  onClick={stopPronRecording}
                  className="block mx-auto w-16 h-16 rounded-full bg-[#FF4B4B] flex items-center justify-center shadow-lg animate-pulse active:scale-95 transition-transform"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
                <p className="text-[#FF4B4B] text-sm font-semibold">Parlez maintenant... (5s max)</p>
              </div>
            )}

            {(pronResult === "correct" || pronResult === "incorrect") && (
              <div className={`p-4 rounded-2xl border ${
                pronResult === "correct"
                  ? "bg-[#58CC02]/10 border-[#58CC02]/30"
                  : "bg-[#FF4B4B]/10 border-[#FF4B4B]/30"
              }`}>
                <div className={`text-lg font-bold ${pronResult === "correct" ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                  {pronResult === "correct" ? "✓ Correct !" : "✗ Pas tout à fait"}
                </div>
                {pronTranscript && (
                  <p className="text-sm text-[#6B7280] mt-1">
                    Reconnu : <span className="text-[#1A1A1A] font-semibold">{pronTranscript}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Grammar quiz */}
        {currentItem?.type === "grammar" && grammarQuizData && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm text-center">
              <p className="text-sm text-[#6B7280] mb-2">Grammaire</p>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">{grammarQuizData.rule.title}</h2>
              <p className="text-sm text-[#6B7280] mb-1">{grammarQuizData.rule.pattern}</p>
              <p className="text-sm text-[#6B7280]">{grammarQuizData.rule.explanation_fr}</p>
            </div>

            <p className="text-sm text-[#6B7280] text-center font-medium">
              Quel exemple illustre cette regle ?
            </p>

            <div className="flex flex-col gap-3">
              {grammarQuizData.options.map((opt, idx) => {
                let btnClass =
                  "w-full p-4 rounded-2xl text-left font-semibold text-sm transition-all border cursor-pointer";

                if (!grammarAnswered) {
                  btnClass += " bg-white border-[#E5E7EB] text-[#1A1A1A] hover:border-[#1CB0F6]";
                } else if (opt.correct) {
                  btnClass += " border-[#58CC02] text-[#58CC02] bg-[rgba(88,204,2,0.08)]";
                } else if (idx === grammarAnswer && !opt.correct) {
                  btnClass += " border-[#FF4B4B] text-[#FF4B4B] bg-[rgba(255,75,75,0.08)]";
                } else {
                  btnClass += " bg-white border-[#E5E7EB] text-[#6B7280] opacity-40";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleGrammarAnswer(idx, opt.correct)}
                    disabled={grammarAnswered}
                    className={btnClass}
                  >
                    <div>{opt.text}</div>
                    <div className="text-xs text-[#6B7280] mt-1 font-normal">{opt.french}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {showXp && <XpAnimation amount={xpGained} />}
      <Navigation />
    </div>
  );
}
