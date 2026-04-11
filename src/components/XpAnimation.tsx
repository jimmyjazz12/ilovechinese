"use client";

import { useEffect, useState } from "react";

interface XpAnimationProps {
  amount: number;
  trigger?: boolean;
  onComplete?: () => void;
  className?: string;
}

export default function XpAnimation({
  amount,
  trigger = true,
  onComplete,
  className = "",
}: XpAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 z-50 ${className}`}
    >
      <span className="animate-float-up inline-block text-3xl font-extrabold text-[var(--color-green)] drop-shadow-lg">
        +{amount} XP
      </span>
    </div>
  );
}
