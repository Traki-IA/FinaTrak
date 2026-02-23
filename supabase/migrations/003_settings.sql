-- ============================================================
-- FinaTrak — Migration 003 : settings
-- À exécuter dans Supabase : Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  cle    TEXT PRIMARY KEY,
  valeur TEXT NOT NULL DEFAULT ''
);

-- RLS (à activer si auth Supabase utilisée)
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
