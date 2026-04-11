-- ============================================================
-- ILoveChinese - Supabase schema
-- Mono-user Mandarin learning app
-- ============================================================

-- ── Vocabulary ──────────────────────────────────────────────

create table if not exists vocabulary (
  id            uuid primary key default gen_random_uuid(),
  simplified    text not null,
  traditional   text,
  pinyin        text not null,
  english       text not null,
  french        text not null,
  hsk_level     int  not null default 1,
  category      text,
  example_sentence_zh     text,
  example_sentence_pinyin text,
  example_sentence_en     text,
  example_sentence_fr     text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- Fast lookup by HSK level
create index if not exists idx_vocabulary_hsk_level on vocabulary (hsk_level);

-- ── Character associations (mnemonics, radicals) ───────────

create table if not exists character_associations (
  id            uuid primary key default gen_random_uuid(),
  vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  character     text not null,
  meaning       text not null,
  mnemonic      text,
  stroke_count  int,
  radical       text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_char_assoc_vocabulary on character_associations (vocabulary_id);

-- ── User progress (SRS state per word) ─────────────────────

create table if not exists user_progress (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null default 'default-user',
  vocabulary_id     uuid not null references vocabulary (id) on delete cascade,
  tone_mastery      int  not null default 0,   -- 0-5
  pinyin_mastery    int  not null default 0,   -- 0-5
  character_mastery int  not null default 0,   -- 0-5
  overall_mastery   int  not null default 0,   -- 0-5
  correct_count     int  not null default 0,
  incorrect_count   int  not null default 0,
  streak            int  not null default 0,
  next_review       timestamptz not null default now(),
  last_reviewed     timestamptz,
  easiness_factor   float not null default 2.5,
  interval_days     float not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- One progress row per user per word
  unique (user_id, vocabulary_id)
);

-- Words due for review, ordered by next_review
create index if not exists idx_progress_next_review on user_progress (next_review);
create index if not exists idx_progress_vocabulary   on user_progress (vocabulary_id);

-- ── Grammar rules ──────────────────────────────────────────

create table if not exists grammar_rules (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  title_fr        text,
  hsk_level       int  not null default 1,
  pattern         text not null,
  explanation_en  text not null,
  explanation_fr  text,
  example_zh      text not null,
  example_pinyin  text not null,
  example_en      text not null,
  example_fr      text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_grammar_hsk_level on grammar_rules (hsk_level);

-- ── Grammar progress ───────────────────────────────────────

create table if not exists grammar_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null default 'default-user',
  grammar_id      uuid not null references grammar_rules (id) on delete cascade,
  mastery_level   int  not null default 0,
  times_reviewed  int  not null default 0,
  next_review     timestamptz not null default now(),
  last_reviewed   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (user_id, grammar_id)
);

create index if not exists idx_grammar_progress_next on grammar_progress (next_review);

-- ── Chat history ───────────────────────────────────────────

create table if not exists chat_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default 'default-user',
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  context     text,            -- optional JSON context (level, topic, etc.)
  created_at  timestamptz not null default now()
);

-- ── User stats (aggregated) ────────────────────────────────

create table if not exists user_stats (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 text not null unique default 'default-user',
  total_words_learned     int  not null default 0,
  total_reviews           int  not null default 0,
  total_correct           int  not null default 0,
  total_incorrect         int  not null default 0,
  current_streak_days     int  not null default 0,
  longest_streak_days     int  not null default 0,
  last_study_date         date,
  total_study_time_minutes int not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ── RLS disabled (mono-user app) ───────────────────────────
-- If you ever switch to multi-user, enable RLS and add policies.

alter table vocabulary            disable row level security;
alter table character_associations disable row level security;
alter table user_progress         disable row level security;
alter table grammar_rules         disable row level security;
alter table grammar_progress      disable row level security;
alter table chat_history          disable row level security;
alter table user_stats            disable row level security;
