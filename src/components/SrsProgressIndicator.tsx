interface SrsProgressIndicatorProps {
  level: number; // 0-5
  showLabel?: boolean;
  className?: string;
}

const labels = [
  "Inconnu",
  "Vu",
  "Apprentissage",
  "Familier",
  "Bon",
  "Maitrise",
];

const dotColors = [
  "bg-[var(--color-red)]",
  "bg-[var(--color-orange)]",
  "bg-yellow-400",
  "bg-[var(--color-blue)]",
  "bg-[var(--color-green)]",
  "bg-[var(--color-green)]",
];

export default function SrsProgressIndicator({
  level,
  showLabel = true,
  className = "",
}: SrsProgressIndicatorProps) {
  const clamped = Math.min(5, Math.max(0, level));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < clamped ? dotColors[clamped] : "bg-[var(--color-border)]"
            }`}
          />
        ))}
      </div>
      {showLabel && (
        <span
          className="text-xs font-semibold"
          style={{
            color: clamped <= 1 ? "var(--color-red)" : clamped <= 3 ? "var(--color-orange)" : "var(--color-green)",
          }}
        >
          {labels[clamped]}
        </span>
      )}
    </div>
  );
}
