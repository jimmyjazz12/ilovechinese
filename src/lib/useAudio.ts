"use client";

import { useCallback, useRef } from "react";

/**
 * Hook to speak Chinese text.
 * Uses our own /api/tts proxy (fetches from Google Translate TTS server-side,
 * no CORS issues). Falls back to Web Speech API.
 */
export function useChineseAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback((text: string) => {
    if (!text) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Use our API proxy to avoid CORS issues
    const encoded = encodeURIComponent(text);
    const audioUrl = `/api/tts?text=${encoded}&lang=zh-CN`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.volume = 1;

    audio.play().catch(() => {
      // Fallback to Web Speech API
      speakWithSynthesis(text);
    });
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
