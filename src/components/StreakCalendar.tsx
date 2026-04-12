"use client";

import { useState, useEffect, useMemo } from "react";

interface DayData {
  xp: number;
  completed: boolean;
}

type StudyCalendar = Record<string, DayData>;

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDayLabel(dayIndex: number): string {
  return ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][dayIndex];
}

function getMonthLabel(month: number): string {
  return [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
  ][month];
}

function getCellColor(day: DayData | undefined): string {
  if (!day || day.xp === 0) return "bg-[#E5E7EB]";
  if (day.completed) return "bg-[#2D8A0E]";
  if (day.xp >= 25) return "bg-[#58CC02]";
  return "bg-[#A8E06C]";
}

function getCellTooltipLabel(day: DayData | undefined): string {
  if (!day || day.xp === 0) return "Pas d'activité";
  if (day.completed) return "Plan complété";
  if (day.xp >= 25) return "> 50% du plan";
  return "Un peu d'activité";
}

export default function StreakCalendar() {
  const [calendar, setCalendar] = useState<StudyCalendar>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("study_calendar");
    if (saved) {
      try {
        setCalendar(JSON.parse(saved));
      } catch {
        /* ignore corrupt data */
      }
    }
  }, []);

  // Build last 35 days grid (5 rows x 7 cols, Mon-Sun)
  const { days, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the most recent Sunday (end of grid)
    const endDate = new Date(today);

    // Go back 34 days from today to get a ~5 week window
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 34);

    // Adjust startDate back to the previous Monday
    const startDow = startDate.getDay(); // 0=Sun
    const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
    startDate.setDate(startDate.getDate() + mondayOffset);

    // Adjust endDate forward to Sunday
    const endDow = endDate.getDay();
    if (endDow !== 0) {
      endDate.setDate(endDate.getDate() + (7 - endDow));
    }

    const result: { date: Date; key: string }[] = [];
    const labels: { label: string; col: number }[] = [];
    const cursor = new Date(startDate);
    let prevMonth = -1;

    while (cursor <= endDate) {
      const col = Math.floor(result.length / 7);
      if (cursor.getMonth() !== prevMonth) {
        labels.push({ label: getMonthLabel(cursor.getMonth()), col });
        prevMonth = cursor.getMonth();
      }
      result.push({ date: new Date(cursor), key: formatDate(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { days: result, monthLabels: labels };
  }, []);

  // Calculate streaks
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = 0;
    const d = new Date(today);

    // Check today first
    const todayKey = formatDate(d);
    if (calendar[todayKey] && calendar[todayKey].xp > 0) {
      current = 1;
      d.setDate(d.getDate() - 1);
    }

    // Walk backwards
    while (true) {
      const key = formatDate(d);
      if (calendar[key] && calendar[key].xp > 0) {
        current++;
        d.setDate(d.getDate() - 1);
      } else {
        // If today had no activity, check if yesterday starts a streak
        if (current === 0) {
          d.setDate(d.getDate() - 1);
          const yKey = formatDate(d);
          if (calendar[yKey] && calendar[yKey].xp > 0) {
            current = 1;
            d.setDate(d.getDate() - 1);
            while (true) {
              const k = formatDate(d);
              if (calendar[k] && calendar[k].xp > 0) {
                current++;
                d.setDate(d.getDate() - 1);
              } else break;
            }
          }
        }
        break;
      }
    }
    setStreak(current);

    // Best streak
    const allDates = Object.keys(calendar).filter(k => calendar[k].xp > 0).sort();
    let best = 0;
    let run = 0;
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        run = 1;
      } else {
        const prev = new Date(allDates[i - 1]);
        const curr = new Date(allDates[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        run = diff === 1 ? run + 1 : 1;
      }
      best = Math.max(best, run);
    }
    setBestStreak(best);
  }, [calendar]);

  const todayKey = formatDate(new Date());
  const numCols = Math.ceil(days.length / 7);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-card animate-fade-in">
      {/* Streak header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-xs text-[#6B7280] uppercase tracking-widest">
          Calendrier d&apos;activité
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#FF9600]/10 px-2.5 py-1 rounded-full">
            <span className="text-sm">🔥</span>
            <span className="font-bold text-xs text-[#FF9600]">{streak}j</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#CE82FF]/10 px-2.5 py-1 rounded-full">
            <span className="text-[10px]">🏆</span>
            <span className="font-bold text-xs text-[#CE82FF]">{bestStreak}j</span>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-0 mb-1 ml-9" style={{ width: `${numCols * 18}px` }}>
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="text-[10px] text-[#6B7280] font-medium absolute"
            style={{ left: `${36 + m.col * 18}px` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="flex gap-1 relative mt-5">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="h-[14px] flex items-center justify-end pr-1"
            >
              {row % 2 === 0 && (
                <span className="text-[9px] text-[#6B7280] font-medium">
                  {getDayLabel(row)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day squares — columns are weeks, rows are days of week */}
        <div className="flex gap-[3px]">
          {Array.from({ length: numCols }).map((_, col) => (
            <div key={col} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, row) => {
                const idx = col * 7 + row;
                if (idx >= days.length) {
                  return <div key={row} className="w-[14px] h-[14px]" />;
                }
                const { key } = days[idx];
                const dayData = calendar[key];
                const isToday = key === todayKey;
                const isSelected = key === selectedDay;
                const isFuture = new Date(key) > new Date();

                if (isFuture) {
                  return <div key={row} className="w-[14px] h-[14px]" />;
                }

                return (
                  <button
                    key={row}
                    onClick={() => setSelectedDay(isSelected ? null : key)}
                    className={`w-[14px] h-[14px] rounded-[3px] transition-all duration-150 ${getCellColor(dayData)} ${
                      isToday ? "ring-2 ring-[#1A1A1A] ring-offset-1" : ""
                    } ${isSelected ? "ring-2 ring-[#1CB0F6] ring-offset-1" : ""} hover:scale-125`}
                    title={`${key}: ${dayData ? dayData.xp + " XP" : "Pas d'activité"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[9px] text-[#6B7280]">Moins</span>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#E5E7EB]" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#A8E06C]" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#58CC02]" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#2D8A0E]" />
        <span className="text-[9px] text-[#6B7280]">Plus</span>
      </div>

      {/* Selected day tooltip */}
      {selectedDay && (
        <div className="mt-3 bg-[#F7F7F5] rounded-xl px-4 py-2.5 flex items-center justify-between animate-fade-in">
          <div>
            <span className="text-xs text-[#6B7280] font-medium">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#1A1A1A]">
              {calendar[selectedDay]?.xp ?? 0} XP
            </span>
            <span className="text-[10px] text-[#6B7280]">
              {getCellTooltipLabel(calendar[selectedDay])}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
