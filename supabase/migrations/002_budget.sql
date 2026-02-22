-- ============================================================
-- FinaTrak — Migration 002 : budget_items
-- À exécuter dans Supabase : Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           TEXT           NOT NULL,
  montant       NUMERIC(12, 2) NOT NULL CHECK (montant > 0),
  frequence     TEXT           NOT NULL CHECK (frequence IN ('mensuel', 'annuel')),
  categorie_id  UUID           REFERENCES categories(id) ON DELETE SET NULL,
  objectif_id   UUID           REFERENCES objectifs(id)  ON DELETE SET NULL,
  actif         BOOLEAN        NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_items_frequence ON budget_items(frequence);
CREATE INDEX IF NOT EXISTS idx_budget_items_actif     ON budget_items(actif);

-- RLS (à activer si auth Supabase utilisée)
-- ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
