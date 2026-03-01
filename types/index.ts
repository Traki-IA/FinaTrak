// ── Comptes bancaires ────────────────────────────────────────────────────────

export type TCompte = {
  id: string;
  nom: string;
  couleur: string;
  icone: string;
  solde_initial: number;
  sort_order: number;
  created_at: string;
};

// ── Entités base de données ──────────────────────────────────────────────────

export type TTransaction = {
  id: string;
  date: string;
  montant: number;
  type: "depense" | "revenu";
  categorie_id: string | null;
  compte_id: string;
  description: string | null;
  budget_item_id: string | null;
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
  compte_id: string;
  sort_order: number;
  created_at: string;
};

// ── Filtres transactions ─────────────────────────────────────────────────────

export type TTransactionFilters = {
  dateDebut?: string;
  dateFin?: string;
  type?: "depense" | "revenu";
  categorie_ids?: string[];
  montant_min?: number;
  montant_max?: number;
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
  compte_id: string;
  actif: boolean;
  sort_order: number;
  created_at: string;
};

export type TBudgetItemWithRelations = TBudgetItem & {
  categories: TCategorie | null;
  objectifs: TObjectif | null;
};

// ── Types objectifs enrichis ─────────────────────────────────────────────

export type TBudgetLineProgress = {
  id: string;
  nom: string;
  montant: number;
  frequence: "mensuel" | "annuel";
  consomme: number;
  restant: number;
};

export type TObjectifWithBudgetLines = TObjectif & {
  budget_lines: TBudgetLineProgress[];
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
