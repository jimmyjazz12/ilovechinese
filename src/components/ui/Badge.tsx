"use client";

type BadgeVariant = "default" | "glow" | "outline";

interface BadgeProps {
  level: number;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

interface HskColorConfig {
  bg: string;
  border: string;
  glow: string;
  text: string;
}

const hskColors: Record<number, HskColorConfig> = {
  1: { bg: "#58CC02", border: "#4CAD00", glow: "rgba(88,204,2,0.3)", text: "#fff" },
  2: { bg: "#1CB0F6", border: "#1899D6", glow: "rgba(28,176,246,0.3)", text: "#fff" },
  3: { bg: "#FF9600", border: "#d67e00", glow: "rgba(255,150,0,0.3)", text: "#fff" },
  4: { bg: "#CE82FF", border: "#a95ee6", glow: "rgba(206,130,255,0.3)", text: "#fff" },
  5: { bg: "#e04998", border: "#c03080", glow: "rgba(224,73,152,0.3)", text: "#fff" },
  6: { bg: "#cc3c3c", border: "#a82e2e", glow: "rgba(204,60,60,0.3)", text: "#fff" },
  7: { bg: "#6b7280", border: "#4b5563", glow: "rgba(107,114,128,0.3)", text: "#fff" },
  8: { bg: "#4b5563", border: "#374151", glow: "rgba(75,85,99,0.3)", text: "#fff" },
  9: { bg: "#374151", border: "#1f2937", glow: "rgba(55,65,81,0.3)", text: "#fff" },
};

const fallbackColor: HskColorConfig = {
  bg: "#6b7280", border: "#4b5563", glow: "rgba(107,114,128,0.3)", text: "#fff",
};

export default function Badge({
  level,
  variant = "default",
  pulse = false,
  className = "",
}: BadgeProps) {
  const color = hskColors[level] ?? fallbackColor;

  const baseClasses = [
    "inline-flex items-center justify-center",
    "px-3 py-1 rounded-full",
    "text-xs font-extrabold tracking-wider",
    "transition-all duration-200 ease-out",
    "select-none",
  ].join(" ");

  const variantStyle = (() => {
    switch (variant) {
      case "glow":
        return {
          background: color.bg,
          color: color.text,
          boxShadow: `0 0 12px ${color.glow}, 0 0 24px ${color.glow.replace("0.3", "0.1")}`,
        };
      case "outline":
        return {
          background: "transparent",
          color: color.bg,
          border: `2px solid ${color.bg}`,
          boxShadow: "none",
        };
      default:
        return {
          background: color.bg,
          color: color.text,
          boxShadow: `0 2px 6px ${color.glow.replace("0.3", "0.2")}`,
        };
    }
  })();

  return (
    <span
      className={`
        ${baseClasses}
        ${pulse ? "animate-pulse" : ""}
        ${className}
      `}
      style={variantStyle}
    >
      HSK{level}
    </span>
  );
}
