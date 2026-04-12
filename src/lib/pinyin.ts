// ── Tone mark → tone number mapping ──

const TONE_MARKS: Record<string, { base: string; tone: number }> = {
  // a
  'ā': { base: 'a', tone: 1 },
  'á': { base: 'a', tone: 2 },
  'ǎ': { base: 'a', tone: 3 },
  'à': { base: 'a', tone: 4 },
  // e
  'ē': { base: 'e', tone: 1 },
  'é': { base: 'e', tone: 2 },
  'ě': { base: 'e', tone: 3 },
  'è': { base: 'e', tone: 4 },
  // i
  'ī': { base: 'i', tone: 1 },
  'í': { base: 'i', tone: 2 },
  'ǐ': { base: 'i', tone: 3 },
  'ì': { base: 'i', tone: 4 },
  // o
  'ō': { base: 'o', tone: 1 },
  'ó': { base: 'o', tone: 2 },
  'ǒ': { base: 'o', tone: 3 },
  'ò': { base: 'o', tone: 4 },
  // u
  'ū': { base: 'u', tone: 1 },
  'ú': { base: 'u', tone: 2 },
  'ǔ': { base: 'u', tone: 3 },
  'ù': { base: 'u', tone: 4 },
  // u-umlaut (ü)
  'ǖ': { base: 'ü', tone: 1 },
  'ǘ': { base: 'ü', tone: 2 },
  'ǚ': { base: 'ü', tone: 3 },
  'ǜ': { base: 'ü', tone: 4 },
}

// ── Public API ──

/**
 * Extract the tone number (1-5) from a pinyin syllable with tone marks.
 * Returns 5 for neutral / unmarked tone.
 *
 * Example: "nǐ" → 3, "ma" → 5
 */
export function getToneNumber(pinyinWithTone: string): number {
  for (const char of pinyinWithTone) {
    const entry = TONE_MARKS[char]
    if (entry) return entry.tone
  }
  return 5 // neutral tone
}

/**
 * Strip all tone marks from a pinyin string, replacing accented vowels with
 * their plain equivalents. Preserves ü as "v" (common romanization) or "ü".
 *
 * Example: "nǐ hǎo" → "ni hao"
 */
export function removeTones(pinyin: string): string {
  let result = ''
  for (const char of pinyin) {
    const entry = TONE_MARKS[char]
    if (entry) {
      result += entry.base
    } else {
      result += char
    }
  }
  return result
}

/**
 * Return the display color for a given tone number.
 *
 * 1 = red, 2 = orange, 3 = green, 4 = blue, 5 (neutral) = gray
 */
export function getToneColor(toneNumber: number): string {
  switch (toneNumber) {
    case 1:
      return '#FF4B4B'
    case 2:
      return '#F5A623'
    case 3:
      return '#58CC02'
    case 4:
      return '#1CB0F6'
    case 5:
    default:
      return '#9CA3AF'
  }
}

/**
 * Split a multi-syllable pinyin string into individual syllables.
 * Handles both space-separated ("nǐ hǎo") and concatenated ("nǐhǎo") forms.
 *
 * Example: "nǐ hǎo" → ["nǐ", "hǎo"]
 */
export function splitPinyin(pinyinString: string): string[] {
  // First, split on spaces / hyphens
  const parts = pinyinString
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)

  // If already space-separated, return directly
  if (parts.length > 1) return parts

  // Otherwise attempt to split concatenated pinyin by detecting tone-marked
  // vowels as syllable boundaries. This is a simplified splitter that covers
  // the most common cases.
  const single = parts[0]
  if (!single) return []

  const syllables: string[] = []
  let current = ''

  // Pinyin initials
  const INITIALS = new Set([
    'b', 'p', 'm', 'f',
    'd', 't', 'n', 'l',
    'g', 'k', 'h',
    'j', 'q', 'x',
    'zh', 'ch', 'sh', 'r',
    'z', 'c', 's',
    'y', 'w',
  ])

  let foundTone = false

  for (let i = 0; i < single.length; i++) {
    const char = single[i]
    const lower = char.toLowerCase()

    // Check if this character has a tone mark
    if (TONE_MARKS[char]) {
      foundTone = true
      current += char
      continue
    }

    // If we previously found a tone and now hit a consonant that starts a
    // new initial, split here.
    if (foundTone && /[bcdfghjklmnpqrstwxyz]/.test(lower)) {
      // Look ahead for two-character initials (zh, ch, sh)
      const twoChar = single.slice(i, i + 2).toLowerCase()
      if (['zh', 'ch', 'sh'].includes(twoChar) || INITIALS.has(lower)) {
        syllables.push(current)
        current = ''
        foundTone = false
      }
    }

    current += char
  }

  if (current) syllables.push(current)

  return syllables.length > 0 ? syllables : [pinyinString]
}
