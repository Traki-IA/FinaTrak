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
  created_at: string;
};

export type TObjectif = {
  id: string;
  nom: string;
  montant_cible: number;
  montant_actuel: number;
  periode: "mensuel" | "annuel" | "ponctuel";
  date_fin: string | null;
  created_at: string;
};

// ── Types composés ───────────────────────────────────────────────────────────

export type TTransactionWithCategorie = TTransaction & {
  categories: TCategorie | null;
};

// ── Types dashboard ──────────────────────────────────────────────────────────

export type TDashboardStats = {
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
