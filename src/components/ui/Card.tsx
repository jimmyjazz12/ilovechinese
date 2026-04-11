import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function Card({ children, header, footer, className = "" }: CardProps) {
  return (
    <div
      className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden ${className}`}
    >
      {header && (
        <div className="px-5 py-3 border-b border-[var(--color-border)]">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[var(--color-border)]">
          {footer}
        </div>
      )}
    </div>
  );
}
