"use client";

import { useState, useRef, useEffect } from "react";
import { reportError } from "@/lib/corrections";
import { useUser } from "@/lib/UserContext";

interface ReportErrorProps {
  word: string;
  currentFrench?: string;
  currentPinyin?: string;
  className?: string;
}

const ERROR_TYPES = [
  { value: "wrong_translation" as const, label: "Traduction incorrecte" },
  { value: "wrong_pinyin" as const, label: "Pinyin incorrect" },
  { value: "wrong_tone" as const, label: "Mauvais ton" },
  { value: "other" as const, label: "Autre" },
];

export default function ReportError({
  word,
  currentFrench,
  currentPinyin,
  className = "",
}: ReportErrorProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<
    "wrong_translation" | "wrong_pinyin" | "wrong_tone" | "other"
  >("wrong_translation");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const getField = () => {
    if (type === "wrong_translation") return "french";
    if (type === "wrong_pinyin" || type === "wrong_tone") return "pinyin";
    return "other";
  };

  const getCurrentValue = () => {
    const field = getField();
    if (field === "french") return currentFrench || "";
    if (field === "pinyin") return currentPinyin || "";
    return "";
  };

  const handleSubmit = () => {
    if (!suggestedValue.trim()) return;
    reportError({
      userId: user?.id || "anonymous",
      word,
      type,
      field: getField(),
      currentValue: getCurrentValue(),
      suggestedValue: suggestedValue.trim(),
      comment: comment.trim(),
    });
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setSuggestedValue("");
      setComment("");
      setType("wrong_translation");
    }, 1800);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#FF9600] transition-colors ${className}`}
        title="Signaler une erreur"
      >
        <span className="text-sm">&#x1F6A9;</span>
        <span>Signaler</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] w-[90vw] max-w-md p-5 mx-4 animate-fade-in"
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-3">&#x2713;</div>
                <p className="text-[#059669] font-semibold">
                  Merci ! Votre signalement a &eacute;t&eacute; enregistr&eacute;.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#1A1A1A]">
                    Signaler une erreur
                  </h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Word info */}
                <div className="bg-[#F7F7F5] rounded-xl p-3 mb-4 text-center">
                  <span className="text-2xl font-bold text-[#1A1A1A]">
                    {word}
                  </span>
                  {currentFrench && (
                    <span className="text-[#6B7280] ml-2">
                      — {currentFrench}
                    </span>
                  )}
                </div>

                {/* Error type radio buttons */}
                <div className="mb-4">
                  <label className="text-xs text-[#6B7280] font-medium uppercase tracking-wide mb-2 block">
                    Type d&apos;erreur
                  </label>
                  <div className="space-y-2">
                    {ERROR_TYPES.map((et) => (
                      <label
                        key={et.value}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          type === et.value
                            ? "bg-[#F0F7FF] border border-[#1CB0F6]/30"
                            : "hover:bg-[#F7F7F5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="error_type"
                          value={et.value}
                          checked={type === et.value}
                          onChange={() => setType(et.value)}
                          className="accent-[#1CB0F6]"
                        />
                        <span className="text-sm text-[#1A1A1A]">
                          {et.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Suggested correction */}
                <div className="mb-3">
                  <label className="text-xs text-[#6B7280] font-medium uppercase tracking-wide mb-1 block">
                    Correction sugg&eacute;r&eacute;e
                  </label>
                  <input
                    type="text"
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    placeholder="Entrez la bonne traduction..."
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/30 focus:border-[#1CB0F6] transition-all"
                  />
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label className="text-xs text-[#6B7280] font-medium uppercase tracking-wide mb-1 block">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="D&eacute;tails suppl&eacute;mentaires..."
                    rows={2}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/30 focus:border-[#1CB0F6] transition-all resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!suggestedValue.trim()}
                    className="flex-1 bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                  >
                    Envoyer
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] font-semibold py-2.5 rounded-xl transition-all text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
