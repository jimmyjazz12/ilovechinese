"use client";

import { useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
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

export default function VocabularyDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  // Find word by simplified character
  const word = allWords.find((w) => w.simplified === id);
  const wordIndex = word ? allWords.indexOf(word) : -1;

  // Find prev/next within the same HSK level
  const sameLevel = word ? allWords.filter((w) => w.hsk_level === word.hsk_level) : [];
  const indexInLevel = word ? sameLevel.findIndex((w) => w.simplified === word.simplified) : -1;
  const prevWord = indexInLevel > 0 ? sameLevel[indexInLevel - 1] : null;
  const nextWord = indexInLevel < sameLevel.length - 1 ? sameLevel[indexInLevel + 1] : null;

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
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/vocabulary" className="text-[#9EAAB4] hover:text-white">
            ← Retour
          </Link>
          <h1 className="text-lg font-bold">Détail du mot</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Main card */}
        <div className="bg-gradient-card rounded-2xl p-6 border border-white/5 shadow-card text-center">
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
          <div className="bg-gradient-card rounded-xl p-3 border border-white/5 shadow-card">
            <div className="text-xs text-[#9EAAB4] mb-1">Niveau</div>
            <div className="font-bold">HSK {word.hsk_level}</div>
          </div>
          <div className="bg-gradient-card rounded-xl p-3 border border-white/5 shadow-card">
            <div className="text-xs text-[#9EAAB4] mb-1">Catégorie</div>
            <div className="font-bold">{word.category}</div>
          </div>
        </div>

        {/* Character decomposition */}
        {word.components && word.components.length > 1 && (
          <div className="bg-gradient-card rounded-2xl p-4 border border-white/5 shadow-card">
            <h2 className="font-bold text-sm text-[#9EAAB4] uppercase tracking-wide mb-3">
              Caractères
            </h2>
            <div className="flex gap-3 justify-center">
              {word.components.map((char, i) => (
                <Link
                  key={i}
                  href={`/vocabulary/${encodeURIComponent(char)}`}
                  className="w-14 h-14 bg-[#223A44] rounded-xl flex items-center justify-center chinese-char text-2xl font-bold hover:bg-[#2A4050] transition-all"
                >
                  {char}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Character associations */}
        <CharacterAssociations
          groups={(() => {
            const chars = [...new Set(word.simplified.split(""))];
            return chars
              .map((char) => ({
                character: char,
                words: allWords
                  .filter((w) => w.simplified !== word.simplified && w.simplified.includes(char))
                  .slice(0, 6)
                  .map((w) => ({ simplified: w.simplified, pinyin: w.pinyin, french: w.french })),
              }))
              .filter((g) => g.words.length > 0);
          })()}
          onWordClick={(w) => {
            window.location.href = `/vocabulary/${encodeURIComponent(w.simplified)}`;
          }}
        />

        {/* Navigation between words */}
        <div className="flex justify-between">
          {prevWord && (
            <Link
              href={`/vocabulary/${encodeURIComponent(prevWord.simplified)}`}
              className="btn-3d bg-[#1A2C34] border border-[#2A4050] text-white px-4 py-2 rounded-xl"
            >
              ← Précédent
            </Link>
          )}
          <div className="flex-1" />
          {nextWord && (
            <Link
              href={`/vocabulary/${encodeURIComponent(nextWord.simplified)}`}
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
