"use client";

import { useState } from "react";

interface NavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const tabs: NavTab[] = [
  {
    id: "home",
    label: "Accueil",
    href: "/",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "vocabulary",
    label: "Vocabulaire",
    href: "/vocabulary",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    id: "review",
    label: "Revision",
    href: "/review",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: "translation",
    label: "Traduction",
    href: "/translation",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8l6 6" />
        <path d="M4 14l6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="M22 22l-5-10-5 10" />
        <path d="M14 18h6" />
      </svg>
    ),
  },
  {
    id: "grammar",
    label: "Grammaire",
    href: "/grammar",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="12" y2="17" />
      </svg>
    ),
  },
  {
    id: "teacher",
    label: "Prof",
    href: "/teacher",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [active, setActive] = useState(activeTab ?? "home");

  const handleTab = (tabId: string) => {
    setActive(tabId);
    onTabChange?.(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] border-t border-[var(--color-border)] safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors cursor-pointer ${
                isActive
                  ? "text-[var(--color-green)]"
                  : "text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              <div className={`transition-transform ${isActive ? "scale-110" : ""}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-[var(--color-green)] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
