-- ============================================================
-- FinaTrak — Seed simulation réaliste (Avril 2025 → Mars 2026)
-- À coller dans : Supabase Dashboard > SQL Editor > Run
-- ============================================================

DO $$
DECLARE
  v_user_id   UUID;
  v_compte_id UUID;
  cat_alim    UUID;
  cat_loge    UUID;
  cat_tran    UUID;
  cat_sant    UUID;
  cat_lois    UUID;
  cat_reve    UUID;
  cat_autr    UUID;
  cat_epar    UUID;
BEGIN
  -- ── Résolution user & compte ──────────────────────────────────────────────
  SELECT id INTO v_user_id   FROM auth.users   ORDER BY created_at LIMIT 1;
  SELECT id INTO v_compte_id FROM comptes WHERE user_id = v_user_id ORDER BY sort_order LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé dans auth.users';
  END IF;
  IF v_compte_id IS NULL THEN
    RAISE EXCEPTION 'Aucun compte trouvé pour cet utilisateur';
  END IF;

  -- ── Catégories ────────────────────────────────────────────────────────────
  SELECT id INTO cat_alim FROM categories WHERE nom = 'Alimentation' LIMIT 1;
  SELECT id INTO cat_loge FROM categories WHERE nom = 'Logement'     LIMIT 1;
  SELECT id INTO cat_tran FROM categories WHERE nom = 'Transport'    LIMIT 1;
  SELECT id INTO cat_sant FROM categories WHERE nom = 'Santé'        LIMIT 1;
  SELECT id INTO cat_lois FROM categories WHERE nom = 'Loisirs'      LIMIT 1;
  SELECT id INTO cat_reve FROM categories WHERE nom = 'Revenus'      LIMIT 1;
  SELECT id INTO cat_autr FROM categories WHERE nom = 'Autres'       LIMIT 1;
  SELECT id INTO cat_epar FROM categories WHERE nom = 'Épargne'      LIMIT 1;

  -- ── Nettoyage ─────────────────────────────────────────────────────────────
  DELETE FROM transactions WHERE user_id = v_user_id;
  DELETE FROM objectifs    WHERE user_id = v_user_id;

  -- ── Solde initial du compte ───────────────────────────────────────────────
  -- Représente l'épargne disponible avant la simulation
  UPDATE comptes SET solde_initial = 5000 WHERE id = v_compte_id;

  -- ── Objectifs ─────────────────────────────────────────────────────────────
  INSERT INTO objectifs (nom, montant_cible, montant_actuel, periode, date_fin, compte_id, user_id) VALUES
  ('Voyage au Japon',   4500.00, 1200.00, 'ponctuel', '2026-10-01', v_compte_id, v_user_id),
  ('Voiture neuve',    12000.00, 2800.00, 'ponctuel', '2027-06-01', v_compte_id, v_user_id),
  ('Fonds urgence',     6000.00, 3500.00, 'ponctuel', NULL,         v_compte_id, v_user_id),
  ('Épargne mensuelle',  500.00,    0.00, 'mensuel',  NULL,         v_compte_id, v_user_id);

  -- ── Transactions : Avril 2025 → Mars 2026 ─────────────────────────────────
  INSERT INTO transactions (date, montant, type, categorie_id, description, compte_id, user_id) VALUES

  -- ─── AVRIL 2025 ────────────────────────────────────────────────────────────
  ('2025-03-28', 2800.00, 'revenu',  cat_reve, 'Salaire mars',              v_compte_id, v_user_id),
  ('2025-04-01',  950.00, 'depense', cat_loge, 'Loyer avril',               v_compte_id, v_user_id),
  ('2025-04-05',   63.50, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2025-04-08',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-04-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-04-12',   87.30, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2025-04-14',   23.60, 'depense', cat_sant, 'Pharmacie',                 v_compte_id, v_user_id),
  ('2025-04-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-04-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-04-17',   54.20, 'depense', cat_alim, 'Lidl',                      v_compte_id, v_user_id),
  ('2025-04-19',   32.50, 'depense', cat_alim, 'Restaurant Le Bistrot',     v_compte_id, v_user_id),
  ('2025-04-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-04-22',   71.40, 'depense', cat_tran, 'Carburant Total',           v_compte_id, v_user_id),
  ('2025-04-25',   45.99, 'depense', cat_autr, 'Amazon',                    v_compte_id, v_user_id),
  ('2025-04-26',   63.80, 'depense', cat_alim, 'Courses Monoprix',          v_compte_id, v_user_id),

  -- ─── MAI 2025 ──────────────────────────────────────────────────────────────
  ('2025-04-28', 2800.00, 'revenu',  cat_reve, 'Salaire avril',             v_compte_id, v_user_id),
  ('2025-05-01',  950.00, 'depense', cat_loge, 'Loyer mai',                 v_compte_id, v_user_id),
  ('2025-05-05',   58.90, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2025-05-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-05-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-05-12',   92.40, 'depense', cat_alim, 'Courses Leclerc',           v_compte_id, v_user_id),
  ('2025-05-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-05-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-05-17',   48.00, 'depense', cat_alim, 'Restaurant Sushi',          v_compte_id, v_user_id),
  ('2025-05-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-05-22',   74.60, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2025-05-25',   89.90, 'depense', cat_lois, 'Vêtements H&M',             v_compte_id, v_user_id),
  ('2025-05-28',   65.30, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2025-05-29',   41.20, 'depense', cat_alim, 'Courses Monoprix',          v_compte_id, v_user_id),

  -- ─── JUIN 2025 ─────────────────────────────────────────────────────────────
  ('2025-05-28', 2800.00, 'revenu',  cat_reve, 'Salaire mai',               v_compte_id, v_user_id),
  ('2025-06-01',  950.00, 'depense', cat_loge, 'Loyer juin',                v_compte_id, v_user_id),
  ('2025-06-05',   72.30, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2025-06-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-06-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-06-11',   78.90, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2025-06-14',  320.00, 'depense', cat_lois, 'Billet avion vacances',     v_compte_id, v_user_id),
  ('2025-06-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-06-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-06-18',   55.40, 'depense', cat_alim, 'Lidl',                      v_compte_id, v_user_id),
  ('2025-06-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-06-21',   42.00, 'depense', cat_alim, 'Restaurant brasserie',      v_compte_id, v_user_id),
  ('2025-06-24',   68.50, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2025-06-27',   56.30, 'depense', cat_alim, 'Courses Monoprix',          v_compte_id, v_user_id),
  ('2025-06-28',  500.00, 'revenu',  cat_reve, 'Remboursement CPAM',        v_compte_id, v_user_id),

  -- ─── JUILLET 2025 ──────────────────────────────────────────────────────────
  ('2025-06-28', 2800.00, 'revenu',  cat_reve, 'Salaire juin',              v_compte_id, v_user_id),
  ('2025-07-01',  950.00, 'depense', cat_loge, 'Loyer juillet',             v_compte_id, v_user_id),
  ('2025-07-05',   61.80, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2025-07-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-07-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-07-12',   95.60, 'depense', cat_alim, 'Courses Leclerc',           v_compte_id, v_user_id),
  ('2025-07-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-07-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-07-16',  450.00, 'depense', cat_lois, 'Hôtel vacances',            v_compte_id, v_user_id),
  ('2025-07-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-07-21',  180.00, 'depense', cat_alim, 'Courses vacances',          v_compte_id, v_user_id),
  ('2025-07-24',   88.40, 'depense', cat_tran, 'Carburant vacances',        v_compte_id, v_user_id),
  ('2025-07-27',   62.10, 'depense', cat_alim, 'Restaurant vacances',       v_compte_id, v_user_id),

  -- ─── AOÛT 2025 ─────────────────────────────────────────────────────────────
  ('2025-07-28', 2800.00, 'revenu',  cat_reve, 'Salaire juillet',           v_compte_id, v_user_id),
  ('2025-08-01',  950.00, 'depense', cat_loge, 'Loyer août',                v_compte_id, v_user_id),
  ('2025-08-05',   58.20, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2025-08-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-08-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-08-13',   83.20, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2025-08-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-08-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-08-17',   65.80, 'depense', cat_alim, 'Monoprix',                  v_compte_id, v_user_id),
  ('2025-08-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-08-22',   38.50, 'depense', cat_alim, 'Restaurant',                v_compte_id, v_user_id),
  ('2025-08-24',   74.60, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2025-08-26',  125.00, 'depense', cat_lois, 'Amazon - Équipement',       v_compte_id, v_user_id),
  ('2025-08-29',   48.90, 'depense', cat_alim, 'Courses Lidl',              v_compte_id, v_user_id),

  -- ─── SEPTEMBRE 2025 ────────────────────────────────────────────────────────
  ('2025-08-28', 2800.00, 'revenu',  cat_reve, 'Salaire août',              v_compte_id, v_user_id),
  ('2025-09-01',  950.00, 'depense', cat_loge, 'Loyer septembre',           v_compte_id, v_user_id),
  ('2025-09-04',   69.40, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2025-09-08',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-09-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-09-12',   91.30, 'depense', cat_alim, 'Courses Leclerc',           v_compte_id, v_user_id),
  ('2025-09-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-09-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-09-16',   45.00, 'depense', cat_sant, 'Médecin + ordonnance',      v_compte_id, v_user_id),
  ('2025-09-18',   76.40, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2025-09-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-09-22',   55.50, 'depense', cat_alim, 'Restaurant',                v_compte_id, v_user_id),
  ('2025-09-24',   67.80, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2025-09-27',  199.00, 'depense', cat_lois, 'Concert',                   v_compte_id, v_user_id),

  -- ─── OCTOBRE 2025 ──────────────────────────────────────────────────────────
  ('2025-09-28', 2800.00, 'revenu',  cat_reve, 'Salaire septembre',         v_compte_id, v_user_id),
  ('2025-10-01',  950.00, 'depense', cat_loge, 'Loyer octobre',             v_compte_id, v_user_id),
  ('2025-10-05',   78.60, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2025-10-08',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-10-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-10-13',   88.70, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2025-10-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-10-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-10-18',   59.30, 'depense', cat_alim, 'Lidl',                      v_compte_id, v_user_id),
  ('2025-10-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-10-22',   42.80, 'depense', cat_alim, 'Restaurant',                v_compte_id, v_user_id),
  ('2025-10-24',   72.40, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2025-10-26',  145.00, 'depense', cat_lois, 'Vêtements Zara',            v_compte_id, v_user_id),
  ('2025-10-29',   53.40, 'depense', cat_alim, 'Courses Monoprix',          v_compte_id, v_user_id),

  -- ─── NOVEMBRE 2025 ─────────────────────────────────────────────────────────
  ('2025-10-28', 2800.00, 'revenu',  cat_reve, 'Salaire octobre',           v_compte_id, v_user_id),
  ('2025-11-01',  950.00, 'depense', cat_loge, 'Loyer novembre',            v_compte_id, v_user_id),
  ('2025-11-05',   85.40, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2025-11-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-11-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-11-12',   97.80, 'depense', cat_alim, 'Courses Leclerc',           v_compte_id, v_user_id),
  ('2025-11-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-11-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-11-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-11-22',   68.40, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2025-11-24',  280.00, 'depense', cat_lois, 'Black Friday Amazon',       v_compte_id, v_user_id),
  ('2025-11-26',   47.50, 'depense', cat_alim, 'Restaurant',                v_compte_id, v_user_id),
  ('2025-11-28',   69.80, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),

  -- ─── DÉCEMBRE 2025 ─────────────────────────────────────────────────────────
  ('2025-11-28', 2800.00, 'revenu',  cat_reve, 'Salaire novembre',          v_compte_id, v_user_id),
  ('2025-12-01',  950.00, 'depense', cat_loge, 'Loyer décembre',            v_compte_id, v_user_id),
  ('2025-12-05',   92.30, 'depense', cat_loge, 'EDF hiver',                 v_compte_id, v_user_id),
  ('2025-12-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2025-12-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2025-12-12',  105.60, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2025-12-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2025-12-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2025-12-18',   85.40, 'depense', cat_alim, 'Monoprix',                  v_compte_id, v_user_id),
  ('2025-12-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2025-12-22',  340.00, 'depense', cat_lois, 'Cadeaux Noël',              v_compte_id, v_user_id),
  ('2025-12-24',  180.00, 'depense', cat_alim, 'Repas de Noël',             v_compte_id, v_user_id),
  ('2025-12-26',   78.40, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2025-12-28', 2800.00, 'revenu',  cat_reve, 'Salaire décembre',          v_compte_id, v_user_id),
  ('2025-12-28',  500.00, 'revenu',  cat_reve, 'Prime fin d''année',        v_compte_id, v_user_id),
  ('2025-12-30',  125.60, 'depense', cat_alim, 'Courses fin d''année',      v_compte_id, v_user_id),

  -- ─── JANVIER 2026 ──────────────────────────────────────────────────────────
  ('2026-01-01',  950.00, 'depense', cat_loge, 'Loyer janvier',             v_compte_id, v_user_id),
  ('2026-01-05',   89.70, 'depense', cat_loge, 'EDF hiver',                 v_compte_id, v_user_id),
  ('2026-01-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2026-01-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2026-01-12',   94.30, 'depense', cat_alim, 'Courses Leclerc',           v_compte_id, v_user_id),
  ('2026-01-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2026-01-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2026-01-18',   62.40, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2026-01-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2026-01-22',   48.90, 'depense', cat_alim, 'Restaurant',                v_compte_id, v_user_id),
  ('2026-01-24',   75.30, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2026-01-28', 2800.00, 'revenu',  cat_reve, 'Salaire janvier',           v_compte_id, v_user_id),
  ('2026-01-29',   38.50, 'depense', cat_sant, 'Pharmacie',                 v_compte_id, v_user_id),
  ('2026-01-30',   57.20, 'depense', cat_alim, 'Monoprix',                  v_compte_id, v_user_id),

  -- ─── FÉVRIER 2026 ──────────────────────────────────────────────────────────
  ('2026-02-01',  950.00, 'depense', cat_loge, 'Loyer février',             v_compte_id, v_user_id),
  ('2026-02-05',   95.40, 'depense', cat_loge, 'EDF hiver',                 v_compte_id, v_user_id),
  ('2026-02-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2026-02-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2026-02-12',   88.60, 'depense', cat_alim, 'Courses Carrefour',         v_compte_id, v_user_id),
  ('2026-02-14',   95.00, 'depense', cat_lois, 'Saint-Valentin restaurant', v_compte_id, v_user_id),
  ('2026-02-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2026-02-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2026-02-18',   54.70, 'depense', cat_alim, 'Lidl',                      v_compte_id, v_user_id),
  ('2026-02-20',   35.00, 'depense', cat_sant, 'Salle de sport',            v_compte_id, v_user_id),
  ('2026-02-22',   68.90, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2026-02-25',   42.30, 'depense', cat_alim, 'Courses Monoprix',          v_compte_id, v_user_id),
  ('2026-02-28', 2800.00, 'revenu',  cat_reve, 'Salaire février',           v_compte_id, v_user_id),

  -- ─── MARS 2026 (jusqu'au 20/03) ────────────────────────────────────────────
  ('2026-03-01',  950.00, 'depense', cat_loge, 'Loyer mars',                v_compte_id, v_user_id),
  ('2026-03-05',   88.30, 'depense', cat_loge, 'EDF',                       v_compte_id, v_user_id),
  ('2026-03-06',   89.00, 'depense', cat_alim, 'Courses Leclerc',           v_compte_id, v_user_id),
  ('2026-03-07',   86.40, 'depense', cat_tran, 'Navigo',                    v_compte_id, v_user_id),
  ('2026-03-10',   35.00, 'depense', cat_loge, 'SFR Internet',              v_compte_id, v_user_id),
  ('2026-03-12',   32.90, 'depense', cat_sant, 'Pharmacie',                 v_compte_id, v_user_id),
  ('2026-03-14',   55.60, 'depense', cat_alim, 'Carrefour',                 v_compte_id, v_user_id),
  ('2026-03-15',   17.99, 'depense', cat_lois, 'Netflix',                   v_compte_id, v_user_id),
  ('2026-03-15',   10.99, 'depense', cat_lois, 'Spotify',                   v_compte_id, v_user_id),
  ('2026-03-18',   71.40, 'depense', cat_tran, 'Carburant',                 v_compte_id, v_user_id),
  ('2026-03-20',   48.50, 'depense', cat_alim, 'Restaurant déjeuner',       v_compte_id, v_user_id);

  RAISE NOTICE 'Seed OK — % transactions insérées pour user: % / compte: %',
    (SELECT count(*) FROM transactions WHERE user_id = v_user_id),
    v_user_id,
    v_compte_id;
END;
$$;
