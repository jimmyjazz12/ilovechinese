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
    "bg-white border border-[#E5E7EB]",
    "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
    "hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-[3px]",
  ].join(" "),
  glass: [
    "bg-[rgba(255,255,255,0.8)] backdrop-blur-xl",
    "border border-[#E5E7EB]",
    "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
    "hover:bg-[rgba(255,255,255,0.95)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-[3px]",
  ].join(" "),
  gradient: [
    "bg-white",
    "border border-transparent",
    "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
    "hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-[3px]",
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
    ? { boxShadow: `0 0 20px ${glowColor}15, 0 0 40px ${glowColor}08` }
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
        <div className="px-5 py-3 border-b border-[#E5E7EB]">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[#E5E7EB]">
          {footer}
        </div>
      )}
    </div>
  );

  if (isGradient) {
    return (
      <div
        className="p-[1px] rounded-2xl bg-gradient-to-br from-[#58CC02] via-[#1CB0F6] to-[#CE82FF] transition-all duration-300 ease-out"
      >
        {cardContent}
      </div>
    );
  }

  return cardContent;
}
