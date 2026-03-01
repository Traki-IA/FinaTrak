-- ============================================================
-- FinaTrak — Migration 007 : ajouter user_id sur les tables
-- ============================================================
-- Ajoute user_id directement sur transactions, objectifs et
-- budget_items pour un filtrage RLS direct sans sous-requête.
-- Colonne nullable pour ne pas casser les données existantes.
-- comptes a déjà user_id (migration 006).

-- ------------------------------------------------------------
-- 1. transactions
-- ------------------------------------------------------------
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- ------------------------------------------------------------
-- 2. objectifs
-- ------------------------------------------------------------
ALTER TABLE objectifs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_objectifs_user_id ON objectifs(user_id);

-- ------------------------------------------------------------
-- 3. budget_items
-- ------------------------------------------------------------
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON budget_items(user_id);
