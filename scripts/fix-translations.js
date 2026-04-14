/**
 * fix-translations.js
 *
 * Reads HSK 1-4 JSON files, detects English translations in the `french` field,
 * and replaces them with correct French translations.
 */

const fs = require('fs');
const path = require('path');

// Comprehensive English -> French mapping for word-level translations
const EN_TO_FR = {
  // --- Provided dictionary ---
  "take": "prendre",
  "take a taxi": "prendre un taxi",
  "turn on": "allumer",
  "get": "obtenir",
  "drive": "conduire",
  "Make fun of": "plaisanter",
  "back to": "retourner à",
  "such as": "par exemple",
  "watch": "montre",
  "no way": "impossible, pas possible",
  "Set out": "partir",
  "a lot of": "beaucoup de",
  "bring": "apporter",
  "keep": "garder, maintenir",
  "Back": "dos",
  "also": "aussi, également",
  "Always": "toujours",
  "Be engaged in": "s'engager dans, exercer",
  "Be amazed": "être surpris, étonné",
  "put on": "mettre, enfiler",
  "stop up; block up": "boucher, bloquer",
  "Spend": "passer (du temps)",
  "no matter": "peu importe",
  "dark": "sombre, foncé",
  "long": "long",
  "dry": "sec, sécher",
  "light": "léger, clair",
  "run": "courir",
  "walk": "marcher",
  "sit": "s'asseoir",
  "stand": "se tenir debout",
  "read": "lire",
  "write": "écrire",
  "hear": "entendre",
  "speak": "parler",
  "learn": "apprendre",
  "teach": "enseigner",
  "work": "travailler",
  "play": "jouer",
  "fly": "voler",
  "swim": "nager",
  "wear": "porter",
  "hold": "tenir",
  "cut": "couper",
  "hit": "frapper",
  "pull": "tirer",
  "push": "pousser",
  "send": "envoyer",
  "grow": "grandir, pousser",
  "show": "montrer",
  "begin": "commencer",
  "stop": "arrêter",
  "try": "essayer",
  "help": "aider",
  "call": "appeler",
  "win": "gagner",
  "lose": "perdre",
  "feel": "sentir, ressentir",
  "leave": "partir, quitter",
  "follow": "suivre",
  "draw": "dessiner",
  "drop": "laisser tomber",
  "fill": "remplir",
  "miss": "manquer",
  "reach": "atteindre",
  "throw": "lancer",
  "touch": "toucher",
  "cook": "cuisiner",
  "wash": "laver",
  "fix": "réparer",
  "climb": "grimper",
  "eat": "manger",
  "drink": "boire",
  "sleep": "dormir",
  "buy": "acheter",
  "sell": "vendre",
  "sing": "chanter",
  "love": "amour, aimer",
  "hobby": "passe-temps, hobby",
  "big": "grand",
  "small": "petit",
  "short": "court",
  "tall": "grand (taille)",
  "old": "vieux",
  "new": "nouveau",
  "young": "jeune",
  "hot": "chaud",
  "cold": "froid",
  "warm": "tiède, chaud",
  "cool": "frais",
  "fast": "rapide",
  "slow": "lent",
  "hard": "dur, difficile",
  "soft": "doux, mou",
  "heavy": "lourd",
  "bright": "brillant, lumineux",
  "full": "plein",
  "empty": "vide",
  "dirty": "sale",
  "wet": "mouillé",
  "rich": "riche",
  "poor": "pauvre",
  "happy": "heureux, content",
  "sad": "triste",
  "angry": "en colère",
  "afraid": "avoir peur",
  "tired": "fatigué",
  "sick": "malade",
  "busy": "occupé",
  "free": "libre, gratuit",
  "easy": "facile",
  "he": "il",
  "she": "elle",
  "it": "il/elle",
  "they": "ils/elles",
  "we": "nous",
  "you": "tu, vous",
  "man": "homme",
  "woman": "femme",
  "child": "enfant",
  "brother": "frère",
  "sister": "soeur",
  "husband": "mari",
  "wife": "épouse",
  "friend": "ami(e)",
  "teacher": "professeur",
  "student": "étudiant(e)",
  "north": "nord",
  "south": "sud",
  "east": "est",
  "west": "ouest",
  "left": "gauche",
  "right": "droite",
  "front": "devant",
  "behind": "derrière",
  "above": "au-dessus",
  "below": "en-dessous",
  "inside": "à l'intérieur",
  "outside": "à l'extérieur",
  "eight": "huit",
  "half": "demi, moitié",
  "white": "blanc",
  "wrong": "faux, incorrect",
  "often": "souvent",
  "very": "très",
  "too": "aussi, trop",
  "already": "déjà",
  "still": "encore",
  "only": "seulement",
  "just": "juste",
  "even": "même",
  "never": "jamais",
  "always": "toujours",
  "again": "encore",
  "together": "ensemble",
  "maybe": "peut-être",
  "however": "cependant",
  "although": "bien que",
  "because": "parce que",
  "while": "pendant que",
  "if": "si",
  "but": "mais",
  "many": "beaucoup",
  "few": "peu",
  "much": "beaucoup",
  "every": "chaque",
  "some": "quelques",
  "any": "n'importe quel",
  "other": "autre",
  "another": "un autre",

  // --- Additional entries found in data scan ---
  "One side": "un côté",
  "get up": "se lever",
  "get on": "monter (dans un véhicule)",
  "get angry": "se mettre en colère",
  "get off": "descendre (d'un véhicule)",
  "in process of": "en train de",
  "sign up": "s'inscrire",
  "in a moment": "dans un instant",
  "Be equal to": "être égal à",
  "Instant noodles": "nouilles instantanées",
  "be about to": "être sur le point de",
  "Pleasantly cool": "agréablement frais",
  "Mountain climbing": "alpinisme, escalade",
  "be afraid; fear": "avoir peur, craindre",
  "take off": "décoller, enlever",
  "take out": "sortir, retirer",
  "to count": "compter",
  "Stop": "arrêter",
  "Take a shower": "prendre une douche",
  "in a low voice": "à voix basse",
  "Get some action": "passer à l'action",
  "Bon voyage": "bon voyage",
  "Be willing": "être disposé à, vouloir bien",
  "How about": "que dis-tu de, comment",
  "take a picture": "prendre une photo",
  "Chinese food": "cuisine chinoise",
  "Chinese Medicine": "médecine chinoise",
  "Of course": "bien sûr",
  "To copy": "copier, photocopier",
  "Sure enough": "effectivement, en effet",
  "Be curious": "être curieux",
  "traffic police": "police de la circulation",
  "Beijing opera": "opéra de Pékin",
  "To make clear": "clarifier, préciser",
  "Sad": "triste",
  "Lose": "perdre",
  "be subject; suffer; receive": "subir, recevoir",
  "Be similar": "être similaire, se ressembler",
  "Chinese nation": "nation chinoise",
  "Be careful": "faire attention",
  "be a guest": "être invité, rendre visite",
  "Reference resources": "documents de référence",
  "To make an injection": "faire une piqûre",
  "To serve as": "servir de, occuper le poste de",
  "Sign in": "se connecter",
  "Traffic jam": "embouteillage",
  "Break up": "se séparer, rompre",
  "be interested in": "s'intéresser à",
  "Gas station": "station-service",
  "Camera lens": "objectif (appareil photo)",
  "Internal medicine": "médecine interne",
  "Set up": "installer, configurer",
  "set meal": "menu, formule",
  "take off": "décoller, enlever",
  "In case": "au cas où",
  "To greet": "saluer",
  "In total": "au total, en tout",
  "one of": "l'un de, parmi",
  "turn round; face about": "se retourner",
  "send out": "émettre, envoyer",
  "find out": "trouver, découvrir",
  "A key": "point clé, essentiel",
  "put to; put into": "mettre dans, poser dans",
  "Put questions to": "poser des questions",
  "push away": "repousser, pousser",
  "A martial art": "arts martiaux",
  "pay out": "payer, fournir",
  "win a prize": "remporter un prix",
  "end of term": "fin de semestre",
  "put into": "investir, mettre dans",
  "win a lottery": "gagner à la loterie",
};

