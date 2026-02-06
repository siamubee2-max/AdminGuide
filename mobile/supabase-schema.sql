-- MonAdmin Supabase Schema
-- Run this in the SQL Editor of your Supabase project

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  type TEXT NOT NULL,
  organisme TEXT NOT NULL,
  titre TEXT NOT NULL,
  urgence TEXT NOT NULL DEFAULT 'vert',
  urgence_label TEXT NOT NULL DEFAULT '',
  urgence_icon TEXT NOT NULL DEFAULT '',
  montant TEXT,
  date_limite TEXT,
  explication TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  categorie TEXT NOT NULL DEFAULT 'tous',
  image_uri TEXT,
  date_ajout TEXT NOT NULL,
  contenu_brut TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_device_id ON documents(device_id);

-- History actions table
CREATE TABLE IF NOT EXISTS history_actions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_id TEXT,
  document_title TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_device_id ON history_actions(device_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history_actions(timestamp DESC);

-- Family members table
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT,
  telephone TEXT,
  email TEXT,
  avatar TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer',
  date_ajout TEXT NOT NULL,
  dernier_acces TEXT,
  notifications_actives BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_device_id ON family_members(device_id);

-- Shared documents table
CREATE TABLE IF NOT EXISTS shared_documents (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  document_id BIGINT NOT NULL,
  shared_with TEXT[] NOT NULL DEFAULT '{}',
  shared_at TEXT NOT NULL,
  message TEXT,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_docs_device_id ON shared_documents(device_id);

-- Settings table (one row per device)
CREATE TABLE IF NOT EXISTS settings (
  device_id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations for anon users (device_id based security)
CREATE POLICY "Allow all for documents" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for history_actions" ON history_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for family_members" ON family_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for shared_documents" ON shared_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
