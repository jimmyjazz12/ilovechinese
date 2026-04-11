"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";

import initialsData from "@/data/initials.json";
import finalsData from "@/data/finals.json";
import hsk1Data from "@/data/hsk1.json";
import hsk2Data from "@/data/hsk2.json";
import hsk3Data from "@/data/hsk3.json";
import hsk4Data from "@/data/hsk4.json";

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

export default function PronunciationPage() {
  const [tab, setTab] = useState<"initials" | "finals" | "words">("initials");
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

  const allVocab: VocabWord[] = useMemo(() => [
    ...(hsk1Data as VocabWord[]),
    ...(hsk2Data as VocabWord[]),
    ...(hsk3Data as VocabWord[]),
    ...(hsk4Data as VocabWord[]),
  ], []);

  // Get words the user has started learning (from SRS progress)
  const [learnedWords, setLearnedWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("srs_progress");
    if (saved) {
      const progress = JSON.parse(saved);
      const knownKeys = Object.keys(progress);
      const known = allVocab.filter((w) => knownKeys.includes(w.simplified));
      // If user hasn't started learning yet, give them HSK1 basics
      setLearnedWords(known.length > 0 ? known : allVocab.filter((w) => w.hsk_level === 1).slice(0, 20));
    } else {
      setLearnedWords(allVocab.filter((w) => w.hsk_level === 1).slice(0, 20));
    }
  }, [allVocab]);

  const initials = initialsData as PhoneticsItem[];
  const finals = finalsData as PhoneticsItem[];
  const items = tab === "initials" ? initials : finals;

  const speak = (text: string, rate = 0.6) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = rate;
    speechSynthesis.speak(u);
  };

  // Extract the Chinese character(s) from example string like "bā 八 (huit)"
  const getChineseFromExample = (example: string): string => {
    const parts = example.split(" ");
    // The Chinese character is usually the second part
    for (const part of parts) {
      if (/[\u4e00-\u9fff]/.test(part)) return part;
    }
    return parts[0];
  };

  const getPinyinFromExample = (example: string): string => {
    return example.split(" ")[0] || "";
  };

  // Start practicing a specific phonetic item
  const startPractice = (item: PhoneticsItem) => {
    const example = item.examples[Math.floor(Math.random() * item.examples.length)];
    setPracticeItem(item);
    setPracticeExample(example);
    setPracticeState("idle");
    setRecognizedText("");
    setIsMatch(false);
  };

  // Pick next example from same item
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

  // Listen via Web Speech API
  const startListening = useCallback(async () => {
    setPracticeState("listening");
    setRecognizedText("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setRecognizedText("Reconnaissance vocale non supportée par ce navigateur");
      setPracticeState("result");
      setIsMatch(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      const expectedChinese = getChineseFromExample(practiceExample);

      // Check if any alternative matches
      let matched = false;
      for (let i = 0; i < (event.results[0]?.length || 1); i++) {
        const alt = event.results[0]?.[i]?.transcript ?? "";
        if (alt.includes(expectedChinese) || expectedChinese.includes(alt)) {
          matched = true;
          break;
        }
      }

      setRecognizedText(transcript);
      setIsMatch(matched);
      setPracticeState("result");
      setAttempts((a) => a + 1);
      if (matched) setSuccesses((s) => s + 1);
    };

    recognition.onerror = () => {
      setRecognizedText("Erreur - réessayez");
      setIsMatch(false);
      setPracticeState("result");
    };

    recognition.onend = () => {
      if (practiceState === "listening") {
        setPracticeState("result");
      }
    };

    try {
      recognition.start();
      // Auto-stop after 5 seconds
      setTimeout(() => {
        try { recognition.stop(); } catch {}
      }, 5000);
    } catch {
      setPracticeState("result");
      setRecognizedText("Erreur micro - vérifiez les permissions");
    }
  }, [practiceExample, practiceState]);

  // Start word practice
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

  // Listen for word practice
  const startWordListening = useCallback(async () => {
    if (!wordPractice) return;
    setWordPracticeState("listening");
    setWordRecognized("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setWordRecognized("Reconnaissance vocale non supportée");
      setWordPracticeState("result");
      setWordIsMatch(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      let matched = false;
      for (let i = 0; i < (event.results[0]?.length || 1); i++) {
        const alt = event.results[0]?.[i]?.transcript ?? "";
        if (alt.includes(wordPractice.simplified) || wordPractice.simplified.includes(alt)) {
          matched = true;
          break;
        }
      }
      setWordRecognized(transcript);
      setWordIsMatch(matched);
      setWordPracticeState("result");
      setWordAttempts((a) => a + 1);
      if (matched) setWordSuccesses((s) => s + 1);
    };

    recognition.onerror = () => {
      setWordRecognized("Erreur - réessayez");
      setWordIsMatch(false);
      setWordPracticeState("result");
    };

    try {
      recognition.start();
      setTimeout(() => { try { recognition.stop(); } catch {} }, 5000);
    } catch {
      setWordPracticeState("result");
      setWordRecognized("Erreur micro");
    }
  }, [wordPractice]);

  // Word practice view
  if (wordPractice) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button onClick={() => setWordPractice(null)} className="text-[#9EAAB4] hover:text-white">
              ← Retour
            </button>
            <h1 className="text-lg font-bold">Prononciation</h1>
            <div className="text-sm text-[#9EAAB4]">{wordSuccesses}/{wordAttempts}</div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
          <div className="bg-gradient-card rounded-2xl p-6 border border-white/5 shadow-card w-full text-center">
            <p className="text-sm text-[#9EAAB4] mb-2">Prononcez ce mot :</p>
            <p className="chinese-char text-5xl font-bold mb-3">{wordPractice.simplified}</p>
            <ToneDisplay pinyin={wordPractice.pinyin} size="lg" />
            <p className="text-[#9EAAB4] mt-2">{wordPractice.french}</p>
            <p className="text-xs text-[#9EAAB4] mt-1">HSK {wordPractice.hsk_level}</p>
            <button
              onClick={() => speak(wordPractice.simplified, 0.7)}
              className="mt-4 btn-3d bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-bold px-6 py-2 rounded-xl"
            >
              🔊 Écouter le modèle
            </button>
          </div>

          {/* Mic */}
          <button
            onClick={wordPracticeState === "listening" ? undefined : startWordListening}
            disabled={wordPracticeState === "listening"}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              wordPracticeState === "listening"
                ? "bg-[#FF4B4B] animate-pulse-ring"
                : "bg-[#1A2C34] border-2 border-[#2A4050] hover:border-[#CE82FF] cursor-pointer"
            }`}
          >
            {wordPracticeState === "listening" && (
              <span className="absolute inset-0 rounded-full border-4 border-[#FF4B4B] opacity-30 animate-pulse-ring" />
            )}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke={wordPracticeState === "listening" ? "white" : "#9EAAB4"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <p className="text-xs text-[#9EAAB4]">
            {wordPracticeState === "listening" ? "Parlez maintenant..." : wordPracticeState === "idle" ? "Appuyez et prononcez" : ""}
          </p>

          {wordPracticeState === "listening" && (
            <div className="flex items-end gap-1 h-8">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className="w-1.5 bg-[#FF4B4B] rounded-full"
                  style={{ height: `${20 + Math.random() * 80}%`, animation: `pulse-ring ${0.4 + Math.random() * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.04}s` }} />
              ))}
            </div>
          )}

          {wordPracticeState === "result" && (
            <div className="w-full space-y-4">
              <div className={`p-4 rounded-2xl text-center border ${
                wordIsMatch ? "bg-[#58CC02]/15 border-[#58CC02]/30" : "bg-[#FF4B4B]/15 border-[#FF4B4B]/30"
              }`}>
                <div className="text-3xl mb-2">{wordIsMatch ? "✓" : "✗"}</div>
                <div className={`text-lg font-bold ${wordIsMatch ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                  {wordIsMatch ? "Parfait !" : "Pas tout à fait..."}
                </div>
                {wordRecognized && (
                  <p className="text-sm text-[#9EAAB4] mt-2">
                    Reconnu : <span className="chinese-char text-white">{wordRecognized}</span>
                  </p>
                )}
                {!wordIsMatch && (
                  <div className="mt-3 text-sm text-[#9EAAB4]">
                    <p>Attendu : <span className="chinese-char text-white font-bold">{wordPractice.simplified}</span> ({wordPractice.pinyin})</p>
                    <p className="mt-2 text-[#FF9600]">Écoutez le modèle et concentrez-vous sur les tons</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!wordIsMatch && (
                  <button
                    onClick={() => { speak(wordPractice.simplified, 0.7); setTimeout(() => startWordListening(), 1500); }}
                    className="flex-1 btn-3d bg-[#FF9600] text-white font-bold py-3 rounded-xl"
                  >
                    🔊 Écouter + Réessayer
                  </button>
                )}
                <button
                  onClick={wordIsMatch ? nextWordPractice : startWordListening}
                  className={`flex-1 btn-3d ${wordIsMatch ? "bg-[#58CC02]" : "bg-[#1CB0F6]"} text-white font-bold py-3 rounded-xl`}
                >
                  {wordIsMatch ? "Mot suivant →" : "🎙️ Réessayer"}
                </button>
              </div>
            </div>
          )}
        </main>
        <Navigation />
      </div>
    );
  }

  // Practice view (initials/finals)
  if (practiceItem) {
    const key = practiceItem.initial || practiceItem.final || "";
    const expectedChinese = getChineseFromExample(practiceExample);
    const expectedPinyin = getPinyinFromExample(practiceExample);

    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button
              onClick={() => setPracticeItem(null)}
              className="text-[#9EAAB4] hover:text-white"
            >
              ← Retour
            </button>
            <h1 className="text-lg font-bold">Pratique : {key}</h1>
            <div className="text-sm text-[#9EAAB4]">
              {successes}/{attempts}
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
          {/* Phonetic info */}
          <div className="bg-gradient-card rounded-2xl p-4 border border-white/5 shadow-card w-full text-center">
            <div className="text-3xl font-bold text-[#CE82FF] mb-1">{key}</div>
            <div className="text-sm text-[#9EAAB4]">IPA: {practiceItem.ipa}</div>
            <div className="text-sm text-[#9EAAB4] mt-1">{practiceItem.description_fr}</div>
          </div>

          {/* Target word */}
          <div className="bg-gradient-card rounded-2xl p-6 border border-white/5 shadow-card w-full text-center">
            <p className="text-sm text-[#9EAAB4] mb-2">Prononcez ce mot :</p>
            <p className="chinese-char text-5xl font-bold mb-3">{expectedChinese}</p>
            <p className="text-xl text-[#CE82FF] font-bold mb-4">{expectedPinyin}</p>
            <button
              onClick={() => speak(expectedChinese)}
              className="btn-3d bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-bold px-6 py-2 rounded-xl"
            >
              🔊 Écouter le modèle
            </button>
          </div>

          {/* Mic button */}
          <button
            onClick={practiceState === "listening" ? undefined : startListening}
            disabled={practiceState === "listening"}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              practiceState === "listening"
                ? "bg-[#FF4B4B] animate-pulse-ring"
                : "bg-[#1A2C34] border-2 border-[#2A4050] hover:border-[#CE82FF] cursor-pointer"
            }`}
          >
            {practiceState === "listening" && (
              <span className="absolute inset-0 rounded-full border-4 border-[#FF4B4B] opacity-30 animate-pulse-ring" />
            )}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke={practiceState === "listening" ? "white" : "#9EAAB4"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <p className="text-xs text-[#9EAAB4]">
            {practiceState === "listening"
              ? "Parlez maintenant..."
              : practiceState === "idle"
              ? "Appuyez sur le micro et prononcez"
              : ""}
          </p>

          {/* Waveform during recording */}
          {practiceState === "listening" && (
            <div className="flex items-end gap-1 h-8">
              {Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#FF4B4B] rounded-full"
                  style={{
                    height: `${20 + Math.random() * 80}%`,
                    animation: `pulse-ring ${0.4 + Math.random() * 0.4}s ease-in-out infinite`,
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Result */}
          {practiceState === "result" && (
            <div className="w-full space-y-4">
              <div
                className={`p-4 rounded-2xl text-center border ${
                  isMatch
                    ? "bg-[#58CC02]/15 border-[#58CC02]/30"
                    : "bg-[#FF4B4B]/15 border-[#FF4B4B]/30"
                }`}
              >
                <div className="text-3xl mb-2">{isMatch ? "✓" : "✗"}</div>
                <div className={`text-lg font-bold ${isMatch ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                  {isMatch ? "Excellent !" : "Pas tout à fait..."}
                </div>
                {recognizedText && (
                  <p className="text-sm text-[#9EAAB4] mt-2">
                    Reconnu : <span className="chinese-char text-white">{recognizedText}</span>
                  </p>
                )}
                {!isMatch && (
                  <div className="mt-3 text-sm text-[#9EAAB4]">
                    <p>Attendu : <span className="chinese-char text-white font-bold">{expectedChinese}</span> ({expectedPinyin})</p>
                    <p className="mt-2 text-[#FF9600]">
                      Conseil : Écoutez le modèle, puis réessayez en articulant bien le son "{key}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!isMatch && (
                  <button
                    onClick={() => {
                      speak(expectedChinese);
                      setTimeout(() => startListening(), 1500);
                    }}
                    className="flex-1 btn-3d bg-[#FF9600] text-white font-bold py-3 rounded-xl"
                  >
                    🔊 Écouter + Réessayer
                  </button>
                )}
                <button
                  onClick={isMatch ? nextExample : startListening}
                  className={`flex-1 btn-3d ${
                    isMatch ? "bg-[#58CC02]" : "bg-[#1CB0F6]"
                  } text-white font-bold py-3 rounded-xl`}
                >
                  {isMatch ? "Mot suivant →" : "🎙️ Réessayer"}
                </button>
              </div>
            </div>
          )}
        </main>

        <Navigation />
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold mb-3">🎙️ Prononciation</h1>
          <div className="flex gap-2">
            {(["initials", "finals", "words"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  tab === t
                    ? "bg-[#CE82FF] text-white"
                    : "bg-[#1A2C34] text-[#9EAAB4]"
                }`}
              >
                {t === "initials" ? "Initiales" : t === "finals" ? "Finales" : "Mots"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {tab === "words" ? (
          <div className="space-y-4">
            {/* Quick start */}
            <button
              onClick={() => startWordPractice()}
              className="w-full btn-3d bg-[#CE82FF] hover:bg-[#B86EE6] text-white font-bold py-3 rounded-xl text-lg"
            >
              🎙️ Session de prononciation
            </button>
            <p className="text-sm text-[#9EAAB4] text-center">
              {learnedWords.length} mots disponibles (basé sur votre progression)
            </p>

            {/* Word list */}
            <div className="space-y-2">
              {learnedWords.map((word, i) => (
                <button
                  key={`${word.simplified}-${i}`}
                  onClick={() => startWordPractice(word)}
                  className="w-full flex items-center gap-4 bg-[#1A2C34] rounded-xl p-3 border border-[#2A4050] hover:border-[#CE82FF] transition-all text-left"
                >
                  <div className="w-12 h-12 bg-[#223A44] rounded-xl flex items-center justify-center chinese-char text-xl font-bold">
                    {word.simplified}
                  </div>
                  <div className="flex-1 min-w-0">
                    <ToneDisplay pinyin={word.pinyin} size="sm" />
                    <div className="text-sm text-[#9EAAB4] truncate">{word.french}</div>
                  </div>
                  <div className="text-[#CE82FF]">🎙️</div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {tab !== "words" && items.map((item, i) => {
          const key = item.initial || item.final || "";
          const isExpanded = expandedItem === item;
          return (
            <div
              key={i}
              className="bg-gradient-card rounded-xl border border-white/5 shadow-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedItem(isExpanded ? null : item)}
                className="w-full flex items-center gap-4 p-4 hover:bg-[#223A44] transition-all"
              >
                <div className="w-12 h-12 bg-[#CE82FF]/20 rounded-xl flex items-center justify-center text-xl font-bold text-[#CE82FF]">
                  {key}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold">{key}</div>
                  <div className="text-sm text-[#9EAAB4] line-clamp-1">{item.description_fr}</div>
                </div>
                <div className="text-xs text-[#9EAAB4] bg-[#223A44] px-2 py-1 rounded-full">
                  {item.ipa}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#2A4050] p-4 bg-[#223A44] space-y-3">
                  <p className="text-sm text-[#9EAAB4]">{item.description_fr}</p>

                  <div className="flex flex-wrap gap-2">
                    {item.examples.map((ex, j) => (
                      <button
                        key={j}
                        onClick={() => speak(getChineseFromExample(ex))}
                        className="bg-[#1A2C34] border border-[#2A4050] rounded-lg px-3 py-2 text-sm hover:border-[#CE82FF] transition-all"
                      >
                        🔊 {ex}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => startPractice(item)}
                    className="w-full btn-3d bg-[#CE82FF] hover:bg-[#B86EE6] text-white font-bold py-2.5 rounded-xl mt-2"
                  >
                    🎙️ S'entraîner sur "{key}"
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
