-- ============================================================
-- FinaTrak — Migration 006 : activer RLS sur toutes les tables
-- ============================================================

-- ------------------------------------------------------------
-- 1. Ajouter user_id sur comptes (entité racine)
-- ------------------------------------------------------------
ALTER TABLE comptes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_comptes_user_id ON comptes(user_id);

-- ------------------------------------------------------------
-- 2. Activer RLS sur toutes les tables
-- ------------------------------------------------------------
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectifs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings     ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. Policies — categories (lecture seule pour tous les auth)
-- ------------------------------------------------------------
CREATE POLICY "categories_select" ON categories
  FOR SELECT TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- 4. Policies — comptes (CRUD pour le propriétaire)
-- ------------------------------------------------------------
CREATE POLICY "comptes_select" ON comptes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "comptes_insert" ON comptes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "comptes_update" ON comptes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "comptes_delete" ON comptes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 5. Policies — transactions (via compte_id → comptes.user_id)
-- ------------------------------------------------------------
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()))
  WITH CHECK (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

-- ------------------------------------------------------------
-- 6. Policies — objectifs (via compte_id → comptes.user_id)
-- ------------------------------------------------------------
CREATE POLICY "objectifs_select" ON objectifs
  FOR SELECT TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "objectifs_insert" ON objectifs
  FOR INSERT TO authenticated
  WITH CHECK (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "objectifs_update" ON objectifs
  FOR UPDATE TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()))
  WITH CHECK (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "objectifs_delete" ON objectifs
  FOR DELETE TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

-- ------------------------------------------------------------
-- 7. Policies — budget_items (via compte_id → comptes.user_id)
-- ------------------------------------------------------------
CREATE POLICY "budget_items_select" ON budget_items
  FOR SELECT TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "budget_items_insert" ON budget_items
  FOR INSERT TO authenticated
  WITH CHECK (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "budget_items_update" ON budget_items
  FOR UPDATE TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()))
  WITH CHECK (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

CREATE POLICY "budget_items_delete" ON budget_items
  FOR DELETE TO authenticated
  USING (compte_id IN (SELECT id FROM comptes WHERE user_id = auth.uid()));

-- ------------------------------------------------------------
-- 8. Policies — settings (accès complet pour les auth)
-- ------------------------------------------------------------
CREATE POLICY "settings_select" ON settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "settings_insert" ON settings
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "settings_update" ON settings
  FOR UPDATE TO authenticated
  USING (true);
