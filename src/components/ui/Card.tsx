"use client";

import { ReactNode } from "react";

type CardVariant = "default" | "glass" | "gradient";

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  variant?: CardVariant;
  glowColor?: string;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: [
    "bg-[var(--color-card)] border border-[var(--color-border)]",
    "shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
    "hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-[3px]",
  ].join(" "),
  glass: [
    "bg-[rgba(26,44,52,0.6)] backdrop-blur-xl",
    "border border-[rgba(255,255,255,0.08)]",
    "shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
    "hover:bg-[rgba(26,44,52,0.75)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-[3px]",
    "hover:border-[rgba(255,255,255,0.12)]",
  ].join(" "),
  gradient: [
    "bg-[var(--color-card)]",
    "border border-transparent",
    "shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
    "hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-[3px]",
  ].join(" "),
};

export default function Card({
  children,
  header,
  footer,
  variant = "default",
  glowColor,
  className = "",
}: CardProps) {
  const glowStyle = glowColor
    ? { boxShadow: `0 0 20px ${glowColor}20, 0 0 40px ${glowColor}10` }
    : undefined;

  const isGradient = variant === "gradient";

  const cardContent = (
    <div
      className={`
        rounded-2xl overflow-hidden
        transition-all duration-300 ease-out
        ${variantStyles[variant]}
        ${className}
      `}
      style={glowStyle}
    >
      {header && (
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)]">
          {footer}
        </div>
      )}
    </div>
  );

  if (isGradient) {
    return (
      <div
        className="p-[1px] rounded-2xl bg-gradient-to-br from-[var(--color-green)] via-[var(--color-blue)] to-[var(--color-purple)] transition-all duration-300 ease-out"
      >
        {cardContent}
      </div>
    );
  }

  return cardContent;
}
