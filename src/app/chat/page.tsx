"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import ChatMessage from "@/components/ChatMessage";
import { useUser } from "@/lib/UserContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const { getUserKey } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dictating, setDictating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(getUserKey("chat_history"));
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessages = (msgs: Message[]) => {
    localStorage.setItem(getUserKey("chat_history"), JSON.stringify(msgs));
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Build rich context from localStorage for Prof Wang's memory
      const stats = JSON.parse(localStorage.getItem(getUserKey("user_stats")) || "{}");
      const progress = JSON.parse(localStorage.getItem(getUserKey("srs_progress")) || "{}");
      const calendar = JSON.parse(localStorage.getItem(getUserKey("study_calendar")) || "{}");

      const masteredWords = Object.entries(progress)
        .filter(([, p]: [string, any]) => (p.box_level ?? p.mastery_level ?? 0) >= 6)
        .map(([word]) => word);

      const learningWords = Object.entries(progress)
        .filter(([, p]: [string, any]) => {
          const box = (p as any).box_level ?? 0;
          return box >= 1 && box < 6;
        })
        .map(([word]) => word);

      const weakWords = Object.entries(progress)
        .filter(([, p]: [string, any]) => (p as any).incorrect_count > (p as any).correct_count)
        .map(([word]) => word);

      // Calculate streak
      const calendarDays = Object.keys(calendar).sort().reverse();
      const streak = stats.daily_streak || stats.current_streak_days || 0;

      // Conversation summary (last topics discussed)
      const recentTopics = messages.slice(-10).map(m => m.content.slice(0, 50)).join(" | ");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.slice(-30).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            hsk_level: stats.current_hsk_level || 1,
            words_mastered: masteredWords.length,
            mastered_list: masteredWords.slice(0, 100),
            words_learning: learningWords.length,
            learning_list: learningWords.slice(0, 50),
            weak_words: weakWords.slice(0, 20),
            xp_total: stats.xp_total || 0,
            xp_today: stats.xp_today || 0,
            streak: streak,
            days_active: calendarDays.length,
            total_words_seen: Object.keys(progress).length,
            recent_topics: recentTopics,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur de l'API");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Désolé, je n'ai pas pu répondre. Vérifiez que votre clé API est configurée dans le fichier .env.local.",
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    }

    setLoading(false);
  };

  // Dictation — speak to type
  const startDictation = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) { alert("Reconnaissance vocale non supportée"); return; }

    // Stop previous
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new Ctor();
    recognition.lang = "zh-CN"; // Default to Chinese, will also catch French
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;
    recognitionRef.current = recognition;
    setDictating(true);

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interim = t;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setDictating(false);
      if (finalTranscript) setInput(finalTranscript);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setDictating(false);
    };

    recognition.start();
  }, []);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setDictating(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {} };
  }, []);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(getUserKey("chat_history"));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1CB0F6] rounded-full flex items-center justify-center text-sm">
              👨‍🏫
            </div>
            <div>
              <h1 className="text-sm font-bold">Prof Wang</h1>
              <p className="text-xs text-[#58CC02]">En ligne</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-xs text-[#6B7280] hover:text-[#FF4B4B] transition-colors"
          >
            Effacer
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">👨‍🏫</div>
            <h2 className="text-xl font-bold">Bonjour ! Je suis Prof Wang</h2>
            <p className="text-[#6B7280] text-sm max-w-xs mx-auto">
              Je suis votre professeur de mandarin. Posez-moi vos questions,
              demandez-moi des exercices ou discutons en chinois !
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Comment dit-on 'bonjour' en chinois ?",
                "Explique-moi les tons",
                "Donne-moi un exercice HSK 1",
                "Quelle est la différence entre 的 得 地 ?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="bg-gradient-card border border-white/5 rounded-xl shadow-card hover-lift px-3 py-2 text-xs text-[#6B7280] hover:border-[#1CB0F6] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-[#6B7280]">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs">Prof Wang écrit...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="sticky bottom-16 glass-dark border-t border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2 items-center">
          {/* Mic button */}
          <button
            onClick={dictating ? stopDictation : startDictation}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              dictating
                ? "bg-[#FF4B4B] animate-pulse"
                : "bg-[#CE82FF] hover:bg-[#B86EE6]"
            }`}
          >
            {dictating ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={dictating ? "Parlez..." : "Écrivez ou dictez 🎙️"}
            className={`flex-1 bg-white rounded-xl px-4 py-2.5 text-sm placeholder-[#6B7280] input-focus ${
              dictating ? "border-[#FF4B4B] ring-2 ring-[#FF4B4B]/20" : ""
            }`}
          />
          <button
            onClick={() => { if (dictating) stopDictation(); sendMessage(); }}
            disabled={!input.trim() || loading}
            className="shrink-0 btn-3d bg-[#1CB0F6] hover:bg-[#1899D6] disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl"
          >
            ↑
          </button>
        </div>
        {dictating && (
          <p className="text-center text-xs text-[#FF4B4B] mt-1.5 font-semibold animate-pulse">
            🎙️ Dictée en cours — parlez en chinois ou en français
          </p>
        )}
      </div>

      <Navigation />
    </div>
  );
}
