"use client";

import { useState, useEffect, useMemo } from "react";
import Navigation from "@/components/Navigation";
import ToneDisplay from "@/components/ToneDisplay";

import civilizationData from "@/data/civilization.json";
import { useChineseAudio } from "@/lib/useAudio";

interface CivilizationEntry {
  id: number;
  type: "histoire" | "culture";
  title: string;
  content: string;
  chinese_term: string;
  pinyin: string;
  category: string;
  fun_fact: string;
}

const allEntries = civilizationData as CivilizationEntry[];

const categoryLabels: Record<string, string> = {
  nombres: "Nombres",
  couleurs: "Couleurs",
  "fêtes": "Fetes",
  histoire: "Histoire",
  philosophie: "Philosophie",
  "écriture": "Ecriture",
  gastronomie: "Gastronomie",
  arts: "Arts",
  traditions: "Traditions",
  "géographie": "Geographie",
  langue: "Langue",
  "société": "Societe",
};

const categoryIcons: Record<string, string> = {
  nombres: "🔢",
  couleurs: "🎨",
  "fêtes": "🎊",
  histoire: "📜",
  philosophie: "🧘",
  "écriture": "✍️",
  gastronomie: "🍜",
  arts: "🎭",
  traditions: "🏮",
  "géographie": "🗺️",
  langue: "🗣️",
  "société": "👥",
};

type TabId = "aujourdhui" | "toutes" | "favoris";

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDailyEntries(): [CivilizationEntry, CivilizationEntry] {
  const day = getDayOfYear();
  const historyEntries = allEntries.filter((e) => e.type === "histoire");
  const cultureEntries = allEntries.filter((e) => e.type === "culture");

  const historyIdx = day % historyEntries.length;
  const cultureIdx = day % cultureEntries.length;

  return [historyEntries[historyIdx], cultureEntries[cultureIdx]];
}

