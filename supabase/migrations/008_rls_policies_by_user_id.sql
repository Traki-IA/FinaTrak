-- ============================================================
-- FinaTrak — Migration 008 : policies RLS par user_id direct
-- ============================================================
-- Remplace les policies de la migration 006 qui utilisaient
-- des sous-requêtes via compte_id par un filtrage direct
-- user_id = auth.uid() (plus performant).
-- Ne touche pas categories ni settings (policies inchangées).

-- ------------------------------------------------------------
-- 1. Supprimer les anciennes policies (sous-requête compte_id)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

DROP POLICY IF EXISTS "objectifs_select" ON objectifs;
DROP POLICY IF EXISTS "objectifs_insert" ON objectifs;
DROP POLICY IF EXISTS "objectifs_update" ON objectifs;
DROP POLICY IF EXISTS "objectifs_delete" ON objectifs;

DROP POLICY IF EXISTS "budget_items_select" ON budget_items;
DROP POLICY IF EXISTS "budget_items_insert" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update" ON budget_items;
DROP POLICY IF EXISTS "budget_items_delete" ON budget_items;

-- ------------------------------------------------------------
-- 2. Nouvelles policies — transactions (user_id direct)
-- ------------------------------------------------------------
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 3. Nouvelles policies — objectifs (user_id direct)
-- ------------------------------------------------------------
CREATE POLICY "objectifs_select" ON objectifs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "objectifs_insert" ON objectifs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "objectifs_update" ON objectifs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "objectifs_delete" ON objectifs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 4. Nouvelles policies — budget_items (user_id direct)
-- ------------------------------------------------------------
CREATE POLICY "budget_items_select" ON budget_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "budget_items_insert" ON budget_items
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budget_items_update" ON budget_items
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budget_items_delete" ON budget_items
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
