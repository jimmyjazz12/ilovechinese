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
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 ${className}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[var(--color-green)] text-white rounded-br-sm"
            : "bg-[var(--color-card)] border border-[var(--color-border)] text-white rounded-bl-sm"
        }`}
      >
        {pinyin && (
          <div className="mb-1">
            <ToneDisplay pinyin={pinyin} size="sm" />
          </div>
        )}
        <p className={`text-sm leading-relaxed ${pinyin ? "chinese-char text-lg" : ""}`}>
          {content}
        </p>
        {timestamp && (
          <p
            className={`text-[10px] mt-1 ${
              isUser ? "text-white/60" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
