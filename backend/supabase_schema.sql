-- ═══════════════════════════════════════════════════════════════════════════
-- AdminGuide (MonAdmin) — Supabase Schema
-- Run this SQL in Supabase SQL Editor to create the required tables
-- ═══════════════════════════════════════════════════════════════════════════

-- B2B Leads table
CREATE TABLE IF NOT EXISTS b2b_leads (
  id TEXT PRIMARY KEY,
  structure TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  residents TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'converted', 'lost'))
);

CREATE INDEX IF NOT EXISTS idx_b2b_leads_email ON b2b_leads(email);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_status ON b2b_leads(status);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_created ON b2b_leads(created_at DESC);

-- Newsletter Subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'app',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  resubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_created ON newsletter_subscribers(created_at DESC);

-- AI Analysis Cache table (optional, for caching expensive AI calls)
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id TEXT PRIMARY KEY,
  image_hash TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  result JSONB NOT NULL,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_analysis_cache(image_hash);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE b2b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Service role can access all data (backend uses service_role key)
CREATE POLICY "Service role full access on b2b_leads"
  ON b2b_leads FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on newsletter_subscribers"
  ON newsletter_subscribers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ai_analysis_cache"
  ON ai_analysis_cache FOR ALL
  USING (auth.role() = 'service_role');
