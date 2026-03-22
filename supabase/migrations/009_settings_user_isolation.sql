-- ============================================================
-- FinaTrak — Migration 009 : isoler settings par utilisateur
-- ============================================================
-- La table settings était globale (USING (true)), permettant
-- à tout utilisateur authentifié d'écraser les settings des
-- autres. On ajoute user_id pour l'isoler par utilisateur.

-- ------------------------------------------------------------
-- 1. Ajouter la colonne user_id
-- ------------------------------------------------------------
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ------------------------------------------------------------
-- 2. Contrainte d'unicité composite (cle, user_id)
--    pour que l'upsert fonctionne par utilisateur
-- ------------------------------------------------------------
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (cle, user_id);

-- ------------------------------------------------------------
-- 3. Supprimer les anciennes policies permissives
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "settings_select" ON settings;
DROP POLICY IF EXISTS "settings_insert" ON settings;
DROP POLICY IF EXISTS "settings_update" ON settings;
DROP POLICY IF EXISTS "settings_delete" ON settings;

-- ------------------------------------------------------------
-- 4. Nouvelles policies isolées par user_id
-- ------------------------------------------------------------
CREATE POLICY "settings_select" ON settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "settings_insert" ON settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "settings_update" ON settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "settings_delete" ON settings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
