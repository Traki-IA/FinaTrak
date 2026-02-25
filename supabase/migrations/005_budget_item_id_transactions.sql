-- ============================================================================
-- Migration 005 : Lier les transactions aux lignes de budget
-- ============================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_budget_item_id
  ON transactions(budget_item_id);
