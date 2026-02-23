-- ============================================================
-- FinaTrak — Migration 003 : settings
-- À exécuter dans Supabase : Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  cle    TEXT PRIMARY KEY,
  valeur TEXT NOT NULL DEFAULT ''
);

-- Solde initial par défaut à 0
INSERT INTO settings (cle, valeur)
VALUES ('solde_initial', '0')
ON CONFLICT (cle) DO NOTHING;

-- RLS (à activer si auth Supabase utilisée)
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
