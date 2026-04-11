"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-green)] text-white border-b-4 border-[var(--color-green-dark)] hover:brightness-110 active:border-b-0 active:translate-y-[4px]",
  secondary:
    "bg-[var(--color-blue)] text-white border-b-4 border-[var(--color-blue-dark)] hover:brightness-110 active:border-b-0 active:translate-y-[4px]",
  danger:
    "bg-[var(--color-red)] text-white border-b-4 border-[#cc3c3c] hover:brightness-110 active:border-b-0 active:translate-y-[4px]",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] border-2 border-[var(--color-border)] hover:bg-[var(--color-card)] active:translate-y-[1px]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm rounded-xl",
  md: "px-6 py-2.5 text-base rounded-2xl",
  lg: "px-8 py-3.5 text-lg rounded-2xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          font-bold uppercase tracking-wide transition-all duration-100 select-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${disabled ? "opacity-50 cursor-not-allowed !border-b-4 !translate-y-0" : "cursor-pointer"}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
