/**
 * HSK Level Progression System
 *
 * A word is "mastered" when box_level >= 6 in SRS progress.
 * When 80%+ of words in the current HSK level are mastered,
 * the user can take a level test (30 questions).
 * Scoring >= 80% on the test promotes the user to the next level.
 */

interface SrsEntry {
  box_level: number;
  [key: string]: unknown;
}

interface WordEntry {
  simplified: string;
  hsk_level: number;
  [key: string]: unknown;
}

export interface HskProgress {
  total: number;
  mastered: number;
  percentage: number;
}

/**
 * Get mastery progress for a specific HSK level.
 * A word is mastered when box_level >= 6.
 */
export function getHskProgress(
  hskLevel: number,
  srsProgress: Record<string, SrsEntry>,
  allWords: WordEntry[]
): HskProgress {
  const levelWords = allWords.filter((w) => w.hsk_level === hskLevel);
  const total = levelWords.length;

  let mastered = 0;
  for (const word of levelWords) {
    const prog = srsProgress[word.simplified];
    if (prog && (prog.box_level ?? 0) >= 6) {
      mastered++;
    }
  }

  const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return { total, mastered, percentage };
}

/**
 * Check if the user is ready to take the HSK level test.
 * Requires >= 80% of words mastered at the given level.
 */
export function isReadyForTest(
  hskLevel: number,
  srsProgress: Record<string, SrsEntry>,
  allWords: WordEntry[]
): boolean {
  const { percentage } = getHskProgress(hskLevel, srsProgress, allWords);
  return percentage >= 80;
}

/**
 * Get all active HSK levels (1 through currentLevel).
 */
export function getActiveHskLevels(currentLevel: number): number[] {
  const levels: number[] = [];
  for (let i = 1; i <= currentLevel; i++) {
    levels.push(i);
  }
  return levels;
}

/**
 * Auto-detect the user's current level based on mastery.
 * Finds the highest level where >= 80% of words are mastered,
 * then returns the next level (capped at max available).
 */
export function calculateCurrentLevel(
  srsProgress: Record<string, SrsEntry>,
  allWords: WordEntry[],
  maxLevel: number = 4
): number {
  let highestMastered = 0;

  for (let level = 1; level <= maxLevel; level++) {
    const { percentage } = getHskProgress(level, srsProgress, allWords);
    if (percentage >= 80) {
      highestMastered = level;
    } else {
      break;
    }
  }

  return Math.min(highestMastered + 1, maxLevel);
}
