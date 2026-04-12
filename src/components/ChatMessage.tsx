"use client";

import ToneDisplay from "./ToneDisplay";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  pinyin?: string;
  timestamp?: string;
  className?: string;
}

export default function ChatMessage({
  role,
  content,
  pinyin,
  timestamp,
  className = "",
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-slide-up ${className}`}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full mr-2.5 mt-1 flex items-center justify-center text-sm font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #1CB0F6, #CE82FF)",
            boxShadow: "0 0 0 2px rgba(28, 176, 246, 0.2)",
          }}
        >
          AI
        </div>
      )}

      <div
        className={`max-w-[80%] px-4 py-3 ${
          isUser ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"
        }`}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #58CC02, #4CAD00)",
                color: "white",
                boxShadow: "0 2px 8px rgba(88, 204, 2, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06)",
              }
            : {
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                color: "#1A1A1A",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              }
        }
      >
        {pinyin && (
          <div className="mb-1.5">
            <ToneDisplay pinyin={pinyin} size="sm" />
          </div>
        )}
        <p className={`text-sm leading-relaxed ${pinyin ? "chinese-char text-lg" : ""}`}>
          {content}
        </p>
        {timestamp && (
          <p
            className={`text-[11px] mt-1.5 font-medium ${
              isUser ? "text-white/70" : "text-[#6B7280]"
            }`}
          >
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
