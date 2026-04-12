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

// ── Complete valid pinyin syllable table (sorted longest first) ──

const VALID_SYLLABLES: string[] = [
  // 6-letter syllables
  'zhuang', 'chuang', 'shuang',
  // 5-letter syllables
  'zhuan', 'zhuai', 'zhong', 'zhang', 'zheng',
  'chuan', 'chuai', 'chong', 'chang', 'cheng',
  'shuan', 'shuai', 'shang', 'sheng',
  'guang', 'kuang', 'huang',
  'xiang', 'xiong', 'qiang', 'qiong', 'jiang', 'jiong',
  'niang', 'liang',
  // 4-letter syllables
  'zhai', 'zhei', 'zhao', 'zhou', 'zhan', 'zhen', 'zhua', 'zhuo', 'zhui', 'zhun',
  'chai', 'chao', 'chou', 'chan', 'chen', 'chua', 'chuo', 'chui', 'chun',
  'shai', 'shei', 'shao', 'shou', 'shan', 'shen', 'shua', 'shuo', 'shui', 'shun',
  'guan', 'guai', 'gong', 'gang', 'geng', 'guan', 'gong',
  'kuan', 'kuai', 'kong', 'kang', 'keng',
  'huan', 'huai', 'hong', 'hang', 'heng',
  'jian', 'jiao', 'jing', 'juan', 'jian', 'jing',
  'qian', 'qiao', 'qing', 'quan',
  'xian', 'xiao', 'xing', 'xuan',
  'duan', 'dong', 'dang', 'deng', 'diao', 'dian', 'ding',
  'tuan', 'tong', 'tang', 'teng', 'tiao', 'tian', 'ting',
  'nuan', 'nong', 'nang', 'neng', 'niao', 'nian', 'ning',
  'luan', 'long', 'lang', 'leng', 'liao', 'lian', 'ling',
  'bang', 'beng', 'biao', 'bian', 'bing',
  'pang', 'peng', 'piao', 'pian', 'ping',
  'mang', 'meng', 'miao', 'mian', 'ming',
  'fang', 'feng',
  'rang', 'reng', 'ruan', 'rong', 'ruan',
  'zang', 'zeng', 'zuan', 'zong',
  'cang', 'ceng', 'cuan', 'cong',
  'sang', 'seng', 'suan', 'song',
  'yang', 'ying', 'yong', 'yuan',
  'wang', 'weng',
  'yong',
  // 3-letter syllables
  'zha', 'zhe', 'zhi', 'zhu',
  'cha', 'che', 'chi', 'chu',
  'sha', 'she', 'shi', 'shu',
  'gua', 'guo', 'gui', 'gun', 'gou', 'gai', 'gei', 'gao', 'gan', 'gen',
  'kua', 'kuo', 'kui', 'kun', 'kou', 'kai', 'kei', 'kao', 'kan', 'ken',
  'hua', 'huo', 'hui', 'hun', 'hou', 'hai', 'hei', 'hao', 'han', 'hen',
  'jia', 'jie', 'jiu', 'jin', 'jue', 'jun',
  'qia', 'qie', 'qiu', 'qin', 'que', 'qun',
  'xia', 'xie', 'xiu', 'xin', 'xue', 'xun',
  'duo', 'dui', 'dun', 'dou', 'dai', 'dei', 'dao', 'dan', 'den', 'die', 'diu',
  'tuo', 'tui', 'tun', 'tou', 'tai', 'tei', 'tao', 'tan', 'tie',
  'nuo', 'nou', 'nai', 'nei', 'nao', 'nan', 'nen', 'nie', 'niu', 'nin', 'nve',
  'luo', 'lun', 'lou', 'lai', 'lei', 'lao', 'lan', 'lie', 'liu', 'lin', 'lve',
  'bai', 'bei', 'bao', 'ban', 'ben', 'bie', 'bin',
  'pai', 'pei', 'pao', 'pou', 'pan', 'pen', 'pie', 'pin',
  'mai', 'mei', 'mao', 'mou', 'man', 'men', 'mie', 'miu', 'min',
  'fei', 'fou', 'fan', 'fen',
  'rao', 'rou', 'ran', 'ren', 'rua', 'ruo', 'rui', 'run',
  'zai', 'zei', 'zao', 'zou', 'zan', 'zen', 'zuo', 'zui', 'zun',
  'cai', 'cao', 'cou', 'can', 'cen', 'cuo', 'cui', 'cun',
  'sai', 'sao', 'sou', 'san', 'sen', 'suo', 'sui', 'sun',
  'yao', 'you', 'yan', 'yin', 'yue', 'yun',
  'wai', 'wei', 'wan', 'wen',
  'ang', 'eng',
  // 2-letter syllables
  'ba', 'bo', 'bi', 'bu',
  'pa', 'po', 'pi', 'pu',
  'ma', 'mo', 'me', 'mi', 'mu',
  'fa', 'fo', 'fu',
  'da', 'de', 'di', 'du',
  'ta', 'te', 'ti', 'tu',
  'na', 'ne', 'ni', 'nu', 'nv',
  'la', 'le', 'li', 'lu', 'lv',
  'ga', 'ge', 'gu',
  'ka', 'ke', 'ku',
  'ha', 'he', 'hu',
  'ji', 'ju',
  'qi', 'qu',
  'xi', 'xu',
  're', 'ri', 'ru',
  'za', 'ze', 'zi', 'zu',
  'ca', 'ce', 'ci', 'cu',
  'sa', 'se', 'si', 'su',
  'ya', 'ye', 'yi', 'wu', 'wa', 'wo', 'yu',
  'ai', 'ei', 'ao', 'ou', 'an', 'en', 'er',
  // 1-letter syllables
  'a', 'o', 'e',
]

