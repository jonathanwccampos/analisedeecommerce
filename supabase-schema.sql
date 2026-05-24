-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url          TEXT NOT NULL,
  status       TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  overall_score INTEGER,
  expires_at   TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id  UUID REFERENCES analyses(id) ON DELETE CASCADE,
  category     TEXT,
  score        INTEGER,
  issues       JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id      UUID REFERENCES analyses(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  whatsapp         TEXT,
  whatsapp_clicked BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip           TEXT NOT NULL,
  window_start TIMESTAMP NOT NULL,
  count        INTEGER DEFAULT 1,
  PRIMARY KEY (ip, window_start)
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_window ON rate_limits(ip, window_start);

-- Index for analysis results lookup
CREATE INDEX IF NOT EXISTS idx_results_analysis_id ON analysis_results(analysis_id);

-- Store context from the pre-analysis questionnaire
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}';

-- Auto-cleanup expired analyses (optional, run via pg_cron or manually)
-- DELETE FROM analyses WHERE expires_at < NOW();
