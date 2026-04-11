"use client";

import { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import ChatMessage from "@/components/ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("chat_history");
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessages = (msgs: Message[]) => {
    localStorage.setItem("chat_history", JSON.stringify(msgs));
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
      // Get user context from localStorage
      const stats = JSON.parse(localStorage.getItem("user_stats") || "{}");
      const progress = JSON.parse(localStorage.getItem("srs_progress") || "{}");

      const masteredWords = Object.entries(progress)
        .filter(([, p]: [string, any]) => p.mastery_level >= 4)
        .map(([word]) => word);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.slice(-20).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            hsk_level: stats.current_hsk_level || 1,
            words_mastered: masteredWords.length,
            mastered_list: masteredWords.slice(0, 50),
            xp_total: stats.xp_total || 0,
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

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chat_history");
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
            className="text-xs text-[#9EAAB4] hover:text-[#FF4B4B] transition-colors"
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
            <p className="text-[#9EAAB4] text-sm max-w-xs mx-auto">
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
                  className="bg-gradient-card border border-white/5 rounded-xl shadow-card hover-lift px-3 py-2 text-xs text-[#9EAAB4] hover:border-[#1CB0F6] transition-all"
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
            <div className="flex items-center gap-2 text-[#9EAAB4]">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#9EAAB4] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#9EAAB4] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#9EAAB4] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs">Prof Wang écrit...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="sticky bottom-16 glass-dark border-t border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-[#1A2C34] rounded-xl px-4 py-2.5 text-sm placeholder-[#9EAAB4] input-focus"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="btn-3d bg-[#1CB0F6] hover:bg-[#1899D6] disabled:bg-[#2A4050] text-white font-bold px-4 py-2.5 rounded-xl"
          >
            ↑
          </button>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
