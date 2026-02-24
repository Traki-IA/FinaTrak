// ── Entités base de données ──────────────────────────────────────────────────

export type TTransaction = {
  id: string;
  date: string;
  montant: number;
  type: "depense" | "revenu";
  categorie_id: string | null;
  description: string | null;
  created_at: string;
};

export type TCategorie = {
  id: string;
  nom: string;
  couleur: string;
  icone: string;
  sort_order: number;
  created_at: string;
};

export type TObjectif = {
  id: string;
  nom: string;
  montant_cible: number;
  montant_actuel: number;
  periode: "mensuel" | "annuel" | "ponctuel";
  date_fin: string | null;
  sort_order: number;
  created_at: string;
};

// ── Types composés ───────────────────────────────────────────────────────────

export type TTransactionWithCategorie = TTransaction & {
  categories: TCategorie | null;
};

// ── Budget ───────────────────────────────────────────────────────────────────

export type TBudgetItem = {
  id: string;
  nom: string;
  montant: number;
  frequence: "mensuel" | "annuel";
  categorie_id: string | null;
  objectif_id: string | null;
  actif: boolean;
  sort_order: number;
  created_at: string;
};

export type TBudgetItemWithRelations = TBudgetItem & {
  categories: TCategorie | null;
  objectifs: TObjectif | null;
};

// ── Types dashboard ──────────────────────────────────────────────────────────

export type TDashboardStats = {
  soldeInitial: number;
  soldeTotal: number;
  revenus: number;
  depenses: number;
  epargne: number;
};

export type TBalancePoint = {
  mois: string;
  solde: number;
  depenses: number;
};

export type TDepenseCategorie = {
  nom: string;
  valeur: number;
  couleur: string;
};
