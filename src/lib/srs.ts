import { UserProgress, MasteryLevel } from './types'

// ── Intervals (in minutes) for each successive review step ──

const INTERVALS_MINUTES = [
  1,          // step 0 → 1 minute
  10,         // step 1 → 10 minutes
  1440,       // step 2 → 1 day
  4320,       // step 3 → 3 days
  10080,      // step 4 → 7 days
  20160,      // step 5 → 14 days
  43200,      // step 6 → 30 days
  129600,     // step 7 → 90 days
]

// ── SM-2 based next review calculation ──

/**
 * Calculate the next review state based on the quality of the answer.
 *
 * @param currentProgress - The current user progress for this word.
 * @param quality - Quality of the answer: 0 (total fail) to 5 (perfect).
 * @returns A partial UserProgress with updated fields.
 */
export function calculateNextReview(
  currentProgress: Pick<
    UserProgress,
    | 'tone_mastery'
    | 'pinyin_mastery'
    | 'character_mastery'
    | 'overall_mastery'
    | 'correct_count'
    | 'incorrect_count'
    | 'streak'
    | 'easiness_factor'
    | 'interval_days'
  >,
  quality: number
): {
  overall_mastery: number
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

  let newMastery = currentProgress.overall_mastery
  let streak = currentProgress.streak
  let correctCount = currentProgress.correct_count
  let incorrectCount = currentProgress.incorrect_count

  if (q >= 3) {
    // Correct answer
    correctCount += 1
    streak += 1
    if (newMastery < MasteryLevel.Mastered) {
      newMastery = Math.min(MasteryLevel.Mastered, newMastery + 1)
    }
  } else {
    // Incorrect answer
    incorrectCount += 1
    streak = 0
    if (q <= 1) {
      newMastery = Math.max(MasteryLevel.Unknown, newMastery - 1)
    }
  }

  // Determine interval step from mastery level
  const step = Math.min(newMastery, INTERVALS_MINUTES.length - 1)
  const intervalMinutes = INTERVALS_MINUTES[step]

  // Apply easiness factor for higher mastery steps
  const adjustedMinutes =
    step >= 3 ? Math.round(intervalMinutes * ef) : intervalMinutes

  const intervalDays = adjustedMinutes / 1440

  // Calculate next review date
  const nextReview = new Date(Date.now() + adjustedMinutes * 60 * 1000)

  return {
    overall_mastery: newMastery,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    streak,
    easiness_factor: ef,
    interval_days: intervalDays,
    next_review: nextReview.toISOString(),
  }
}

// ── Mastery helpers ──

const MASTERY_LABELS: Record<number, string> = {
  [MasteryLevel.Unknown]: 'Inconnu',
  [MasteryLevel.Seen]: 'Vu',
  [MasteryLevel.Familiar]: 'Familier',
  [MasteryLevel.Learned]: 'Appris',
  [MasteryLevel.Practiced]: 'Pratique',
  [MasteryLevel.Mastered]: 'Maitrise',
}

const MASTERY_COLORS: Record<number, string> = {
  [MasteryLevel.Unknown]: '#AFAFAF',
  [MasteryLevel.Seen]: '#FF9600',
  [MasteryLevel.Familiar]: '#FFC800',
  [MasteryLevel.Learned]: '#58CC02',
  [MasteryLevel.Practiced]: '#1CB0F6',
  [MasteryLevel.Mastered]: '#CE82FF',
}

export function getMasteryLabel(level: number): string {
  return MASTERY_LABELS[level] ?? 'Inconnu'
}

export function getMasteryColor(level: number): string {
  return MASTERY_COLORS[level] ?? '#AFAFAF'
}

/**
 * A word is considered fully mastered only when tone, pinyin, and character
 * mastery are all at the Mastered level (5).
 */
export function isWordMastered(
  progress: Pick<
    UserProgress,
    'tone_mastery' | 'pinyin_mastery' | 'character_mastery'
  >
): boolean {
  return (
    progress.tone_mastery >= MasteryLevel.Mastered &&
    progress.pinyin_mastery >= MasteryLevel.Mastered &&
    progress.character_mastery >= MasteryLevel.Mastered
  )
}
