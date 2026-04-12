// ── Enums ──

export enum MasteryLevel {
  Unknown = 0,
  Seen = 1,
  Familiar = 2,
  Learned = 3,
  Practiced = 4,
  Mastered = 5,
}

export enum QuizType {
  ToneQuiz = 'tone',
  PinyinQuiz = 'pinyin',
  CharacterQuiz = 'character',
  ListeningQuiz = 'listening',
  SpeakingQuiz = 'speaking',
}

// ── Vocabulary ──

export interface VocabularyWord {
  id: string
  simplified: string
  traditional: string | null
  pinyin: string
  english: string
  french: string
  hsk_level: number
  category: string | null
  example_sentence_zh: string | null
  example_sentence_pinyin: string | null
  example_sentence_en: string | null
  example_sentence_fr: string | null
  notes: string | null
  created_at: string
}

export interface CharacterAssociation {
  id: string
  vocabulary_id: string
  character: string
  meaning: string
  mnemonic: string | null
  stroke_count: number | null
  radical: string | null
  created_at: string
}

// ── User Progress ──

export interface UserProgress {
  id: string
  user_id: string
  vocabulary_id: string
  tone_mastery: number
  pinyin_mastery: number
  character_mastery: number
  overall_mastery: number
  box_level: number
  correct_count: number
  incorrect_count: number
  streak: number
  next_review: string
  last_reviewed: string | null
  easiness_factor: number
  interval_days: number
  created_at: string
  updated_at: string
}

// ── Grammar ──

export interface GrammarRule {
  id: string
  title: string
  title_fr: string | null
  hsk_level: number
  pattern: string
  explanation_en: string
  explanation_fr: string | null
  example_zh: string
  example_pinyin: string
  example_en: string
  example_fr: string | null
  notes: string | null
  created_at: string
}

export interface GrammarProgress {
  id: string
  user_id: string
  grammar_id: string
  mastery_level: number
  times_reviewed: number
  next_review: string
  last_reviewed: string | null
  created_at: string
  updated_at: string
}

// ── Chat ──

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  context: string | null
  created_at: string
}

// ── User Stats ──

export interface UserStats {
  id: string
  user_id: string
  total_words_learned: number
  total_reviews: number
  total_correct: number
  total_incorrect: number
  current_streak_days: number
  longest_streak_days: number
  last_study_date: string | null
  total_study_time_minutes: number
  created_at: string
  updated_at: string
}
