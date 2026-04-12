"use client";

import { useCallback } from "react";

/**
 * Hook to speak Chinese text. Uses Google Translate TTS as primary
 * (works on all devices without setup), falls back to Web Speech API.
 */
export function useChineseAudio() {
  const speak = useCallback((text: string) => {
    if (!text) return;

    // Method 1: Google Translate TTS audio (reliable, works everywhere)
    try {
      const encoded = encodeURIComponent(text);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encoded}`;
      const audio = new Audio(audioUrl);
      audio.volume = 1;
      audio.play().catch(() => {
        // Fallback to Web Speech API
        speakWithSynthesis(text);
      });
    } catch {
      speakWithSynthesis(text);
    }
  }, []);

  return speak;
}

function speakWithSynthesis(text: string) {
  try {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.7;
    u.volume = 1;
    const voices = speechSynthesis.getVoices();
    const zhVoice =
      voices.find((v) => v.lang.startsWith("zh")) ||
      voices.find((v) => v.lang.includes("CN")) ||
      null;
    if (zhVoice) u.voice = zhVoice;
    speechSynthesis.speak(u);
  } catch {
    // Silent fail
  }
}
