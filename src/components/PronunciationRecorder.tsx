"use client";

import { useState, useRef, useCallback } from "react";

interface PronunciationRecorderProps {
  /** The Chinese text to pronounce */
  expectedText?: string;
  /** Alias for expectedText (backward compat) */
  targetText?: string;
  /** Optional pinyin shown below the target text */
  targetPinyin?: string;
  onResult?: (recognized: string, isMatch: boolean) => void;
  className?: string;
}

export default function PronunciationRecorder({
  expectedText,
  targetText,
  targetPinyin,
  onResult,
  className = "",
}: PronunciationRecorderProps) {
  const displayText = expectedText ?? targetText ?? "";
  const [recording, setRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Use Web Speech API for recognition if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const SpeechRecognitionCtor = w.SpeechRecognition ?? w.webkitSpeechRecognition;

      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "zh-CN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
          const transcript = event.results[0]?.[0]?.transcript ?? "";
          const match = transcript.includes(displayText) || displayText.includes(transcript);
          setRecognizedText(transcript);
          setIsMatch(match);
          onResult?.(transcript, match);
        };

        recognition.onerror = () => {
          setRecognizedText("Erreur de reconnaissance");
          setIsMatch(false);
        };

        recognition.start();
      }

      mediaRecorder.start();
      setRecording(true);
      setRecognizedText(null);
      setIsMatch(null);
    } catch {
      console.error("Microphone access denied");
    }
  }, [displayText, onResult]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    }
    setRecording(false);
  }, []);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Expected text */}
      <div className="text-center">
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">Prononcez :</p>
        <p className="chinese-char text-3xl font-bold text-white">{displayText}</p>
        {targetPinyin && (
          <p className="text-[var(--color-text-secondary)] text-lg mt-1">{targetPinyin}</p>
        )}
      </div>

      {/* Mic button */}
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          recording
            ? "bg-[var(--color-red)] animate-pulse-ring"
            : "bg-[var(--color-card)] border-2 border-[var(--color-border)] hover:border-[var(--color-blue)]"
        }`}
        aria-label={recording ? "Arreter l'enregistrement" : "Commencer l'enregistrement"}
      >
        {recording && (
          <span className="absolute inset-0 rounded-full border-4 border-[var(--color-red)] opacity-30 animate-pulse-ring" />
        )}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={recording ? "white" : "var(--color-text-secondary)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      <p className="text-xs text-[var(--color-text-secondary)]">
        {recording ? "Enregistrement en cours..." : "Appuyez pour parler"}
      </p>

      {/* Waveform placeholder (animated bars during recording) */}
      {recording && (
        <div className="flex items-end gap-1 h-8">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="w-1.5 bg-[var(--color-red)] rounded-full"
              style={{
                height: `${Math.random() * 100}%`,
                animation: `pulse-ring ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Result */}
      {recognizedText !== null && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="flex items-center gap-2">
            {isMatch ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-green)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-red)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            <span
              className={`text-lg font-bold ${
                isMatch ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
              }`}
            >
              {isMatch ? "Correct !" : "Essayez encore"}
            </span>
          </div>
          <p className="chinese-char text-lg text-[var(--color-text-secondary)]">
            Reconnu : {recognizedText}
          </p>
        </div>
      )}
    </div>
  );
}