// Context-aware corrections by simplified character (overrides EN_TO_FR when
// the generic English word maps to the wrong French meaning for a specific character)
const CONTEXT_CORRECTIONS = {
  "多久": "combien de temps",
  "好久": "longtemps",
  "早就": "depuis longtemps",
  "早已": "depuis longtemps",
  "长期": "long terme, à long terme",
  "长途": "longue distance",
  "进展": "progrès, avancement",
  "属": "appartenir à, signe du zodiaque",
  "属于": "appartenir à",
  "跳远": "saut en longueur",
  "相处": "s'entendre, cohabiter",
  "整天": "toute la journée",
  "只要": "pourvu que, du moment que",
  "目的": "but, objectif",
  "收看": "regarder (la télévision)",
  "光": "lumière, lumineux",
  "光明": "lumineux, brillant",
  "演出": "spectacle, représentation",
  "弄": "faire, arranger",
  "后头": "derrière, à l'arrière",
  "久": "longtemps",
  "发": "émettre, envoyer",
  "找出": "trouver, découvrir",
  "重点": "point clé, essentiel",
  "放到": "mettre dans, poser dans",
  "提问": "poser des questions",
  "推开": "repousser, pousser",
  "武术": "arts martiaux",
  "付出": "payer, fournir",
  "获奖": "remporter un prix",
  "期末": "fin de semestre",
  "投入": "investir, mettre dans",
  "中奖": "gagner à la loterie",
};

