#!/usr/bin/env node

/**
 * Audit script for HSK vocabulary pinyin data.
 * Checks that:
 * 1. Each word's pinyin has valid tone marks
 * 2. The number of pinyin syllables matches the number of characters
 * 3. Each syllable is a valid pinyin syllable
 */

const fs = require('fs');
const path = require('path');

// ── Tone marks mapping ──
const TONE_MARKS = {
  '\u0101': { base: 'a', tone: 1 }, '\u00E1': { base: 'a', tone: 2 },
  '\u01CE': { base: 'a', tone: 3 }, '\u00E0': { base: 'a', tone: 4 },
  '\u0113': { base: 'e', tone: 1 }, '\u00E9': { base: 'e', tone: 2 },
  '\u011B': { base: 'e', tone: 3 }, '\u00E8': { base: 'e', tone: 4 },
  '\u012B': { base: 'i', tone: 1 }, '\u00ED': { base: 'i', tone: 2 },
  '\u01D0': { base: 'i', tone: 3 }, '\u00EC': { base: 'i', tone: 4 },
  '\u014D': { base: 'o', tone: 1 }, '\u00F3': { base: 'o', tone: 2 },
  '\u01D2': { base: 'o', tone: 3 }, '\u00F2': { base: 'o', tone: 4 },
  '\u016B': { base: 'u', tone: 1 }, '\u00FA': { base: 'u', tone: 2 },
  '\u01D4': { base: 'u', tone: 3 }, '\u00F9': { base: 'u', tone: 4 },
  '\u01D6': { base: '\u00FC', tone: 1 }, '\u01D8': { base: '\u00FC', tone: 2 },
  '\u01DA': { base: '\u00FC', tone: 3 }, '\u01DC': { base: '\u00FC', tone: 4 },
};

// ── Valid pinyin syllables (sorted longest first for greedy matching) ──
const VALID_SYLLABLES = [
  'zhuang', 'chuang', 'shuang',
  'zhuan', 'zhuai', 'zhong', 'zhang', 'zheng',
  'chuan', 'chuai', 'chong', 'chang', 'cheng',
  'shuan', 'shuai', 'shang', 'sheng',
  'guang', 'kuang', 'huang',
  'xiang', 'xiong', 'qiang', 'qiong', 'jiang', 'jiong',
  'niang', 'liang',
  'zhai', 'zhei', 'zhao', 'zhou', 'zhan', 'zhen', 'zhua', 'zhuo', 'zhuai', 'zhui', 'zhun',
  'chai', 'chao', 'chou', 'chan', 'chen', 'chua', 'chuo', 'chuai', 'chui', 'chun',
  'shai', 'shei', 'shao', 'shou', 'shan', 'shen', 'shua', 'shuo', 'shuai', 'shui', 'shun',
  'guan', 'guai', 'gong', 'gang', 'geng',
  'kuan', 'kuai', 'kong', 'kang', 'keng',
  'huan', 'huai', 'hong', 'hang', 'heng',
  'jian', 'jiao', 'jing', 'juan', 'jiong',
  'qian', 'qiao', 'qing', 'quan', 'qiong',
  'xian', 'xiao', 'xing', 'xuan', 'xiong',
  'duan', 'dong', 'dang', 'deng', 'diao', 'dian', 'ding',
  'tuan', 'tong', 'tang', 'teng', 'tiao', 'tian', 'ting',
  'nuan', 'nong', 'nang', 'neng', 'niao', 'nian', 'ning',
  'luan', 'long', 'lang', 'leng', 'liao', 'lian', 'ling',
  'bang', 'beng', 'biao', 'bian', 'bing',
  'pang', 'peng', 'piao', 'pian', 'ping',
  'mang', 'meng', 'miao', 'mian', 'ming',
  'fang', 'feng',
  'rang', 'reng', 'ruan', 'rong',
  'zang', 'zeng', 'zuan', 'zong',
  'cang', 'ceng', 'cuan', 'cong',
  'sang', 'seng', 'suan', 'song',
  'yang', 'ying', 'yong', 'yuan',
  'wang', 'weng',
  'ang', 'eng',
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
  'a', 'o', 'e',
];

const VALID_SYLLABLE_SET = new Set(VALID_SYLLABLES);

function removeTones(pinyin) {
  let result = '';
  for (const char of pinyin) {
    const entry = TONE_MARKS[char];
    if (entry) {
      result += entry.base;
    } else {
      result += char;
    }
  }
  return result;
}

function getToneNumber(syllable) {
  for (const char of syllable) {
    const entry = TONE_MARKS[char];
    if (entry) return entry.tone;
  }
  return 5;
}

