"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PronunciationRecorder from "@/components/PronunciationRecorder";

import initialsData from "@/data/initials.json";
import finalsData from "@/data/finals.json";

interface PhoneticsItem {
  initial?: string;
  final?: string;
  ipa: string;
  description_fr: string;
  examples: string[];
}

export default function PronunciationPage() {
  const [tab, setTab] = useState<"initials" | "finals" | "practice">("initials");
  const [selectedItem, setSelectedItem] = useState<PhoneticsItem | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.6;
    speechSynthesis.speak(u);
  };

  const initials = initialsData as PhoneticsItem[];
  const finals = finalsData as PhoneticsItem[];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#131F24] border-b border-[#2A4050] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold mb-3">🎙️ Prononciation</h1>
          <div className="flex gap-2">
            {(["initials", "finals", "practice"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  tab === t
                    ? "bg-[#CE82FF] text-white"
                    : "bg-[#1A2C34] text-[#9EAAB4]"
                }`}
              >
                {t === "initials" ? "Initiales" : t === "finals" ? "Finales" : "Pratique"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {tab === "practice" ? (
          <div className="space-y-6">
            <p className="text-[#9EAAB4] text-center">
              Enregistrez votre voix et comparez avec la prononciation correcte.
            </p>
            <PronunciationRecorder
              targetText="你好"
              targetPinyin="nǐ hǎo"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {(tab === "initials" ? initials : finals).map((item, i) => {
              const key = item.initial || item.final || "";
              return (
                <div
                  key={i}
                  className="bg-[#1A2C34] rounded-xl border border-[#2A4050] overflow-hidden"
                >
                  <button
                    onClick={() => setSelectedItem(selectedItem === item ? null : item)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#223A44] transition-all"
                  >
                    <div className="w-12 h-12 bg-[#CE82FF]/20 rounded-xl flex items-center justify-center text-xl font-bold text-[#CE82FF]">
                      {key}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold">{key}</div>
                      <div className="text-sm text-[#9EAAB4]">{item.description_fr}</div>
                    </div>
                    <div className="text-xs text-[#9EAAB4] bg-[#223A44] px-2 py-1 rounded-full">
                      IPA: {item.ipa}
                    </div>
                  </button>

                  {selectedItem === item && (
                    <div className="border-t border-[#2A4050] p-4 bg-[#223A44]">
                      <p className="text-sm text-[#9EAAB4] mb-3">{item.description_fr}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.examples.map((ex, j) => (
                          <button
                            key={j}
                            onClick={() => speak(ex.split(" ")[0])}
                            className="bg-[#1A2C34] border border-[#2A4050] rounded-lg px-3 py-2 text-sm hover:border-[#CE82FF] transition-all"
                          >
                            🔊 {ex}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