// Build a Set for validation
const VALID_SYLLABLE_SET = new Set(VALID_SYLLABLES)

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
 * their plain equivalents. Preserves ü.
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
 * Check if a string (without tones) is a valid pinyin syllable.
 */
export function isValidSyllable(syllable: string): boolean {
  return VALID_SYLLABLE_SET.has(syllable.toLowerCase().replace('ü', 'v').replace('ü', 'v'))
    || VALID_SYLLABLE_SET.has(syllable.toLowerCase())
}

/**
 * Split a multi-syllable pinyin string into individual syllables.
 * Uses greedy matching against a complete table of valid Mandarin syllables.
 *
 * Handles both space-separated ("nǐ hǎo") and concatenated ("nǐhǎo") forms.
 *
 * Example: "gōngyuán" → ["gōng", "yuán"]
 *          "nǐ hǎo"   → ["nǐ", "hǎo"]
 */
export function splitPinyin(pinyinString: string): string[] {
  const trimmed = pinyinString.trim()
  if (!trimmed) return []

  // If space/apostrophe/hyphen-separated, split and recursively split each part
  if (/[\s'\-]/.test(trimmed)) {
    const parts = trimmed.split(/[\s'\-]+/).filter(Boolean)
    const result: string[] = []
    for (const part of parts) {
      // If the part is punctuation or a number, keep it as-is
      if (/^[^a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/.test(part)) {
        result.push(part)
      } else {
        result.push(...splitSinglePinyin(part))
      }
    }
    return result
  }

  return splitSinglePinyin(trimmed)
}

/**
 * Split a single concatenated pinyin word (no spaces) into syllables.
 * Uses backtracking longest-match against the valid syllable table.
 * Backtracking ensures that e.g. "binguan" splits as "bin"+"guan" not "bing"+"uan".
 */
function splitSinglePinyin(input: string): string[] {
  if (!input) return []

  // Strip punctuation from the end, process it separately
  let trailing = ''
  const punctMatch = input.match(/([^a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+)$/)
  if (punctMatch) {
    trailing = punctMatch[1]
    input = input.slice(0, input.length - trailing.length)
  }

  // Strip leading punctuation
  let leading = ''
  const leadPunctMatch = input.match(/^([^a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+)/)
  if (leadPunctMatch) {
    leading = leadPunctMatch[1]
    input = input.slice(leading.length)
  }

  if (!input) {
    const combined = leading + trailing
    return combined ? [combined] : []
  }

  // Remove tones to get the plain version for syllable matching
  // Both strings have the same length since removeTones replaces char by char
  const plain = removeTones(input).toLowerCase().replace(/ü/g, 'v')

  // Use recursive backtracking to find a valid split
  const splitResult = backtrackSplit(plain, 0)

  let syllables: string[]
  if (splitResult) {
    // Map the split positions back to the original string with tone marks
    syllables = splitResult.map(([start, end]) => input.slice(start, end))
  } else {
    // Fallback: return as single unit
    syllables = [input]
  }

  // Re-attach leading/trailing punctuation
  if (leading && syllables.length > 0) {
    syllables[0] = leading + syllables[0]
  } else if (leading) {
    syllables.unshift(leading)
  }

  if (trailing && syllables.length > 0) {
    syllables[syllables.length - 1] += trailing
  } else if (trailing) {
    syllables.push(trailing)
  }

  return syllables.length > 0 ? syllables : [input]
}

/**
 * Recursive backtracking splitter. Returns an array of [start, end] index pairs
 * if a valid split is found, or null if no valid split exists from this position.
 */
function backtrackSplit(plain: string, pos: number): [number, number][] | null {
  if (pos >= plain.length) return []

  // If current char is not a letter, skip it
  if (!/[a-z]/.test(plain[pos])) {
    const rest = backtrackSplit(plain, pos + 1)
    if (rest !== null) {
      // Attach non-letter char to the next syllable or as its own segment
      if (rest.length > 0) {
        rest[0] = [pos, rest[0][1]]
      } else {
        rest.push([pos, pos + 1])
      }
      return rest
    }
    return null
  }

  // Try longest match first, but backtrack if the rest doesn't parse
  const maxLen = Math.min(6, plain.length - pos)
  for (let len = maxLen; len >= 1; len--) {
    const candidate = plain.slice(pos, pos + len)
    if (VALID_SYLLABLE_SET.has(candidate)) {
      const rest = backtrackSplit(plain, pos + len)
      if (rest !== null) {
        return [[pos, pos + len], ...rest]
      }
      // This match didn't work, try a shorter one
    }
  }

  return null // No valid split found from this position
}

/**
 * Apply Mandarin tone sandhi rules to an array of pinyin syllables.
 * Returns a new array with modified tone marks for display of actual pronunciation.
 *
 * Rules:
 * 1. Two 3rd tones in a row → first becomes 2nd tone
 * 2. 不 (bù) before a 4th tone → becomes 2nd tone (bú)
 * 3. 一 (yī) before 4th tone → 2nd tone (yí), before 1st/2nd/3rd → 4th tone (yì)
 */
export function applyToneSandhi(syllables: string[]): string[] {
  if (syllables.length === 0) return []

  const result = [...syllables]

  for (let i = 0; i < result.length; i++) {
    const currentTone = getToneNumber(result[i])
    const nextTone = i + 1 < result.length ? getToneNumber(result[i + 1]) : 0

    // Rule 1: Two 3rd tones in a row → first becomes 2nd
    if (currentTone === 3 && nextTone === 3) {
      result[i] = changeTone(result[i], 2)
    }

    // Rule 2: 不 (bù) before 4th tone → 2nd tone
    const currentPlain = removeTones(result[i]).toLowerCase()
    if (currentPlain === 'bu' && currentTone === 4 && nextTone === 4) {
      result[i] = changeTone(result[i], 2)
    }

    // Rule 3: 一 (yī) before other tones
    if (currentPlain === 'yi' && currentTone === 1 && nextTone > 0) {
      if (nextTone === 4) {
        result[i] = changeTone(result[i], 2)
      } else if (nextTone >= 1 && nextTone <= 3) {
        result[i] = changeTone(result[i], 4)
      }
    }
  }

  return result
}

// Tone mark replacement tables per vowel
const TONE_VARIANTS: Record<string, string[]> = {
  // [base, tone1, tone2, tone3, tone4]
  'a': ['a', 'ā', 'á', 'ǎ', 'à'],
  'e': ['e', 'ē', 'é', 'ě', 'è'],
  'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
  'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
  'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
  'ü': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

/**
 * Change the tone of a pinyin syllable to a different tone number.
 * E.g., changeTone("nǐ", 2) → "ní"
 */
function changeTone(syllable: string, newTone: number): string {
  let result = ''
  let toneChanged = false

  for (const char of syllable) {
    const entry = TONE_MARKS[char]
    if (entry && !toneChanged) {
      // Replace this tone mark with the new tone
      const base = entry.base
      const variants = TONE_VARIANTS[base]
      if (variants && newTone >= 1 && newTone <= 4) {
        result += variants[newTone]
      } else {
        result += char
      }
      toneChanged = true
    } else {
      result += char
    }
  }

  return result
}
