import { UserProgress } from './types'

// ── Leitner 7-box system intervals (in minutes) ──

const BOX_INTERVALS_MINUTES: Record<number, number> = {
  0: 0,           // Box 0: Immediate (never seen / failed)
  1: 240,         // Box 1: 4 hours
  2: 1440,        // Box 2: 1 day
  3: 4320,        // Box 3: 3 days
  4: 10080,       // Box 4: 7 days
  5: 20160,       // Box 5: 14 days
  6: 43200,       // Box 6: 30 days
  7: 129600,      // Box 7: 90 days
}

const MAX_BOX = 7

// ── Box labels (French) ──

const BOX_LABELS: Record<number, string> = {
  0: 'Nouveau',
  1: 'Decouverte',
  2: 'Court terme',
  3: 'Apprentissage',
  4: 'Revision',
  5: 'Consolidation',
  6: 'Long terme',
  7: 'Maitrise',
}

const BOX_COLORS: Record<number, string> = {
  0: '#AFAFAF',   // grey
  1: '#FF4B4B',   // red
  2: '#FF9600',   // orange
  3: '#FFC800',   // yellow
  4: '#58CC02',   // green
  5: '#1CB0F6',   // blue
  6: '#CE82FF',   // purple
  7: '#FFD700',   // gold
}

// ── SM-2 + Leitner hybrid next review calculation ──

export function calculateNextReview(
  currentProgress: Pick<
    UserProgress,
    | 'tone_mastery'
    | 'pinyin_mastery'
    | 'character_mastery'
    | 'overall_mastery'
    | 'box_level'
    | 'correct_count'
    | 'incorrect_count'
    | 'streak'
    | 'easiness_factor'
    | 'interval_days'
  >,
  quality: number
): {
  overall_mastery: number
  box_level: number
  correct_count: number
  incorrect_count: number
  streak: number
  easiness_factor: number
  interval_days: number
  next_review: string
} {
  const q = Math.max(0, Math.min(5, Math.round(quality)))

  // Update easiness factor (SM-2 formula)
  let ef = currentProgress.easiness_factor
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ef = Math.max(1.3, ef)

  let boxLevel = currentProgress.box_level ?? 0
  let streak = currentProgress.streak
  let correctCount = currentProgress.correct_count
  let incorrectCount = currentProgress.incorrect_count

  if (q >= 3) {
    // Correct answer → move up one box (max 7)
    correctCount += 1
    streak += 1
    boxLevel = Math.min(MAX_BOX, boxLevel + 1)
  } else {
    // Wrong answer → move down to max(current-2, 0) (gentler reset)
    incorrectCount += 1
    streak = 0
    boxLevel = Math.max(0, boxLevel - 2)
  }

  // overall_mastery maps from box_level (0-7 → 0-5 mastery scale)
  const overallMastery = Math.min(5, Math.floor((boxLevel / MAX_BOX) * 5))

  // Determine interval from box level
  const baseMinutes = BOX_INTERVALS_MINUTES[boxLevel] ?? 0

  // Apply easiness factor for boxes >= 3
  const adjustedMinutes =
    boxLevel >= 3 ? Math.round(baseMinutes * ef) : baseMinutes

  const intervalDays = adjustedMinutes / 1440

  // Calculate next review date
  const nextReview = new Date(Date.now() + adjustedMinutes * 60 * 1000)

  return {
    overall_mastery: overallMastery,
    box_level: boxLevel,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    streak,
    easiness_factor: ef,
    interval_days: intervalDays,
    next_review: nextReview.toISOString(),
  }
}

// ── Box helpers ──

export function getBoxLabel(box: number): string {
  return BOX_LABELS[box] ?? 'Inconnu'
}

export function getBoxColor(box: number): string {
  return BOX_COLORS[box] ?? '#AFAFAF'
}

// ── Mastery helpers (kept for backward compatibility) ──

const MASTERY_LABELS: Record<number, string> = {
  0: 'Inconnu',
  1: 'Vu',
  2: 'Familier',
  3: 'Appris',
  4: 'Pratique',
  5: 'Maitrise',
}

const MASTERY_COLORS: Record<number, string> = {
  0: '#AFAFAF',
  1: '#FF9600',
  2: '#FFC800',
  3: '#58CC02',
  4: '#1CB0F6',
  5: '#CE82FF',
}

export function getMasteryLabel(level: number): string {
  return MASTERY_LABELS[level] ?? 'Inconnu'
}

export function getMasteryColor(level: number): string {
  return MASTERY_COLORS[level] ?? '#AFAFAF'
}

/**
 * A word is considered fully mastered when box >= 6 AND
 * tone_mastery, pinyin_mastery, character_mastery are all >= 4.
 */
export function isWordMastered(
  progress: Pick<
    UserProgress,
    'tone_mastery' | 'pinyin_mastery' | 'character_mastery' | 'box_level'
  >
): boolean {
  return (
    (progress.box_level ?? 0) >= 6 &&
    progress.tone_mastery >= 4 &&
    progress.pinyin_mastery >= 4 &&
    progress.character_mastery >= 4
  )
}

/**
 * Get all words that are due for review now.
 */
export function getWordsToReview(
  allProgress: Record<string, Pick<UserProgress, 'next_review' | 'box_level'>>
): string[] {
  const now = new Date().toISOString()
  return Object.entries(allProgress)
    .filter(([, p]) => p.next_review <= now)
    .sort((a, b) => (a[1].box_level ?? 0) - (b[1].box_level ?? 0)) // lowest box first
    .map(([key]) => key)
}

/**
 * Count words per box level.
 */
export function getWordsByBox(
  allProgress: Record<string, Pick<UserProgress, 'box_level'>>
): Record<number, number> {
  const counts: Record<number, number> = {}
  for (let i = 0; i <= MAX_BOX; i++) counts[i] = 0
  for (const p of Object.values(allProgress)) {
    const box = p.box_level ?? 0
    counts[box] = (counts[box] || 0) + 1
  }
  return counts
}

/**
 * Total number of words due for review now.
 */
export function getDueCount(
  allProgress: Record<string, Pick<UserProgress, 'next_review'>>
): number {
  const now = new Date().toISOString()
  return Object.values(allProgress).filter((p) => p.next_review <= now).length
}