export default function CivilizationPage() {
  const [activeTab, setActiveTab] = useState<TabId>("aujourdhui");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("civilization-favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      localStorage.setItem("civilization-favorites", JSON.stringify(next));
      return next;
    });
  };

  const speak = useChineseAudio();

  const dailyEntries = useMemo(() => getDailyEntries(), []);

  const categories = useMemo(() => {
    const cats = new Set(allEntries.map((e) => e.category));
    return Array.from(cats).sort();
  }, []);

  const filteredEntries = useMemo(() => {
    let entries = allEntries;

    if (activeTab === "favoris") {
      entries = entries.filter((e) => favorites.includes(e.id));
    }

    if (selectedCategory !== "all") {
      entries = entries.filter((e) => e.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.chinese_term.includes(q) ||
          e.fun_fact.toLowerCase().includes(q)
      );
    }

    return entries;
  }, [activeTab, favorites, selectedCategory, searchQuery]);

  const groupedEntries = useMemo(() => {
    if (activeTab !== "toutes" || selectedCategory !== "all") return null;
    const groups: Record<string, CivilizationEntry[]> = {};
    filteredEntries.forEach((e) => {
      if (!groups[e.category]) groups[e.category] = [];
      groups[e.category].push(e);
    });
    return groups;
  }, [activeTab, selectedCategory, filteredEntries]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "aujourdhui", label: "Aujourd'hui" },
    { id: "toutes", label: "Toutes" },
    { id: "favoris", label: "Favoris" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F7F7F5" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b px-4 py-3"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "#E5E7EB",
        }}
      >
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold mb-3" style={{ color: "#1A1A1A" }}>
            🏯 Civilisation
          </h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setExpandedId(null);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "text-white"
                    : "bg-white text-[#6B7280] hover:bg-gray-100"
                }`}
                style={
                  activeTab === tab.id
                    ? { backgroundColor: "#D97706" }
                    : {}
                }
              >
                {tab.label}
                {tab.id === "favoris" && favorites.length > 0 && (
                  <span className="ml-1.5 bg-white/30 text-xs px-1.5 py-0.5 rounded-full">
                    {favorites.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & filter for toutes and favoris */}
          {activeTab !== "aujourdhui" && (
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="flex-1 px-3 py-1.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-amber-300"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#1A1A1A",
                  background: "#FFFFFF",
                }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm border outline-none font-medium"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#1A1A1A",
                  background: "#FFFFFF",
                }}
              >
                <option value="all">Toutes categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryIcons[cat] || ""} {categoryLabels[cat] || cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Aujourd'hui tab */}
        {activeTab === "aujourdhui" && (
          <div className="space-y-4">
            <p
              className="text-sm font-medium mb-4"
              style={{ color: "#6B7280" }}
            >
              Vos anecdotes du jour pour decouvrir la Chine
            </p>
            {dailyEntries.map((entry) => (
              <AnecdoteCard
                key={entry.id}
                entry={entry}
                isFavorite={favorites.includes(entry.id)}
                onToggleFavorite={() => toggleFavorite(entry.id)}
                onSpeak={speak}
                expanded={true}
              />
            ))}
          </div>
        )}

        {/* Toutes tab - grouped or filtered */}
        {activeTab === "toutes" && (
          <div className="space-y-6">
            {groupedEntries ? (
              Object.entries(groupedEntries)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, entries]) => (
                  <div key={category}>
                    <h2
                      className="text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2"
                      style={{ color: "#6B7280" }}
                    >
                      <span>{categoryIcons[category] || ""}</span>
                      {categoryLabels[category] || category}
                      <span
                        className="text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{
                          background: "#E5E7EB",
                          color: "#6B7280",
                        }}
                      >
                        {entries.length}
                      </span>
                    </h2>
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <AnecdoteCard
                          key={entry.id}
                          entry={entry}
                          isFavorite={favorites.includes(entry.id)}
                          onToggleFavorite={() => toggleFavorite(entry.id)}
                          onSpeak={speak}
                          expanded={expandedId === entry.id}
                          onToggleExpand={() =>
                            setExpandedId(
                              expandedId === entry.id ? null : entry.id
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))
            ) : (
              <div className="space-y-3">
                {filteredEntries.length === 0 ? (
                  <div
                    className="text-center py-12 text-sm"
                    style={{ color: "#6B7280" }}
                  >
                    Aucune anecdote trouvee.
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <AnecdoteCard
                      key={entry.id}
                      entry={entry}
                      isFavorite={favorites.includes(entry.id)}
                      onToggleFavorite={() => toggleFavorite(entry.id)}
                      onSpeak={speak}
                      expanded={expandedId === entry.id}
                      onToggleExpand={() =>
                        setExpandedId(
                          expandedId === entry.id ? null : entry.id
                        )
                      }
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Favoris tab */}
        {activeTab === "favoris" && (
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div
                className="text-center py-12"
                style={{ color: "#6B7280" }}
              >
                <div className="text-4xl mb-3">💛</div>
                <p className="text-sm font-medium">Aucun favori pour le moment</p>
                <p className="text-xs mt-1">
                  Appuyez sur le coeur pour sauvegarder vos anecdotes preferees
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <AnecdoteCard
                  key={entry.id}
                  entry={entry}
                  isFavorite={favorites.includes(entry.id)}
                  onToggleFavorite={() => toggleFavorite(entry.id)}
                  onSpeak={speak}
                  expanded={expandedId === entry.id}
                  onToggleExpand={() =>
                    setExpandedId(
                      expandedId === entry.id ? null : entry.id
                    )
                  }
                />
              ))
            )}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}

function AnecdoteCard({
  entry,
  isFavorite,
  onToggleFavorite,
  onSpeak,
  expanded = false,
  onToggleExpand,
}: {
  entry: CivilizationEntry;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSpeak: (text: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const isHistoire = entry.type === "histoire";

  return (
    <div
      className="rounded-xl border overflow-hidden animate-fade-in hover-lift"
      style={{
        background: "#FFFFFF",
        borderColor: "#E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {/* Card header */}
      <div
        className={`px-4 py-3 ${onToggleExpand ? "cursor-pointer" : ""}`}
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Type badge */}
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                style={
                  isHistoire
                    ? { background: "#DBEAFE", color: "#1D4ED8" }
                    : { background: "#FFEDD5", color: "#C2410C" }
                }
              >
                {isHistoire ? "Histoire" : "Culture"}
              </span>
              {/* Category badge */}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#F3F4F6", color: "#6B7280" }}
              >
                {categoryIcons[entry.category] || ""}{" "}
                {categoryLabels[entry.category] || entry.category}
              </span>
            </div>

            {/* Title */}
            <h3
              className="font-bold text-[15px] leading-snug"
              style={{ color: "#1A1A1A" }}
            >
              {entry.title}
            </h3>
          </div>

          {/* Favorite + expand */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-1.5 rounded-full transition-all active:scale-90"
              style={{
                color: isFavorite ? "#EF4444" : "#D1D5DB",
              }}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            {onToggleExpand && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
                className={`transition-transform duration-300 ${
                  expanded ? "rotate-180" : ""
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-3 animate-fade-in"
          style={{ borderTop: "1px solid #F3F4F6" }}
        >
          {/* Content paragraphs */}
          <div className="pt-3">
            {entry.content.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed mb-2"
                style={{ color: "#374151" }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Chinese term section */}
          <div
            className="rounded-lg p-3"
            style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSpeak(entry.chinese_term)}
                className="btn-3d shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#58CC02", color: "#FFFFFF" }}
                aria-label="Ecouter la prononciation"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
              <div>
                <span
                  className="chinese-char text-2xl font-bold"
                  style={{ color: "#1A1A1A" }}
                >
                  {entry.chinese_term}
                </span>
                <div className="mt-0.5">
                  <ToneDisplay pinyin={entry.pinyin} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Fun fact */}
          <div
            className="rounded-lg p-3 flex gap-2"
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
            }}
          >
            <span className="text-lg shrink-0">💡</span>
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: "#92400E" }}
            >
              {entry.fun_fact}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
