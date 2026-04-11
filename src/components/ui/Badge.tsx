interface BadgeProps {
  level: number;
  className?: string;
}

const hskColors: Record<number, string> = {
  1: "bg-[var(--color-green)] text-white",
  2: "bg-[var(--color-blue)] text-white",
  3: "bg-[var(--color-orange)] text-white",
  4: "bg-[var(--color-purple)] text-white",
  5: "bg-[#e04998] text-white",
  6: "bg-[#cc3c3c] text-white",
  7: "bg-gray-500 text-white",
  8: "bg-gray-600 text-white",
  9: "bg-gray-700 text-white",
};

export default function Badge({ level, className = "" }: BadgeProps) {
  const color = hskColors[level] ?? "bg-gray-500 text-white";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${color} ${className}`}
    >
      HSK{level}
    </span>
  );
}
