"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import FlashCard from "@/components/FlashCard";
import ToneDisplay from "@/components/ToneDisplay";
import CharacterAssociations from "@/components/CharacterAssociations";
import Link from "next/link";

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

const allWords: Word[] = [
  ...(hsk1Data as Word[]),
  ...(hsk2Data as Word[]),
  ...(hsk3Data as Word[]),
  ...(hsk4Data as Word[]),
];

const hskData: Record<number, Word[]> = {
  1: hsk1Data as Word[],
  2: hsk2Data as Word[],
  3: hsk3Data as Word[],
  4: hsk4Data as Word[],
};

export default function VocabularyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [hskLevel, wordIndex] = id.split("-").map(Number);

  const words = hskData[hskLevel] || [];
  const word = words[wordIndex];

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  if (!word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#9EAAB4]">Mot non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#131F24] border-b border-[#2A4050] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/vocabulary" className="text-[#9EAAB4] hover:text-white">
            ← Retour
          </Link>
          <h1 className="text-lg font-bold">Détail du mot</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Main card */}
        <div className="bg-[#1A2C34] rounded-2xl p-6 border border-[#2A4050] text-center">
          <div className="chinese-char text-6xl font-bold mb-4">{word.simplified}</div>
          {word.traditional !== word.simplified && (
            <div className="text-[#9EAAB4] text-sm mb-2">Traditionnel: {word.traditional}</div>
          )}
          <div className="mb-3">
            <ToneDisplay pinyin={word.pinyin} size="lg" />
          </div>
          <div className="text-xl text-[#9EAAB4] mb-4">{word.french}</div>
          <button
            onClick={() => speak(word.simplified)}
            className="btn-3d bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-bold px-6 py-2 rounded-xl"
          >
            🔊 Écouter
          </button>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1A2C34] rounded-xl p-3 border border-[#2A4050]">
            <div className="text-xs text-[#9EAAB4] mb-1">Niveau</div>
            <div className="font-bold">HSK {word.hsk_level}</div>
          </div>
          <div className="bg-[#1A2C34] rounded-xl p-3 border border-[#2A4050]">
            <div className="text-xs text-[#9EAAB4] mb-1">Catégorie</div>
            <div className="font-bold">{word.category}</div>
          </div>
        </div>

        {/* Character decomposition */}
        {word.components && word.components.length > 1 && (
          <div className="bg-[#1A2C34] rounded-2xl p-4 border border-[#2A4050]">
            <h2 className="font-bold text-sm text-[#9EAAB4] uppercase tracking-wide mb-3">
              Caractères
            </h2>
            <div className="flex gap-3 justify-center">
              {word.components.map((char, i) => (
                <button
                  key={i}
                  onClick={() => speak(char)}
                  className="w-14 h-14 bg-[#223A44] rounded-xl flex items-center justify-center chinese-char text-2xl font-bold hover:bg-[#2A4050] transition-all"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Character associations */}
        <CharacterAssociations
          groups={(() => {
            const chars = [...new Set(word.simplified.split(""))];
            return chars.map((char) => ({
              character: char,
              words: allWords
                .filter((w) => w.simplified !== word.simplified && w.simplified.includes(char))
                .slice(0, 6)
                .map((w) => ({ simplified: w.simplified, pinyin: w.pinyin, french: w.french })),
            })).filter((g) => g.words.length > 0);
          })()}
        />

        {/* Navigation between words */}
        <div className="flex justify-between">
          {wordIndex > 0 && (
            <Link
              href={`/vocabulary/${hskLevel}-${wordIndex - 1}`}
              className="btn-3d bg-[#1A2C34] border border-[#2A4050] text-white px-4 py-2 rounded-xl"
            >
              ← Précédent
            </Link>
          )}
          <div className="flex-1" />
          {wordIndex < words.length - 1 && (
            <Link
              href={`/vocabulary/${hskLevel}-${wordIndex + 1}`}
              className="btn-3d bg-[#1A2C34] border border-[#2A4050] text-white px-4 py-2 rounded-xl"
            >
              Suivant →
            </Link>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  );
}
