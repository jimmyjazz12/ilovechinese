const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'hsk_reference_complete.xlsx'));

const sheets = {
  'HSK 1 (300 mots)': 1,
  'HSK 2 (200 nouveaux)': 2,
  'HSK 3 (500 nouveaux)': 3,
  'HSK 4 (1000 nouveaux)': 4,
};

// English to French basic translation map
const enToFr = {
  'love': 'amour, aimer', 'hobby': 'passe-temps', 'eight': 'huit', 'dad': 'papa', 'father': 'père',
  'white': 'blanc', 'half': 'demi', 'help': 'aider', 'bag': 'sac', 'cup': 'tasse',
  'north': 'nord', 'compare': 'comparer', 'don\'t': 'ne pas', 'other': 'autre', 'sick': 'malade',
  'wrong': 'faux', 'often': 'souvent', 'sing': 'chanter', 'long': 'long', 'eat': 'manger',
  'go out': 'sortir', 'wear': 'porter', 'big': 'grand', 'everyone': 'tout le monde',
  'but': 'mais', 'certainly': 'certainement', 'arrive': 'arriver', 'road': 'route',
  'wait': 'attendre', 'time': 'temps', 'place': 'endroit', 'earth': 'terre',
  'younger brother': 'petit frère', 'first': 'premier', 'point': 'point', 'phone': 'téléphone',
  'computer': 'ordinateur', 'movie': 'film', 'thing': 'chose', 'east': 'est',
  'winter': 'hiver', 'all': 'tous', 'read': 'lire', 'right': 'correct',
  'sorry': 'désolé', 'many': 'beaucoup', 'how much': 'combien', 'hungry': 'avoir faim',
  'child': 'enfant', 'son': 'fils', 'two': 'deux', 'rice': 'riz', 'restaurant': 'restaurant',
  'room': 'chambre', 'fly': 'voler', 'airplane': 'avion', 'very': 'très',
  'minute': 'minute', 'clothes': 'vêtements', 'happy': 'content', 'tall': 'grand',
  'tell': 'dire', 'give': 'donner', 'work': 'travailler', 'dog': 'chien',
  'expensive': 'cher', 'country': 'pays', 'return': 'retourner', 'still': 'encore',
  'good': 'bon', 'drink': 'boire', 'very': 'très', 'behind': 'derrière',
  'flower': 'fleur', 'bad': 'mauvais', 'welcome': 'bienvenue', 'can': 'pouvoir',
  'fire': 'feu', 'or': 'ou', 'chicken': 'poulet', 'egg': 'oeuf',
  'how many': 'combien', 'family': 'famille', 'between': 'entre', 'see': 'voir',
  'teach': 'enseigner', 'call': 'appeler', 'sister': 'soeur', 'today': 'aujourd\'hui',
  'enter': 'entrer', 'nine': 'neuf', 'open': 'ouvrir', 'begin': 'commencer',
  'look': 'regarder', 'test': 'examen', 'fast': 'rapide', 'happy': 'heureux',
  'come': 'venir', 'teacher': 'professeur', 'cold': 'froid', 'old': 'vieux',
  'inside': 'dedans', 'zero': 'zéro', 'six': 'six', 'mother': 'mère',
  'horse': 'cheval', 'buy': 'acheter', 'cat': 'chat', 'slow': 'lent',
  'busy': 'occupé', 'not': 'ne pas', 'which': 'quel', 'that': 'ce',
  'south': 'sud', 'man': 'homme', 'you': 'tu', 'girl': 'fille',
  'warm': 'chaud', 'friend': 'ami', 'woman': 'femme', 'run': 'courir',
  'next to': 'à côté', 'seven': 'sept', 'money': 'argent', 'front': 'devant',
  'please': 's\'il vous plaît', 'go': 'aller', 'hot': 'chaud', 'person': 'personne',
  'know': 'connaître', 'day': 'jour', 'meat': 'viande', 'three': 'trois',
  'store': 'magasin', 'what': 'quoi', 'ten': 'dix', 'is': 'être',
  'book': 'livre', 'water': 'eau', 'sleep': 'dormir', 'speak': 'parler',
  'four': 'quatre', 'year': 'année', 'he': 'il', 'she': 'elle', 'it': 'il/elle',
  'too': 'aussi, trop', 'weather': 'temps', 'play': 'jouer', 'I': 'je',
  'ask': 'demander', 'five': 'cinq', 'west': 'ouest', 'like': 'aimer',
  'wash': 'laver', 'small': 'petit', 'want': 'vouloir', 'laugh': 'rire',
  'new': 'nouveau', 'thank': 'remercier', 'star': 'étoile', 'week': 'semaine',
  'student': 'étudiant', 'school': 'école', 'study': 'étudier', 'rain': 'pluie',
  'Chinese': 'chinois', 'desk': 'bureau', 'sit': 'asseoir', 'do': 'faire',
  'yesterday': 'hier', 'walk': 'marcher', 'most': 'le plus', 'left': 'gauche',
  'mouth': 'bouche', 'word': 'mot', 'character': 'caractère',
  'safe': 'sûr', 'arrange': 'arranger', 'install': 'installer',
  'according to': 'selon', 'hundred': 'cent', 'move': 'déménager',
  'full': 'plein', 'newspaper': 'journal', 'report': 'rapport',
  'example': 'exemple', 'change': 'changer', 'become': 'devenir',
  'express': 'exprimer', 'not bad': 'pas mal', 'however': 'cependant',
  'not enough': 'pas assez', 'grass': 'herbe', 'tea': 'thé',
  'produce': 'produire', 'success': 'succès', 'city': 'ville',
  'grow up': 'grandir', 'only': 'seulement', 'spring': 'printemps',
  'this': 'ceci', 'ever': 'jamais', 'word': 'mot',
  'need': 'avoir besoin', 'use': 'utiliser', 'exist': 'exister',
  'have': 'avoir', 'hand': 'main', 'above': 'au-dessus',
  'class': 'classe', 'morning': 'matin', 'afternoon': 'après-midi',
  'evening': 'soir', 'night': 'nuit', 'hour': 'heure',
  'number': 'numéro', 'name': 'nom', 'year old': 'ans',
  'month': 'mois', 'think': 'penser', 'mean': 'signifier',
  'should': 'devoir', 'snow': 'neige', 'color': 'couleur',
  'red': 'rouge', 'eye': 'oeil', 'doctor': 'médecin',
  'already': 'déjà', 'with': 'avec', 'prepare': 'préparer',
  'true': 'vrai', 'really': 'vraiment', 'just': 'juste',
  'husband': 'mari', 'wife': 'épouse', 'stand': 'se tenir debout',
  'clock': 'horloge', 'live': 'vivre, habiter', 'table': 'table',
  'letter': 'lettre', 'walk': 'marcher', 'again': 'encore',
  'meet': 'rencontrer', 'finish': 'finir', 'self': 'soi-même',
};

