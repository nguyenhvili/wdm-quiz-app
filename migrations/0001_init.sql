CREATE TABLE quizzes (
  id              TEXT PRIMARY KEY,               -- short random id used in URLs
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  visibility      TEXT NOT NULL DEFAULT 'unlisted'
                  CHECK (visibility IN ('public', 'unlisted')),
  questions       TEXT NOT NULL,                  -- JSON array of Question
  question_count  INTEGER NOT NULL CHECK (question_count >= 1),
  start_count     INTEGER NOT NULL DEFAULT 0,     -- anonymous popularity counter
  edit_token_hash TEXT NOT NULL,                  -- SHA-256 of the edit token
  forked_from     TEXT REFERENCES quizzes(id) ON DELETE SET NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quiz_tags (
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,                          -- normalised: lowercase, trimmed
  PRIMARY KEY (quiz_id, tag)
);

CREATE INDEX idx_quizzes_public_created ON quizzes(visibility, created_at);
CREATE INDEX idx_quizzes_public_popular ON quizzes(visibility, start_count);
CREATE INDEX idx_quiz_tags_tag ON quiz_tags(tag);