// Build a case-insensitive lookup map
const lookupMap = new Map();
for (const [en, fr] of Object.entries(EN_TO_FR)) {
  lookupMap.set(en.toLowerCase().trim(), fr);
}

function findFrenchTranslation(englishText) {
  const text = englishText.trim();
  const textLower = text.toLowerCase();

  // 1. Exact match (case-insensitive)
  if (lookupMap.has(textLower)) {
    return lookupMap.get(textLower);
  }

  // 2. Try matching the part before a comma
  if (text.includes(',')) {
    const firstPart = text.split(',')[0].trim().toLowerCase();
    if (lookupMap.has(firstPart)) {
      return lookupMap.get(firstPart);
    }
  }

  // 3. Try matching the part before a semicolon
  if (text.includes(';')) {
    const withSemicolon = textLower;
    if (lookupMap.has(withSemicolon)) {
      return lookupMap.get(withSemicolon);
    }
  }

  return null;
}

function isLikelyEnglish(text) {
  // French text typically has accented characters
  if (/[àâéèêëïîôùûüçæœÀÂÉÈÊËÏÎÔÙÛÜÇ]/.test(text)) {
    return false;
  }
  // If text is only ASCII letters/spaces/punctuation and matches known English patterns
  if (/^[A-Za-z\s,;:\/'.\-()]+$/.test(text)) {
    // Check against our dictionary
    return findFrenchTranslation(text) !== null;
  }
  return false;
}

function isEnglishSentence(text) {
  // Detect English sentences in examples
  return /^(I |He |She |They |We |The |This |It |You |My |His |Her |Do |Don't |There |A |An |What |How |Where |When |Why |Which |Who |Can |Could |Should |Would |Will |Have |Has |Are |Is |Am |Was |Were |Let |Please |Thank|No |Not )/.test(text);
}

// Process files
const dataDir = path.join(__dirname, '..', 'src', 'data');
const files = ['hsk1.json', 'hsk2.json', 'hsk3.json', 'hsk4.json'];
const summary = {};

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let fixedWords = 0;
  let fixedExamples = 0;

  for (const word of data) {
    // Apply context-aware corrections first (highest priority)
    if (CONTEXT_CORRECTIONS[word.simplified] !== undefined) {
      if (word.french !== CONTEXT_CORRECTIONS[word.simplified]) {
        console.log(`  ${file}: ${word.simplified} "${word.french}" -> "${CONTEXT_CORRECTIONS[word.simplified]}" (context fix)`);
        word.french = CONTEXT_CORRECTIONS[word.simplified];
        fixedWords++;
      }
    }
    // Then check dictionary-based fixes for remaining English translations
    else if (isLikelyEnglish(word.french)) {
      const frenchTranslation = findFrenchTranslation(word.french);
      if (frenchTranslation && frenchTranslation !== word.french) {
        console.log(`  ${file}: ${word.simplified} "${word.french}" -> "${frenchTranslation}"`);
        word.french = frenchTranslation;
        fixedWords++;
      }
    }

    // Check example sentences
    if (word.examples) {
      for (const ex of word.examples) {
        if (isEnglishSentence(ex.french)) {
          console.log(`  ${file}: example "${ex.french.substring(0, 50)}..." (English sentence detected)`);
          fixedExamples++;
        }
      }
    }
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  summary[file] = { words: fixedWords, examples: fixedExamples };
  console.log(`\n${file}: Fixed ${fixedWords} word translations, ${fixedExamples} example sentences flagged`);
}

console.log('\n=== Summary ===');
let totalFixed = 0;
for (const [file, counts] of Object.entries(summary)) {
  console.log(`${file}: ${counts.words} words fixed, ${counts.examples} examples flagged`);
  totalFixed += counts.words;
}
console.log(`Total words fixed: ${totalFixed}`);
