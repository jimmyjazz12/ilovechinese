"use client";

import { useState, useRef, useCallback } from "react";

interface PronunciationRecorderProps {
  expectedText?: string;
  targetText?: string;
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

  const waveformBars = 16;

  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      {/* Expected text */}
      <div className="text-center">
        <p className="text-sm text-[var(--color-text-secondary)] mb-1.5 font-medium">
          Prononcez :
        </p>
        <p
          className="chinese-char text-4xl font-bold text-white"
          style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)" }}
        >
          {displayText}
        </p>
        {targetPinyin && (
          <p className="text-[var(--color-text-secondary)] text-lg mt-1.5 font-medium">
            {targetPinyin}
          </p>
        )}
      </div>

      {/* Mic button with gradient + glow */}
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${recording ? "animate-recording-glow" : "hover:scale-105"}
        `}
        style={
          recording
            ? {
                background: "linear-gradient(135deg, var(--color-red), #FF6B6B)",
              }
            : {
                background: "linear-gradient(135deg, var(--color-purple), #A855F7)",
                boxShadow: "0 4px 16px rgba(206, 130, 255, 0.25)",
              }
        }
        aria-label={recording ? "Arreter l'enregistrement" : "Commencer l'enregistrement"}
      >
        {recording && (
          <span
            className="absolute inset-0 rounded-full animate-pulse-ring"
            style={{ border: "3px solid rgba(255, 75, 75, 0.3)" }}
          />
        )}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {recording ? (
            <>
              <rect x="6" y="6" width="12" height="12" rx="2" fill="white" />
            </>
          ) : (
            <>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          )}
        </svg>
      </button>

      <p className="text-xs text-[var(--color-text-secondary)] font-medium">
        {recording ? "Enregistrement en cours..." : "Appuyez pour parler"}
      </p>

      {/* Waveform with gradient bars */}
      {recording && (
        <div className="flex items-end justify-center gap-[3px] h-10">
          {Array.from({ length: waveformBars }, (_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full animate-waveform-bar"
              style={{
                height: "100%",
                background: `linear-gradient(to top, var(--color-purple), #A855F7, #C084FC)`,
                animationDuration: `${0.4 + Math.random() * 0.5}s`,
                animationDelay: `${i * 0.04}s`,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>
      )}

      {/* Result card */}
      {recognizedText !== null && (
        <div
          className="flex flex-col items-center gap-3 mt-2 p-4 rounded-2xl w-full max-w-xs animate-result-pop"
          style={{
            background: "rgba(26, 44, 52, 0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: isMatch
              ? "1px solid rgba(88, 204, 2, 0.3)"
              : "1px solid rgba(255, 75, 75, 0.3)",
            boxShadow: isMatch
              ? "0 0 20px rgba(88, 204, 2, 0.1)"
              : "0 0 20px rgba(255, 75, 75, 0.1)",
          }}
        >
          <div className="flex items-center gap-2.5">
            {isMatch ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center animate-scale-in"
                style={{ background: "rgba(88, 204, 2, 0.2)" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-green)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center animate-shake"
                style={{ background: "rgba(255, 75, 75, 0.2)" }}
              >
                <svg
                  width="20"
                  height="20"
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
              </div>
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
            Reconnu : <span className="text-white">{recognizedText}</span>
          </p>
        </div>
      )}
    </div>
  );
}