function translateToFrench(english) {
  if (!english) return '';
  const lower = english.toLowerCase().trim();
  // Direct match
  if (enToFr[lower]) return enToFr[lower];
  // Try partial matches
  for (const [en, fr] of Object.entries(enToFr)) {
    if (lower.includes(en) || en.includes(lower)) return fr;
  }
  // Fallback: return English with note
  return english;
}

function cleanChinese(raw) {
  if (!raw) return '';
  // Remove annotations like （形）（动）（名）
  let clean = raw.replace(/[（(][^）)]*[）)]/g, '').trim();
  // Take first variant before ｜ or |
  clean = clean.split(/[｜|]/)[0].trim();
  return clean;
}

function getComponents(simplified) {
  return [...new Set(simplified.split(''))];
}

function categorize(translation) {
  const lower = (translation || '').toLowerCase();
  if (/\b(je|tu|il|elle|nous|vous|ils|elles|I|you|he|she|we|they)\b/i.test(lower)) return 'pronoms';
  if (/\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|cent|mille|zero|number|nombre)\b/i.test(lower)) return 'nombres';
  if (/\b(manger|boire|dormir|courir|eat|drink|sleep|run|walk|sit|stand|go|come|give|take|say|speak|read|write|see|hear|look|listen|open|close|buy|sell|learn|teach|study|work|play|sing|dance)\b/i.test(lower)) return 'verbes';
  if (/\b(grand|petit|bon|mauvais|beau|nouveau|vieux|chaud|froid|rapide|lent|big|small|good|bad|new|old|hot|cold|fast|slow|tall|short|long|beautiful|ugly)\b/i.test(lower)) return 'adjectifs';
  if (/\b(lundi|mardi|jour|mois|année|heure|minute|semaine|matin|soir|hier|demain|day|month|year|hour|week|morning|evening|yesterday|tomorrow|spring|summer|autumn|winter)\b/i.test(lower)) return 'temps';
  if (/\b(nord|sud|est|ouest|gauche|droite|devant|derrière|north|south|east|west|left|right|front|behind|above|below|inside|outside)\b/i.test(lower)) return 'lieux';
  if (/\b(père|mère|frère|soeur|famille|enfant|fils|fille|mari|épouse|father|mother|brother|sister|family|child|son|daughter|husband|wife)\b/i.test(lower)) return 'famille';
  return 'noms';
}

// Process each sheet
let totalAdded = 0;

for (const [sheetName, level] of Object.entries(sheets)) {
  const excelData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  const appFile = path.join(__dirname, '..', 'src', 'data', `hsk${level}.json`);
  const appData = JSON.parse(fs.readFileSync(appFile, 'utf8'));
  const existingWords = new Set(appData.map(w => w.simplified));

  let added = 0;

  for (const row of excelData) {
    const rawChinese = row['Chinois (汉字)'] || '';
    const simplified = cleanChinese(rawChinese);
    if (!simplified || existingWords.has(simplified)) continue;

    const pinyin = row['Pinyin'] || '';
    const englishTranslation = row['Traduction'] || '';
    const french = translateToFrench(englishTranslation);
    const components = getComponents(simplified);
    const category = categorize(french || englishTranslation);

    const entry = {
      simplified,
      traditional: simplified, // fallback
      pinyin,
      french,
      hsk_level: level,
      category,
      components,
      examples: [
        {
          chinese: `我学习"${simplified}"这个词。`,
          pinyin: `wǒ xuéxí "${pinyin}" zhège cí.`,
          french: `J'apprends le mot "${french}".`,
        },
        {
          chinese: `你知道"${simplified}"是什么意思吗？`,
          pinyin: `nǐ zhīdào "${pinyin}" shì shénme yìsi ma?`,
          french: `Sais-tu ce que signifie "${french}" ?`,
        },
      ],
    };

    appData.push(entry);
    existingWords.add(simplified);
    added++;
  }

  fs.writeFileSync(appFile, JSON.stringify(appData, null, 2), 'utf8');
  console.log(`HSK ${level}: added ${added} words (total: ${appData.length})`);
  totalAdded += added;
}

console.log(`\nTotal added: ${totalAdded}`);
