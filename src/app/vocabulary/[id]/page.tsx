"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";
import CharacterAssociations from "@/components/CharacterAssociations";
import Link from "next/link";

import hsk1Data from "@/data/hsk1.json";
import hsk2Data from "@/data/hsk2.json";
import hsk3Data from "@/data/hsk3.json";
import hsk4Data from "@/data/hsk4.json";

interface Example {
  chinese: string;
  pinyin: string;
  french: string;
}

interface Word {
  simplified: string;
  traditional: string;
  pinyin: string;
  french: string;
  hsk_level: number;
  category: string;
  components: string[];
  examples?: Example[];
}

const allWords: Word[] = [
  ...(hsk1Data as Word[]),
  ...(hsk2Data as Word[]),
  ...(hsk3Data as Word[]),
  ...(hsk4Data as Word[]),
];

export default function VocabularyDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  // Get user's current level from localStorage
  const [userLevel, setUserLevel] = useState(1);
  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
    setUserLevel(stats.current_hsk_level || 1);
  }, []);

  const word = allWords.find((w) => w.simplified === id);

  // Find prev/next within the same HSK level
  const sameLevel = word ? allWords.filter((w) => w.hsk_level === word.hsk_level) : [];
  const indexInLevel = word ? sameLevel.findIndex((w) => w.simplified === word.simplified) : -1;
  const prevWord = indexInLevel > 0 ? sameLevel[indexInLevel - 1] : null;
  const nextWord = indexInLevel < sameLevel.length - 1 ? sameLevel[indexInLevel + 1] : null;

  // Extended associations: words from current level + previous + next
  const associationWords = useMemo(() => {
    if (!word) return [];
    const minLevel = Math.max(1, word.hsk_level - 1);
    const maxLevel = Math.min(4, word.hsk_level + 1);
    return allWords.filter(
      (w) => w.hsk_level >= minLevel && w.hsk_level <= maxLevel
    );
  }, [word]);

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  if (!word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#6B7280]">Mot non trouvé</p>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/vocabulary" className="text-[#6B7280] hover:text-[#1A1A1A]">
            ← Retour
          </Link>
          <h1 className="text-lg font-bold text-[#1A1A1A]">Détail du mot</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Main card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-card text-center animate-fade-in">
          <div className="chinese-char text-6xl font-bold mb-4 text-[#1A1A1A]">{word.simplified}</div>
          {word.traditional !== word.simplified && (
            <div className="text-[#6B7280] text-sm mb-2">Traditionnel: {word.traditional}</div>
          )}
          <div className="mb-3">
            <ToneDisplay pinyin={word.pinyin} size="lg" />
          </div>
          <div className="text-xl text-[#6B7280] mb-4">{word.french}</div>
          <button
            onClick={() => speak(word.simplified)}
            className="btn-3d bg-gradient-to-r from-[#1CB0F6] to-[#1899D6] text-white font-bold px-6 py-2 rounded-xl"
          >
            🔊 Écouter
          </button>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in animate-delay-1">
          <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] shadow-card">
            <div className="text-xs text-[#6B7280] mb-1">Niveau</div>
            <div className="font-bold text-[#1A1A1A]">HSK {word.hsk_level}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] shadow-card">
            <div className="text-xs text-[#6B7280] mb-1">Catégorie</div>
            <div className="font-bold text-[#1A1A1A]">{word.category}</div>
          </div>
        </div>

        {/* Example sentences */}
        {word.examples && word.examples.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-card animate-fade-in animate-delay-2">
            <h2 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest mb-3">
              Exemples
            </h2>
            <div className="space-y-3">
              {word.examples.map((ex, i) => (
                <div key={i} className="bg-[#F7F7F5] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => speak(ex.chinese)}
                      className="text-[#1CB0F6] hover:scale-110 transition-transform"
                    >
                      🔊
                    </button>
                    <span className="chinese-char text-lg font-bold text-[#1A1A1A]">{ex.chinese}</span>
                  </div>
                  <ToneDisplay pinyin={ex.pinyin} size="sm" />
                  <div className="text-sm text-[#6B7280] mt-1">{ex.french}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Character decomposition */}
        {word.components && word.components.length > 1 && (
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-card animate-fade-in animate-delay-3">
            <h2 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest mb-3">
              Caractères
            </h2>
            <div className="flex gap-3 justify-center">
              {word.components.map((char, i) => (
                <Link
                  key={i}
                  href={`/vocabulary/${encodeURIComponent(char)}`}
                  className="w-14 h-14 bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl flex items-center justify-center chinese-char text-2xl font-bold text-[#1A1A1A] hover:bg-[#EFEFED] hover-lift transition-all"
                >
                  {char}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Character associations — extended to nearby HSK levels */}
        <div className="animate-fade-in animate-delay-4">
          <CharacterAssociations
            groups={(() => {
              const chars = [...new Set(word.simplified.split(""))];
              return chars
                .map((char) => ({
                  character: char,
                  words: associationWords
                    .filter((w) => w.simplified !== word.simplified && w.simplified.includes(char))
                    .map((w) => ({ simplified: w.simplified, pinyin: w.pinyin, french: w.french })),
                }))
                .filter((g) => g.words.length > 0);
            })()}
            onWordClick={(w) => {
              window.location.href = `/vocabulary/${encodeURIComponent(w.simplified)}`;
            }}
          />
        </div>

        {/* Navigation between words */}
        <div className="flex justify-between animate-fade-in animate-delay-5">
          {prevWord ? (
            <Link
              href={`/vocabulary/${encodeURIComponent(prevWord.simplified)}`}
              className="btn-3d bg-white border border-[#E5E7EB] text-[#1A1A1A] px-4 py-2 rounded-xl shadow-card"
            >
              ← Précédent
            </Link>
          ) : <div />}
          <div className="flex-1" />
          {nextWord ? (
            <Link
              href={`/vocabulary/${encodeURIComponent(nextWord.simplified)}`}
              className="btn-3d bg-white border border-[#E5E7EB] text-[#1A1A1A] px-4 py-2 rounded-xl shadow-card"
            >
              Suivant →
            </Link>
          ) : <div />}
        </div>
      </main>

      <Navigation />
    </div>
  );
}
