-- ============================================================
-- FinaTrak — Migration 010 : colonne sort_order
-- ============================================================
-- Ajoute sort_order sur categories, objectifs et budget_items
-- pour permettre un tri manuel personnalisé.
-- IF NOT EXISTS : sécuritaire si la colonne existe déjà en cloud.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE objectifs
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE budget_items
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
