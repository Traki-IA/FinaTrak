-- ============================================================
-- FinaTrak — Migration 004 : comptes bancaires + nav_order
-- À exécuter dans Supabase : Dashboard > SQL Editor
-- ============================================================

-- 1. Table comptes
CREATE TABLE IF NOT EXISTS comptes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom            TEXT           NOT NULL,
  couleur        TEXT           NOT NULL DEFAULT '#6366f1',
  icone          TEXT           NOT NULL DEFAULT 'landmark',
  solde_initial  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order     INTEGER        NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 2. Créer un compte par défaut et rattacher les données existantes
INSERT INTO comptes (id, nom, couleur, icone, solde_initial, sort_order)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Compte principal',
  '#6366f1',
  'landmark',
  COALESCE((SELECT valeur::NUMERIC FROM settings WHERE cle = 'solde_initial'), 0),
  0
);

-- 3. Ajouter compte_id aux tables existantes
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS compte_id UUID REFERENCES comptes(id) ON DELETE CASCADE;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS compte_id UUID REFERENCES comptes(id) ON DELETE CASCADE;
ALTER TABLE objectifs    ADD COLUMN IF NOT EXISTS compte_id UUID REFERENCES comptes(id) ON DELETE CASCADE;

-- 4. Rattacher toutes les données existantes au compte par défaut
UPDATE transactions SET compte_id = '00000000-0000-0000-0000-000000000001' WHERE compte_id IS NULL;
UPDATE budget_items SET compte_id = '00000000-0000-0000-0000-000000000001' WHERE compte_id IS NULL;
UPDATE objectifs    SET compte_id = '00000000-0000-0000-0000-000000000001' WHERE compte_id IS NULL;

-- 5. Rendre compte_id NOT NULL après migration
ALTER TABLE transactions ALTER COLUMN compte_id SET NOT NULL;
ALTER TABLE budget_items ALTER COLUMN compte_id SET NOT NULL;
ALTER TABLE objectifs    ALTER COLUMN compte_id SET NOT NULL;

-- 6. Index sur compte_id
CREATE INDEX IF NOT EXISTS idx_transactions_compte_id ON transactions(compte_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_compte_id ON budget_items(compte_id);
CREATE INDEX IF NOT EXISTS idx_objectifs_compte_id    ON objectifs(compte_id);

-- 7. Stocker l'ordre de navigation
INSERT INTO settings (cle, valeur) VALUES ('nav_order', '[]')
ON CONFLICT (cle) DO NOTHING;
