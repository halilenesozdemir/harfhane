-- In-app feedback and word reports (Plan 013 R1/R7). Anonymous by design: no IP
-- address and no device identifier column exists on this table (R7, AE9) — the
-- optional `contact` column is free text the sender chooses to type, never
-- collected automatically.
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT NOT NULL CHECK (kind IN ('general', 'word_report')),
  -- Length and non-empty-after-trim are enforced by the zod schema layer, not
  -- here (apps/backend/CLAUDE.md: Zod at the route boundary, not SQL CHECKs
  -- for user-text shape).
  message TEXT NOT NULL,
  contact TEXT,
  app_platform TEXT NOT NULL CHECK (app_platform IN ('android', 'web')),
  app_version TEXT,
  -- The following four columns only apply to kind = 'word_report'; they stay
  -- NULL for kind = 'general'. Required-together validation for word_report
  -- lives in feedback-schemas.ts, not as a CHECK here, so the zod error
  -- message (422) can name exactly which field is missing.
  mode TEXT CHECK (mode IS NULL OR mode IN ('daily', 'unlimited')),
  word_length INTEGER,
  puzzle_date TEXT,
  reported_word TEXT,
  -- Server-owned triage state (KTD3); never set by the submitter.
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'seen', 'done'))
);

CREATE INDEX idx_feedback_status_created_at ON feedback (status, created_at);
