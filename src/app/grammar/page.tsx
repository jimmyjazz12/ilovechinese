"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";
import Link from "next/link";

import grammarData from "@/data/grammar.json";
import { useChineseAudio } from "@/lib/useAudio";

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

const hskColors: Record<number, string> = {
  1: "#58CC02",
  2: "#1CB0F6",
  3: "#FF9600",
  4: "#CE82FF",
};

export default function GrammarPage() {
  const [selectedHsk, setSelectedHsk] = useState(1);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const rules = (grammarData as GrammarRule[]).filter(
    (r) => r.hsk_level === selectedHsk
  );

  const speak = useChineseAudio();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">📝 Grammaire</h1>
            <Link
              href="/grammar/review"
              className="btn-3d bg-[#58CC02] text-[#1A1A1A] text-sm font-bold px-4 py-1.5 rounded-xl"
            >
              Quiz →
            </Link>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedHsk(level)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  selectedHsk === level
                    ? "text-[#1A1A1A]"
                    : "bg-white text-[#6B7280] hover:bg-[#F7F7F5]"
                }`}
                style={selectedHsk === level ? { backgroundColor: hskColors[level] } : {}}
              >
                HSK {level}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-gradient-card rounded-xl border border-white/5 shadow-card overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedRule(expandedRule === rule.id ? null : rule.id)
              }
              className="w-full text-left p-4 hover:bg-[#F7F7F5] transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1A1A1A] text-xs font-bold shrink-0"
                  style={{ backgroundColor: hskColors[rule.hsk_level] }}
                >
                  {rule.id}
                </div>
                <div>
                  <div className="font-bold text-sm">{rule.title}</div>
                  <div className="text-xs text-[#6B7280] mt-1 font-mono">
                    {rule.pattern}
                  </div>
                </div>
              </div>
            </button>

            {expandedRule === rule.id && (
              <div className="border-t border-[#E5E7EB] p-4 space-y-4">
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {rule.explanation_fr}
                </p>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">
                    Exemples
                  </h3>
                  {rule.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-[#F7F7F5] rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => speak(ex.chinese)}
                          className="text-[#1CB0F6] text-xs"
                        >
                          🔊
                        </button>
                        <span className="chinese-char text-lg font-bold">
                          {ex.chinese}
                        </span>
                      </div>
                      <ToneDisplay pinyin={ex.pinyin} size="sm" />
                      <div className="text-sm text-[#6B7280] mt-1">
                        {ex.french}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      <Navigation />
    </div>
  );
}
