"use client";

import { useState, useEffect, useMemo } from "react";
import Navigation from "@/components/Navigation";
import FlashCard from "@/components/FlashCard";
import ToneDisplay from "@/components/ToneDisplay";
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

const hskData: Record<number, Word[]> = {
  1: hsk1Data as Word[],
  2: hsk2Data as Word[],
  3: hsk3Data as Word[],
  4: hsk4Data as Word[],
};

const hskColors: Record<number, string> = {
  1: "#58CC02",
  2: "#1CB0F6",
  3: "#FF9600",
  4: "#CE82FF",
};

export default function VocabularyPage() {
  const [selectedHsk, setSelectedHsk] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const words = hskData[selectedHsk] || [];

  const categories = useMemo(() => {
    const cats = new Set(words.map((w) => w.category));
    return ["all", ...Array.from(cats).sort()];
  }, [words]);

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchesSearch =
        !searchQuery ||
        w.simplified.includes(searchQuery) ||
        w.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.french.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || w.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [words, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-extrabold mb-3 animate-fade-in">📚 Vocabulaire</h1>
          {/* HSK Level tabs */}
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                onClick={() => { setSelectedHsk(level); setCurrentCardIndex(0); setSelectedCategory("all"); }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  selectedHsk === level
                    ? "text-white"
                    : "bg-white text-[#6B7280] hover:bg-[#F7F7F5]"
                }`}
                style={selectedHsk === level ? { backgroundColor: hskColors[level] } : {}}
              >
                HSK {level}
              </button>
            ))}
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="Rechercher un mot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-xl px-4 py-2.5 text-sm placeholder-[#9EAAB4] input-focus"
          />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-[#58CC02] text-white"
                  : "bg-white text-[#6B7280] hover:bg-[#F7F7F5]"
              }`}
            >
              {cat === "all" ? "Tout" : cat}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-[#6B7280]">{filteredWords.length} mots</span>
          <div className="flex gap-1 bg-white rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "list" ? "bg-[#58CC02] text-white" : "text-[#6B7280]"
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "cards" ? "bg-[#58CC02] text-white" : "text-[#6B7280]"
              }`}
            >
              Cartes
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="space-y-2">
            {filteredWords.map((word, i) => (
              <Link
                key={`${word.simplified}-${i}`}
                href={`/vocabulary/${encodeURIComponent(word.simplified)}`}
                className="flex items-center gap-4 bg-gradient-card rounded-xl p-3 border border-white/5 shadow-card hover-lift transition-all duration-200"
              >
                <div className="w-12 h-12 bg-[#F7F7F5] rounded-xl flex items-center justify-center chinese-char text-xl font-bold">
                  {word.simplified}
                </div>
                <div className="flex-1 min-w-0">
                  <ToneDisplay pinyin={word.pinyin} size="sm" />
                  <div className="text-sm text-[#6B7280] truncate">{word.french}</div>
                </div>
                <span className="text-xs text-[#6B7280] bg-[#F7F7F5] px-2 py-0.5 rounded-full">
                  {word.category}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {filteredWords.length > 0 && (
              <>
                <FlashCard word={filteredWords[currentCardIndex]} />
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                    disabled={currentCardIndex === 0}
                    className="w-10 h-10 rounded-full bg-white border border-[#2A4050] flex items-center justify-center disabled:opacity-30"
                  >
                    ←
                  </button>
                  <span className="text-sm text-[#6B7280]">
                    {currentCardIndex + 1} / {filteredWords.length}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentCardIndex(Math.min(filteredWords.length - 1, currentCardIndex + 1))
                    }
                    disabled={currentCardIndex === filteredWords.length - 1}
                    className="w-10 h-10 rounded-full bg-white border border-[#2A4050] flex items-center justify-center disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
