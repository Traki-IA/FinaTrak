-- ============================================================
-- FinaTrak — Migration 001 : schéma initial
-- ============================================================

-- ------------------------------------------------------------
-- 1. categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT        NOT NULL,
  couleur     TEXT        NOT NULL DEFAULT '#6366f1',  -- ex: '#f43f5e'
  icone       TEXT        NOT NULL DEFAULT 'tag',      -- nom d'icône (Lucide, etc.)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Données de base
INSERT INTO categories (nom, couleur, icone) VALUES
  ('Alimentation',   '#f97316', 'shopping-cart'),
  ('Logement',       '#6366f1', 'home'),
  ('Transport',      '#3b82f6', 'car'),
  ('Santé',          '#22c55e', 'heart-pulse'),
  ('Loisirs',        '#ec4899', 'gamepad-2'),
  ('Épargne',        '#14b8a6', 'piggy-bank'),
  ('Revenus',        '#84cc16', 'banknote'),
  ('Autres',         '#94a3b8', 'circle-ellipsis');

-- ------------------------------------------------------------
-- 2. transactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  montant       NUMERIC(12, 2) NOT NULL CHECK (montant > 0),
  type          TEXT        NOT NULL CHECK (type IN ('depense', 'revenu')),
  categorie_id  UUID        REFERENCES categories(id) ON DELETE SET NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_date         ON transactions(date DESC);
CREATE INDEX idx_transactions_categorie_id ON transactions(categorie_id);
CREATE INDEX idx_transactions_type         ON transactions(type);

-- ------------------------------------------------------------
-- 3. objectifs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS objectifs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             TEXT           NOT NULL,
  montant_cible   NUMERIC(12, 2) NOT NULL CHECK (montant_cible > 0),
  montant_actuel  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (montant_actuel >= 0),
  periode         TEXT           NOT NULL CHECK (periode IN ('mensuel', 'annuel', 'ponctuel')),
  date_fin        DATE,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_objectifs_date_fin ON objectifs(date_fin);

-- ------------------------------------------------------------
-- Row Level Security (RLS) — à activer si auth Supabase utilisée
-- ------------------------------------------------------------
-- ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE objectifs    ENABLE ROW LEVEL SECURITY;
