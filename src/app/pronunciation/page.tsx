"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";
import { useUser } from "@/lib/UserContext";

import initialsData from "@/data/initials.json";
import finalsData from "@/data/finals.json";
import hsk1Data from "@/data/hsk1.json";
import hsk2Data from "@/data/hsk2.json";
import hsk3Data from "@/data/hsk3.json";
import hsk4Data from "@/data/hsk4.json";
import { useChineseAudio } from "@/lib/useAudio";
import { getSyllablesForInitial, addTone, getToneColor } from "@/lib/pinyin";

interface VocabWord {
  simplified: string;
  pinyin: string;
  french: string;
  hsk_level: number;
}

interface PhoneticsItem {
  initial?: string;
  final?: string;
  ipa: string;
  description_fr: string;
  examples: string[];
}

type PracticeState = "idle" | "listening" | "result";

type TabType = "initials" | "finals" | "drill" | "words";

const INITIALS_LIST = ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s"];

export default function PronunciationPage() {
  const { getUserKey } = useUser();
  const [tab, setTab] = useState<TabType>("initials");
  const [practiceItem, setPracticeItem] = useState<PhoneticsItem | null>(null);
  const [practiceExample, setPracticeExample] = useState<string>("");
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [recognizedText, setRecognizedText] = useState("");
  const [isMatch, setIsMatch] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [expandedItem, setExpandedItem] = useState<PhoneticsItem | null>(null);

  // Word practice state
  const [wordPractice, setWordPractice] = useState<VocabWord | null>(null);
  const [wordPracticeState, setWordPracticeState] = useState<PracticeState>("idle");
  const [wordRecognized, setWordRecognized] = useState("");
  const [wordIsMatch, setWordIsMatch] = useState(false);
  const [wordAttempts, setWordAttempts] = useState(0);
  const [wordSuccesses, setWordSuccesses] = useState(0);

  // Drill state
  const [drillInitial, setDrillInitial] = useState<string | null>(null);
  const [drillProgress, setDrillProgress] = useState<Record<string, Record<string, boolean>>>({});
  const [drillRecording, setDrillRecording] = useState<string | null>(null);
  const [drillResult, setDrillResult] = useState<Record<string, { matched: boolean; transcript: string }>>({});
  const [drillCelebration, setDrillCelebration] = useState(false);

  // Shared speech recognition ref
  const recognitionRef = useRef<any>(null);

  const allVocab: VocabWord[] = useMemo(() => [
    ...(hsk1Data as VocabWord[]),
    ...(hsk2Data as VocabWord[]),
    ...(hsk3Data as VocabWord[]),
    ...(hsk4Data as VocabWord[]),
  ], []);

  const [learnedWords, setLearnedWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(getUserKey("srs_progress"));
    if (saved) {
      const progress = JSON.parse(saved);
      const knownKeys = Object.keys(progress);
      const known = allVocab.filter((w) => knownKeys.includes(w.simplified));
      setLearnedWords(known.length > 0 ? known : allVocab.filter((w) => w.hsk_level === 1).slice(0, 20));
    } else {
      setLearnedWords(allVocab.filter((w) => w.hsk_level === 1).slice(0, 20));
    }
  }, [allVocab]);

  // Load drill progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(getUserKey("drill_progress"));
    if (saved) {
      try { setDrillProgress(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopRecording(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = initialsData as PhoneticsItem[];
  const finals = finalsData as PhoneticsItem[];
  const items = tab === "initials" ? initials : finals;

  const speak = useChineseAudio();

  // ─── Shared recording functions ───────────────────────────────────────

  const startRecording = useCallback((targetText: string, onResult: (matched: boolean, transcript: string) => void) => {
    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const win = window as any;
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) {
      onResult(true, "(reconnaissance non disponible)");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    let hasResult = false;

    recognition.onresult = (event: any) => {
      hasResult = true;
      let matched = false;
      let bestTranscript = "";
      for (let i = 0; i < (event.results[0]?.length || 1); i++) {
        const t = (event.results[0]?.[i]?.transcript || "").trim();
        if (!bestTranscript) bestTranscript = t;
        if (t.includes(targetText) || targetText.includes(t)) {
          matched = true;
          bestTranscript = t;
          break;
        }
      }
      onResult(matched, bestTranscript);
    };

    recognition.onerror = () => {
      if (!hasResult) onResult(false, "Erreur micro");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!hasResult) onResult(false, "Rien detecte - reessayez");
    };

    try {
      recognition.start();
      setTimeout(() => {
        if (recognitionRef.current === recognition) {
          try { recognition.stop(); } catch {}
        }
      }, 4000);
    } catch {
      onResult(false, "Erreur : permissions micro");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────

  const getChineseFromExample = (example: string): string => {
    const parts = example.split(" ");
    for (const part of parts) {
      if (/[\u4e00-\u9fff]/.test(part)) return part;
    }
    return parts[0];
  };

  const getPinyinFromExample = (example: string): string => {
    return example.split(" ")[0] || "";
  };

  // ─── Initials/Finals practice ─────────────────────────────────────────

  const startPractice = (item: PhoneticsItem) => {
    const example = item.examples[Math.floor(Math.random() * item.examples.length)];
    setPracticeItem(item);
    setPracticeExample(example);
    setPracticeState("idle");
    setRecognizedText("");
    setIsMatch(false);
  };

  const nextExample = () => {
    if (!practiceItem) return;
    const otherExamples = practiceItem.examples.filter((e) => e !== practiceExample);
    const next = otherExamples.length > 0
      ? otherExamples[Math.floor(Math.random() * otherExamples.length)]
      : practiceItem.examples[0];
    setPracticeExample(next);
    setPracticeState("idle");
    setRecognizedText("");
    setIsMatch(false);
  };

  const startListening = useCallback(() => {
    const expectedChinese = getChineseFromExample(practiceExample);
    setPracticeState("listening");
    setRecognizedText("");

    startRecording(expectedChinese, (matched, transcript) => {
      setRecognizedText(transcript);
      setIsMatch(matched);
      setPracticeState("result");
      setAttempts((a) => a + 1);
      if (matched) setSuccesses((s) => s + 1);
    });
  }, [practiceExample, startRecording]);

  // ─── Word practice ────────────────────────────────────────────────────

  const startWordPractice = (word?: VocabWord) => {
    const w = word || learnedWords[Math.floor(Math.random() * learnedWords.length)];
    setWordPractice(w);
    setWordPracticeState("idle");
    setWordRecognized("");
    setWordIsMatch(false);
  };

  const nextWordPractice = () => {
    const others = learnedWords.filter((w) => w.simplified !== wordPractice?.simplified);
    const next = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : learnedWords[0];
    startWordPractice(next);
  };

  const startWordListening = useCallback(() => {
    if (!wordPractice) return;
    setWordPracticeState("listening");
    setWordRecognized("");

    startRecording(wordPractice.simplified, (matched, transcript) => {
      setWordRecognized(transcript);
      setWordIsMatch(matched);
      setWordPracticeState("result");
      setWordAttempts((a) => a + 1);
      if (matched) setWordSuccesses((s) => s + 1);
    });
  }, [wordPractice, startRecording]);

  // ─── Drill logic ──────────────────────────────────────────────────────

  const saveDrillProgress = (newProgress: Record<string, Record<string, boolean>>) => {
    setDrillProgress(newProgress);
    localStorage.setItem(getUserKey("drill_progress"), JSON.stringify(newProgress));
  };

  const isInitialComplete = (initial: string): boolean => {
    const syllables = getSyllablesForInitial(initial);
    const progress = drillProgress[initial];
    if (!progress || syllables.length === 0) return false;
    return syllables.every((s) => progress[s] === true);
  };

  const getDrillSyllables = (initial: string): string[] => {
    return getSyllablesForInitial(initial);
  };

  const getValidatedCount = (initial: string): number => {
    const progress = drillProgress[initial];
    if (!progress) return 0;
    return Object.values(progress).filter(Boolean).length;
  };

  const startDrillRecording = useCallback((syllable: string, initial: string) => {
    setDrillRecording(syllable);
    // Clear previous result for this syllable
    setDrillResult((prev) => {
      const next = { ...prev };
      delete next[syllable];
      return next;
    });

    startRecording(syllable, (matched, transcript) => {
      setDrillRecording(null);
      setDrillResult((prev) => ({ ...prev, [syllable]: { matched, transcript } }));

      if (matched) {
        // Update drill progress
        setDrillProgress((prev) => {
          const next = { ...prev, [initial]: { ...(prev[initial] || {}), [syllable]: true } };
          localStorage.setItem(getUserKey("drill_progress"), JSON.stringify(next));

          // Check if all syllables are now validated
          const syllables = getSyllablesForInitial(initial);
          const allDone = syllables.every((s) => next[initial]?.[s] === true);
          if (allDone) {
            setDrillCelebration(true);
            // Award 20 XP
            try {
              const statsRaw = localStorage.getItem(getUserKey("learning_stats"));
              const stats = statsRaw ? JSON.parse(statsRaw) : {};
              stats.xp_total = (stats.xp_total || 0) + 20;
              localStorage.setItem(getUserKey("learning_stats"), JSON.stringify(stats));
            } catch {}
            setTimeout(() => setDrillCelebration(false), 3000);
          }

          return next;
        });
      } else {
        // Mark as failed (false)
        setDrillProgress((prev) => {
          const next = { ...prev, [initial]: { ...(prev[initial] || {}), [syllable]: false } };
          localStorage.setItem(getUserKey("drill_progress"), JSON.stringify(next));
          return next;
        });
      }
    });
  }, [startRecording]);

  // ─── MIC ICON SVG ─────────────────────────────────────────────────────

  const MicIcon = ({ color = "#6B7280", size = 36 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );

  const StopIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // WORD PRACTICE VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (wordPractice) {
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <header className="sticky top-0 z-50 glass border-b border-[#E5E7EB] px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button onClick={() => { stopRecording(); setWordPractice(null); }} className="text-[#6B7280] hover:text-[#1A1A1A]">
              ← Retour
            </button>
            <h1 className="text-lg font-bold text-[#1A1A1A]">Prononciation</h1>
            <div className="text-sm text-[#6B7280]">{wordSuccesses}/{wordAttempts}</div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-card w-full text-center">
            <p className="text-sm text-[#6B7280] mb-2">Prononcez ce mot :</p>
            <p className="chinese-char text-5xl font-bold text-[#1A1A1A] mb-3">{wordPractice.simplified}</p>
            <ToneDisplay pinyin={wordPractice.pinyin} size="lg" />
            <p className="text-[#6B7280] mt-2">{wordPractice.french}</p>
            <p className="text-xs text-[#6B7280] mt-1">HSK {wordPractice.hsk_level}</p>
            <button
              onClick={() => speak(wordPractice.simplified)}
              className="mt-4 btn-3d bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-bold px-6 py-2 rounded-xl"
            >
              Ecouter le modele
            </button>
          </div>

          {/* Mic / Stop button */}
          {wordPracticeState === "listening" ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => { stopRecording(); }}
                className="w-24 h-24 rounded-full flex items-center justify-center bg-[#FF4B4B] hover:bg-[#E63E3E] transition-all"
              >
                <StopIcon />
              </button>
              <p className="text-sm text-[#FF4B4B] font-medium">Parlez maintenant... (4s max)</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={startWordListening}
                className="w-24 h-24 rounded-full flex items-center justify-center bg-white border-2 border-[#E5E7EB] hover:border-[#CE82FF] cursor-pointer transition-all"
              >
                <MicIcon />
              </button>
              <p className="text-xs text-[#6B7280]">
                {wordPracticeState === "idle" ? "Appuyez et prononcez" : ""}
              </p>
            </div>
          )}

          {wordPracticeState === "result" && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className={`p-4 rounded-2xl text-center border ${
                wordIsMatch ? "bg-[#58CC02]/15 border-[#58CC02]/30" : "bg-[#FF4B4B]/15 border-[#FF4B4B]/30"
              }`}>
                <div className={`text-3xl mb-2 ${wordIsMatch ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                  {wordIsMatch ? "\u2713" : "\u2717"}
                </div>
                <div className={`text-lg font-bold ${wordIsMatch ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                  {wordIsMatch ? "Parfait !" : "Pas tout a fait..."}
                </div>
                {wordRecognized && (
                  <p className="text-sm text-[#6B7280] mt-2">
                    Reconnu : <span className="chinese-char text-[#1A1A1A]">{wordRecognized}</span>
                  </p>
                )}
                {!wordIsMatch && (
                  <div className="mt-3 text-sm text-[#6B7280]">
                    <p>Attendu : <span className="chinese-char text-[#1A1A1A] font-bold">{wordPractice.simplified}</span> ({wordPractice.pinyin})</p>
                    <p className="mt-2 text-[#FF9600]">Ecoutez le modele et concentrez-vous sur les tons</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!wordIsMatch && (
                  <button
                    onClick={() => { speak(wordPractice.simplified); setTimeout(() => startWordListening(), 1500); }}
                    className="flex-1 btn-3d bg-[#FF9600] text-white font-bold py-3 rounded-xl"
                  >
                    Ecouter + Reessayer
                  </button>
                )}
                <button
                  onClick={wordIsMatch ? nextWordPractice : startWordListening}
                  className={`flex-1 btn-3d ${wordIsMatch ? "bg-[#58CC02]" : "bg-[#1CB0F6]"} text-white font-bold py-3 rounded-xl`}
                >
                  {wordIsMatch ? "Mot suivant \u2192" : "Reessayer"}
                </button>
              </div>
            </div>
          )}
        </main>
        <Navigation />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALS / FINALS PRACTICE VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (practiceItem) {
    const key = practiceItem.initial || practiceItem.final || "";
    const expectedChinese = getChineseFromExample(practiceExample);
    const expectedPinyin = getPinyinFromExample(practiceExample);

    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <header className="sticky top-0 z-50 glass border-b border-[#E5E7EB] px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button onClick={() => { stopRecording(); setPracticeItem(null); }} className="text-[#6B7280] hover:text-[#1A1A1A]">
              ← Retour
            </button>
            <h1 className="text-lg font-bold text-[#1A1A1A]">Pratique : {key}</h1>
            <div className="text-sm text-[#6B7280]">{successes}/{attempts}</div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-card w-full text-center">
            <div className="text-3xl font-bold text-[#CE82FF] mb-1">{key}</div>
            <div className="text-sm text-[#6B7280]">IPA: {practiceItem.ipa}</div>
            <div className="text-sm text-[#6B7280] mt-1">{practiceItem.description_fr}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-card w-full text-center">
            <p className="text-sm text-[#6B7280] mb-2">Prononcez ce mot :</p>
            <p className="chinese-char text-5xl font-bold text-[#1A1A1A] mb-3">{expectedChinese}</p>
            <p className="text-xl text-[#CE82FF] font-bold mb-4">{expectedPinyin}</p>
            <button
              onClick={() => speak(expectedChinese)}
              className="btn-3d bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-bold px-6 py-2 rounded-xl"
            >
              Ecouter le modele
            </button>
          </div>

          {/* Mic / Stop */}
          {practiceState === "listening" ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => { stopRecording(); }}
                className="w-24 h-24 rounded-full flex items-center justify-center bg-[#FF4B4B] hover:bg-[#E63E3E] transition-all"
              >
                <StopIcon />
              </button>
              <p className="text-sm text-[#FF4B4B] font-medium">Parlez maintenant... (4s max)</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={startListening}
                className="w-24 h-24 rounded-full flex items-center justify-center bg-white border-2 border-[#E5E7EB] hover:border-[#CE82FF] cursor-pointer transition-all"
              >
                <MicIcon />
              </button>
              <p className="text-xs text-[#6B7280]">
                {practiceState === "idle" ? "Appuyez sur le micro et prononcez" : ""}
              </p>
            </div>
          )}

          {practiceState === "result" && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className={`p-4 rounded-2xl text-center border ${
                isMatch ? "bg-[#58CC02]/15 border-[#58CC02]/30" : "bg-[#FF4B4B]/15 border-[#FF4B4B]/30"
              }`}>
                <div className={`text-3xl mb-2 ${isMatch ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                  {isMatch ? "\u2713" : "\u2717"}
                </div>
                <div className={`text-lg font-bold ${isMatch ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                  {isMatch ? "Excellent !" : "Pas tout a fait..."}
                </div>
                {recognizedText && (
                  <p className="text-sm text-[#6B7280] mt-2">
                    Reconnu : <span className="chinese-char text-[#1A1A1A]">{recognizedText}</span>
                  </p>
                )}
                {!isMatch && (
                  <div className="mt-3 text-sm text-[#6B7280]">
                    <p>Attendu : <span className="chinese-char text-[#1A1A1A] font-bold">{expectedChinese}</span> ({expectedPinyin})</p>
                    <p className="mt-2 text-[#FF9600]">
                      Conseil : Ecoutez le modele, puis reessayez en articulant bien le son &quot;{key}&quot;
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!isMatch && (
                  <button
                    onClick={() => { speak(expectedChinese); setTimeout(() => startListening(), 1500); }}
                    className="flex-1 btn-3d bg-[#FF9600] text-white font-bold py-3 rounded-xl"
                  >
                    Ecouter + Reessayer
                  </button>
                )}
                <button
                  onClick={isMatch ? nextExample : startListening}
                  className={`flex-1 btn-3d ${isMatch ? "bg-[#58CC02]" : "bg-[#1CB0F6]"} text-white font-bold py-3 rounded-xl`}
                >
                  {isMatch ? "Mot suivant \u2192" : "Reessayer"}
                </button>
              </div>
            </div>
          )}
        </main>
        <Navigation />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DRILL PRACTICE VIEW (initial selected)
  // ═══════════════════════════════════════════════════════════════════════

  if (drillInitial) {
    const syllables = getDrillSyllables(drillInitial);
    const validatedCount = getValidatedCount(drillInitial);
    const allComplete = isInitialComplete(drillInitial);

    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <header className="sticky top-0 z-50 glass border-b border-[#E5E7EB] px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button onClick={() => { stopRecording(); setDrillInitial(null); setDrillResult({}); }} className="text-[#6B7280] hover:text-[#1A1A1A]">
              ← Retour
            </button>
            <h1 className="text-lg font-bold text-[#1A1A1A]">Drill : {drillInitial}</h1>
            <div className="text-sm text-[#6B7280]">{validatedCount}/{syllables.length} validees</div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6 space-y-3 animate-fade-in">
          {/* Celebration */}
          {drillCelebration && (
            <div className="bg-[#58CC02]/15 border border-[#58CC02]/30 rounded-2xl p-6 text-center animate-fade-in">
              <div className="text-5xl mb-3">&#127881;</div>
              <div className="text-xl font-bold text-[#58CC02]">Bravo ! Toutes les syllabes validees !</div>
              <div className="text-sm text-[#6B7280] mt-2">+20 XP gagnes</div>
            </div>
          )}

          {allComplete && !drillCelebration && (
            <div className="bg-[#58CC02]/15 border border-[#58CC02]/30 rounded-2xl p-4 text-center">
              <span className="text-[#58CC02] font-bold">Initiale &quot;{drillInitial}&quot; completee !</span>
            </div>
          )}

          {/* Syllable cards */}
          <div className="space-y-2">
            {syllables.map((syllable) => {
              const progress = drillProgress[drillInitial]?.[syllable];
              const isValidated = progress === true;
              const isFailed = progress === false;
              const isCurrentlyRecording = drillRecording === syllable;
              const result = drillResult[syllable];

              return (
                <div
                  key={syllable}
                  className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${
                    isValidated ? "border-[#58CC02]/40" : isFailed ? "border-[#FF4B4B]/40" : "border-[#E5E7EB]"
                  }`}
                >
                  {/* Status indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isValidated
                      ? "bg-[#58CC02]/15 text-[#58CC02]"
                      : isFailed
                      ? "bg-[#FF4B4B]/15 text-[#FF4B4B]"
                      : "bg-[#F7F7F5] text-[#6B7280]"
                  }`}>
                    {isValidated ? "\u2713" : isFailed ? "\u2717" : "\u25CB"}
                  </div>

                  {/* Syllable with all 4 tones */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {[1, 2, 3, 4].map((tone) => (
                        <span
                          key={tone}
                          className="text-base font-bold cursor-pointer hover:scale-110 transition-transform"
                          style={{ color: getToneColor(tone) }}
                          onClick={() => speak(addTone(syllable, tone))}
                          title={`Ton ${tone}`}
                        >
                          {addTone(syllable, tone)}
                        </span>
                      ))}
                    </div>
                    {result && !isCurrentlyRecording && (
                      <span className={`text-xs ${result.matched ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                        {result.transcript}
                      </span>
                    )}
                    {isCurrentlyRecording && (
                      <span className="text-xs text-[#FF4B4B] font-medium">Parlez... (4s max)</span>
                    )}
                  </div>

                  {/* Listen button — plays 1st tone as default */}
                  <button
                    onClick={() => speak(addTone(syllable, 1))}
                    className="w-10 h-10 rounded-full bg-[#1CB0F6]/10 flex items-center justify-center hover:bg-[#1CB0F6]/20 transition-all flex-shrink-0"
                    title="Écouter"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1CB0F6">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                  </button>

                  {/* Record button / Stop button */}
                  {isCurrentlyRecording ? (
                    <button
                      onClick={stopRecording}
                      className="w-10 h-10 rounded-full bg-[#FF4B4B] flex items-center justify-center hover:bg-[#E63E3E] transition-all flex-shrink-0"
                      title="Arreter"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => startDrillRecording(syllable, drillInitial)}
                      disabled={drillRecording !== null}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                        drillRecording !== null
                          ? "bg-[#F7F7F5] opacity-40 cursor-not-allowed"
                          : "bg-[#CE82FF]/10 hover:bg-[#CE82FF]/20"
                      }`}
                      title="Enregistrer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="#CE82FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </main>
        <Navigation />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LIST VIEW (tabs: Initiales, Finales, Drill, Mots)
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <header className="sticky top-0 z-50 glass border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-[#1A1A1A] mb-3">Prononciation</h1>
          <div className="flex gap-2">
            {(["initials", "finals", "drill", "words"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  tab === t
                    ? "bg-[#CE82FF] text-white"
                    : "bg-white text-[#6B7280] border border-[#E5E7EB]"
                }`}
              >
                {t === "initials" ? "Initiales" : t === "finals" ? "Finales" : t === "drill" ? "Drill" : "Mots"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3 animate-fade-in">
        {/* ─── WORDS TAB ─────────────────────────────────────────── */}
        {tab === "words" && (
          <div className="space-y-4">
            <button
              onClick={() => startWordPractice()}
              className="w-full btn-3d bg-[#CE82FF] hover:bg-[#B86EE6] text-white font-bold py-3 rounded-xl text-lg"
            >
              Session de prononciation
            </button>
            <p className="text-sm text-[#6B7280] text-center">
              {learnedWords.length} mots disponibles (base sur votre progression)
            </p>

            <div className="space-y-2">
              {learnedWords.map((word, i) => (
                <button
                  key={`${word.simplified}-${i}`}
                  onClick={() => startWordPractice(word)}
                  className="w-full flex items-center gap-4 bg-white rounded-xl p-3 border border-[#E5E7EB] hover:border-[#CE82FF] transition-all text-left shadow-card"
                >
                  <div className="w-12 h-12 bg-[#F7F7F5] rounded-xl flex items-center justify-center chinese-char text-xl font-bold text-[#1A1A1A]">
                    {word.simplified}
                  </div>
                  <div className="flex-1 min-w-0">
                    <ToneDisplay pinyin={word.pinyin} size="sm" />
                    <div className="text-sm text-[#6B7280] truncate">{word.french}</div>
                  </div>
                  <div className="text-[#CE82FF]">
                    <MicIcon color="#CE82FF" size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── DRILL TAB (no initial selected) ───────────────────── */}
        {tab === "drill" && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-[#1A1A1A]">Drill : Initiale x Finales</h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Choisissez une initiale et prononcez-la avec toutes les finales valides, comme a l&apos;ecole chinoise.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {INITIALS_LIST.map((initial) => {
                const complete = isInitialComplete(initial);
                const started = drillProgress[initial] && Object.keys(drillProgress[initial]).length > 0;
                return (
                  <button
                    key={initial}
                    onClick={() => { setDrillInitial(initial); setDrillResult({}); }}
                    className={`relative bg-white rounded-xl border p-4 flex flex-col items-center justify-center hover:border-[#CE82FF] transition-all shadow-card ${
                      complete ? "border-[#58CC02]" : started ? "border-[#CE82FF]/50" : "border-[#E5E7EB]"
                    }`}
                  >
                    <span className="text-2xl font-bold text-[#1A1A1A]">{initial}</span>
                    {complete && (
                      <span className="absolute top-1 right-1 text-[#58CC02] text-sm">{"\u2713"}</span>
                    )}
                    {started && !complete && (
                      <span className="text-xs text-[#6B7280] mt-1">
                        {getValidatedCount(initial)}/{getSyllablesForInitial(initial).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── INITIALS / FINALS TAB ─────────────────────────────── */}
        {(tab === "initials" || tab === "finals") && items.map((item, i) => {
          const key = item.initial || item.final || "";
          const isExpanded = expandedItem === item;
          return (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#E5E7EB] shadow-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedItem(isExpanded ? null : item)}
                className="w-full flex items-center gap-4 p-4 hover:bg-[#F7F7F5] transition-all"
              >
                <div className="w-12 h-12 bg-[#CE82FF]/20 rounded-xl flex items-center justify-center text-xl font-bold text-[#CE82FF]">
                  {key}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-[#1A1A1A]">{key}</div>
                  <div className="text-sm text-[#6B7280] line-clamp-1">{item.description_fr}</div>
                </div>
                <div className="text-xs text-[#6B7280] bg-[#F7F7F5] px-2 py-1 rounded-full">
                  {item.ipa}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#E5E7EB] p-4 bg-[#F7F7F5] space-y-3">
                  <p className="text-sm text-[#6B7280]">{item.description_fr}</p>

                  <div className="flex flex-wrap gap-2">
                    {item.examples.map((ex, j) => (
                      <button
                        key={j}
                        onClick={() => speak(getChineseFromExample(ex))}
                        className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm hover:border-[#CE82FF] transition-all"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => startPractice(item)}
                    className="w-full btn-3d bg-[#CE82FF] hover:bg-[#B86EE6] text-white font-bold py-2.5 rounded-xl mt-2"
                  >
                    S&apos;entrainer sur &quot;{key}&quot;
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </main>

      <Navigation />
    </div>
  );
}