function splitSinglePinyin(input) {
  if (!input) return [];

  // Strip trailing punctuation
  let trailing = '';
  const punctMatch = input.match(/([^a-zA-Z\u0101\u00E1\u01CE\u00E0\u0113\u00E9\u011B\u00E8\u012B\u00ED\u01D0\u00EC\u014D\u00F3\u01D2\u00F2\u016B\u00FA\u01D4\u00F9\u01D6\u01D8\u01DA\u01DC\u00FC]+)$/);
  if (punctMatch) {
    trailing = punctMatch[1];
    input = input.slice(0, input.length - trailing.length);
  }

  // Strip leading punctuation
  let leading = '';
  const leadMatch = input.match(/^([^a-zA-Z\u0101\u00E1\u01CE\u00E0\u0113\u00E9\u011B\u00E8\u012B\u00ED\u01D0\u00EC\u014D\u00F3\u01D2\u00F2\u016B\u00FA\u01D4\u00F9\u01D6\u01D8\u01DA\u01DC\u00FC]+)/);
  if (leadMatch) {
    leading = leadMatch[1];
    input = input.slice(leading.length);
  }

  if (!input) {
    const combined = leading + trailing;
    return combined ? [combined] : [];
  }

  const plain = removeTones(input).toLowerCase().replace(/\u00FC/g, 'v');

  // Backtracking split
  function backtrack(pos) {
    if (pos >= plain.length) return [];
    if (!/[a-z]/.test(plain[pos])) {
      const rest = backtrack(pos + 1);
      if (rest !== null) {
        if (rest.length > 0) {
          rest[0] = [pos, rest[0][1]];
        } else {
          rest.push([pos, pos + 1]);
        }
        return rest;
      }
      return null;
    }
    const maxLen = Math.min(6, plain.length - pos);
    for (let len = maxLen; len >= 1; len--) {
      const candidate = plain.slice(pos, pos + len);
      if (VALID_SYLLABLE_SET.has(candidate)) {
        const rest = backtrack(pos + len);
        if (rest !== null) {
          return [[pos, pos + len], ...rest];
        }
      }
    }
    return null;
  }

  const splitResult = backtrack(0);
  const syllables = splitResult
    ? splitResult.map(([s, e]) => input.slice(s, e))
    : [input];

  if (leading && syllables.length > 0) {
    syllables[0] = leading + syllables[0];
  } else if (leading) {
    syllables.unshift(leading);
  }
  if (trailing && syllables.length > 0) {
    syllables[syllables.length - 1] += trailing;
  } else if (trailing) {
    syllables.push(trailing);
  }

  return syllables.length > 0 ? syllables : [input];
}

function splitPinyin(pinyinString) {
  const trimmed = pinyinString.trim();
  if (!trimmed) return [];

  if (/[\s'\-]/.test(trimmed)) {
    const parts = trimmed.split(/[\s'\-]+/).filter(Boolean);
    const result = [];
    for (const part of parts) {
      if (/^[^a-zA-Z\u0101\u00E1\u01CE\u00E0\u0113\u00E9\u011B\u00E8\u012B\u00ED\u01D0\u00EC\u014D\u00F3\u01D2\u00F2\u016B\u00FA\u01D4\u00F9\u01D6\u01D8\u01DA\u01DC\u00FC]+$/.test(part)) {
        result.push(part);
      } else {
        result.push(...splitSinglePinyin(part));
      }
    }
    return result;
  }

  return splitSinglePinyin(trimmed);
}

// Count Chinese characters (ignoring punctuation, spaces, digits, latin)
function countChineseChars(str) {
  let count = 0;
  for (const char of str) {
    const cp = char.codePointAt(0);
    // CJK Unified Ideographs and common ranges
    if ((cp >= 0x4E00 && cp <= 0x9FFF) ||
        (cp >= 0x3400 && cp <= 0x4DBF) ||
        (cp >= 0x20000 && cp <= 0x2A6DF) ||
        (cp >= 0xF900 && cp <= 0xFAFF)) {
      count++;
    }
  }
  return count;
}

// ── Main audit ──

const dataDir = path.join(__dirname, '..', 'src', 'data');
const files = ['hsk1.json', 'hsk2.json', 'hsk3.json', 'hsk4.json'];

let totalWords = 0;
let totalErrors = 0;
let totalWarnings = 0;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${file} not found`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n=== Auditing ${file} (${data.length} words) ===\n`);

  for (const word of data) {
    totalWords++;
    const { simplified, pinyin } = word;

    if (!pinyin) {
      console.log(`  ERROR [${simplified}]: Missing pinyin`);
      totalErrors++;
      continue;
    }

    // Split pinyin into syllables (filter out punctuation-only entries)
    const syllables = splitPinyin(pinyin).filter(s =>
      /[a-zA-Z\u0101\u00E1\u01CE\u00E0\u0113\u00E9\u011B\u00E8\u012B\u00ED\u01D0\u00EC\u014D\u00F3\u01D2\u00F2\u016B\u00FA\u01D4\u00F9\u01D6\u01D8\u01DA\u01DC\u00FC]/.test(s)
    );

    // Count Chinese characters
    const charCount = countChineseChars(simplified);

    // Check syllable count matches character count
    if (syllables.length !== charCount) {
      console.log(`  ERROR [${simplified}] pinyin="${pinyin}": syllable count ${syllables.length} != char count ${charCount} (syllables: [${syllables.join(', ')}])`);
      totalErrors++;
    }

    // Check each syllable is valid
    for (const syl of syllables) {
      const plain = removeTones(syl).toLowerCase().replace(/\u00FC/g, 'v');
      // Remove any trailing punctuation from the syllable for validation
      const cleaned = plain.replace(/[^a-z]/g, '');
      if (cleaned && !VALID_SYLLABLE_SET.has(cleaned)) {
        console.log(`  WARNING [${simplified}] pinyin="${pinyin}": invalid syllable "${syl}" (plain: "${cleaned}")`);
        totalWarnings++;
      }
    }

    // Check that multi-character words have tone marks (warn if neutral on all)
    if (charCount > 1) {
      const allNeutral = syllables.every(s => getToneNumber(s) === 5);
      if (allNeutral) {
        console.log(`  WARNING [${simplified}] pinyin="${pinyin}": all syllables are neutral tone`);
        totalWarnings++;
      }
    }
  }
}

console.log(`\n=== AUDIT SUMMARY ===`);
console.log(`Total words checked: ${totalWords}`);
console.log(`Errors: ${totalErrors}`);
console.log(`Warnings: ${totalWarnings}`);

if (totalErrors > 0 || totalWarnings > 0) {
  process.exit(1);
} else {
  console.log('All checks passed!');
}
