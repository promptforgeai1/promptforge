-- PromptForge AI — Supabase Database Setup
-- Run this entire file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

-- ─── USERS TABLE ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         TEXT UNIQUE NOT NULL,
  email           TEXT,
  tier            TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  generations_today     INTEGER DEFAULT 0,
  last_generation_date  DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GENERATION LOGS TABLE ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS generation_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  generator     TEXT NOT NULL,
  tier          TEXT NOT NULL,
  tokens_used   INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON generation_logs(created_at);

-- ─── AUTO-UPDATE TIMESTAMP ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── DAILY RESET FUNCTION ────────────────────────────────────────────────────
-- Resets generation count for users whose last generation was before today

CREATE OR REPLACE FUNCTION reset_daily_generations()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET generations_today = 0,
      last_generation_date = CURRENT_DATE
  WHERE last_generation_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- Service role (backend) has full access
-- Anon/public role has no direct access (all access goes through your API)

CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to logs"
  ON generation_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ─── VERIFY SETUP ────────────────────────────────────────────────────────────

SELECT 'users table' as table_name, COUNT(*) as rows FROM users
UNION ALL
SELECT 'generation_logs table', COUNT(*) FROM generation_logs;
