"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-gradient-to-b from-[#6BD613] to-[#4CAD00] text-white",
    "border-b-4 border-[var(--color-green-dark)]",
    "shadow-[0_2px_8px_rgba(88,204,2,0.25)]",
    "hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(88,204,2,0.4)]",
    "active:border-b-0 active:translate-y-[4px] active:shadow-[0_1px_4px_rgba(88,204,2,0.2)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
  ].join(" "),
  secondary: [
    "bg-gradient-to-b from-[#2DC3FF] to-[#1899D6] text-white",
    "border-b-4 border-[var(--color-blue-dark)]",
    "shadow-[0_2px_8px_rgba(28,176,246,0.25)]",
    "hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(28,176,246,0.4)]",
    "active:border-b-0 active:translate-y-[4px] active:shadow-[0_1px_4px_rgba(28,176,246,0.2)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
  ].join(" "),
  danger: [
    "bg-gradient-to-b from-[#FF6B6B] to-[#E03E3E] text-white",
    "border-b-4 border-[#cc3c3c]",
    "shadow-[0_2px_8px_rgba(255,75,75,0.25)]",
    "hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(255,75,75,0.4)]",
    "active:border-b-0 active:translate-y-[4px] active:shadow-[0_1px_4px_rgba(255,75,75,0.2)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--color-text-secondary)]",
    "border-2 border-[var(--color-border)]",
    "hover:bg-[var(--color-card)] hover:text-[var(--color-text)] hover:border-[var(--color-card-hover)] hover:scale-[1.02]",
    "active:translate-y-[1px] active:scale-100",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm rounded-xl gap-1.5",
  md: "px-6 py-2.5 text-base rounded-2xl gap-2",
  lg: "px-8 py-3.5 text-lg rounded-2xl gap-2.5",
};

const Spinner = ({ size }: { size: ButtonSize }) => {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <svg
      className={`${sizeClass} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          font-bold uppercase tracking-wide select-none
          transition-all duration-200 ease-out
          outline-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${isDisabled ? "opacity-50 cursor-not-allowed !border-b-4 !translate-y-0 !scale-100 !shadow-none" : "cursor-pointer"}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Spinner size={size} />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
