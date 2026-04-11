"use client";

import { useEffect, useState, useMemo } from "react";

interface XpAnimationProps {
  amount: number;
  trigger?: boolean;
  onComplete?: () => void;
  className?: string;
}

interface Particle {
  id: number;
  tx: number;
  ty: number;
  size: number;
  delay: number;
  type: "star" | "sparkle" | "circle";
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    tx: (Math.random() - 0.5) * 160,
    ty: -40 - Math.random() * 80,
    size: 6 + Math.random() * 10,
    delay: Math.random() * 0.3,
    type: (["star", "sparkle", "circle"] as const)[i % 3],
  }));
}

function ParticleSvg({ type, size }: { type: string; size: number }) {
  if (type === "star") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  if (type === "sparkle") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
      </svg>
    );
  }
  return (
    <div
      style={{
        width: size * 0.5,
        height: size * 0.5,
        borderRadius: "50%",
        background: "currentColor",
      }}
    />
  );
}

export default function XpAnimation({
  amount,
  trigger = true,
  onComplete,
  className = "",
}: XpAnimationProps) {
  const [visible, setVisible] = useState(false);
  const particles = useMemo(() => generateParticles(10), []);

  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1800);
    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 z-50 ${className}`}
    >
      {/* Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 animate-sparkle-float"
          style={{
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            animationDelay: `${p.delay}s`,
            color: p.id % 2 === 0 ? "var(--color-green)" : "#FFD700",
            filter: "drop-shadow(0 0 4px currentColor)",
          } as React.CSSProperties}
        >
          <ParticleSvg type={p.type} size={p.size} />
        </span>
      ))}

      {/* Main XP text */}
      <span
        className="animate-float-up inline-block text-4xl font-black drop-shadow-lg"
        style={{
          background: "linear-gradient(135deg, var(--color-green), #FFD700)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 2px 8px rgba(88, 204, 2, 0.4))",
        }}
      >
        +{amount} XP
      </span>
    </div>
  );
}
