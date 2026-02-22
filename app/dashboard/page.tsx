import BalanceChart from "./BalanceChart";
import CategoryChart from "./CategoryChart";

// ── Mock data (à remplacer par des requêtes Supabase) ───────────────────────

const balanceData = [
  { mois: "Sep", solde: 3200, depenses: 1800 },
  { mois: "Oct", solde: 3800, depenses: 1650 },
  { mois: "Nov", solde: 3100, depenses: 2100 },
  { mois: "Déc", solde: 4200, depenses: 1400 },
  { mois: "Jan", solde: 3900, depenses: 1950 },
  { mois: "Fév", solde: 4650, depenses: 1850 },
];

const categoriesData = [
  { nom: "Alimentation", valeur: 420, couleur: "#f97316" },
  { nom: "Logement",     valeur: 900, couleur: "#6366f1" },
  { nom: "Transport",    valeur: 180, couleur: "#3b82f6" },
  { nom: "Loisirs",      valeur: 220, couleur: "#ec4899" },
  { nom: "Autres",       valeur: 130, couleur: "#94a3b8" },
];

const dernieresTransactions = [
  { id: "1", description: "Courses Carrefour",  montant: -87.5,   date: "22 fév", categorie: "Alimentation", couleur: "#f97316" },
  { id: "2", description: "Salaire février",    montant: 2800.0,  date: "20 fév", categorie: "Revenus",      couleur: "#22c55e" },
  { id: "3", description: "Loyer",              montant: -900.0,  date: "01 fév", categorie: "Logement",     couleur: "#6366f1" },
  { id: "4", description: "Netflix",            montant: -13.99,  date: "18 fév", categorie: "Loisirs",      couleur: "#ec4899" },
  { id: "5", description: "Station essence",    montant: -65.0,   date: "15 fév", categorie: "Transport",    couleur: "#3b82f6" },
];

const kpis = [
  { label: "Solde total",      valeur: 4650, variation: "+19,2 %", positif: true  },
  { label: "Revenus du mois",  valeur: 2800, variation: "+0 %",    positif: true  },
  { label: "Dépenses du mois", valeur: 1850, variation: "-6,3 %",  positif: false },
  { label: "Épargne nette",    valeur: 950,  variation: "+15,1 %", positif: true  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Page (Server Component) ──────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 lg:px-8 lg:py-8">

      {/* ── Header ── */}
      <header className="mb-8">
        <p className="text-xs text-white/35 uppercase tracking-widest font-medium mb-1">
          Février 2026
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      </header>

      {/* ── KPI cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5"
          >
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold tabular-nums leading-none">
              {formatEur(kpi.valeur)}
              <span className="text-sm text-white/40 font-normal ml-1">€</span>
            </p>
            <p
              className={`text-xs mt-2.5 font-medium ${
                kpi.positif ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {kpi.positif ? "▲" : "▼"} {kpi.variation} ce mois
            </p>
          </div>
        ))}
      </section>

      {/* ── Charts row ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">

        {/* Area chart — solde & dépenses */}
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
            Évolution du solde
          </p>
          <p className="text-xl font-bold tabular-nums mb-6">
            4 650,00
            <span className="text-sm text-white/40 font-normal ml-1">€</span>
          </p>

          {/* Legend */}
          <div className="flex gap-4 mb-4">
            {[
              { label: "Solde",    couleur: "#f97316" },
              { label: "Dépenses", couleur: "#6366f1" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-white/40">
                <span className="w-2 h-2 rounded-full" style={{ background: l.couleur }} />
                {l.label}
              </div>
            ))}
          </div>

          <BalanceChart data={balanceData} />
        </div>

        {/* Donut chart — catégories */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
            Dépenses par catégorie
          </p>
          <p className="text-xl font-bold tabular-nums mb-4">
            1 850,00
            <span className="text-sm text-white/40 font-normal ml-1">€</span>
          </p>
          <CategoryChart data={categoriesData} />
        </div>
      </section>

      {/* ── Recent transactions ── */}
      <section className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">
            Dernières transactions
          </p>
          <a
            href="/transactions"
            className="text-xs text-white/35 hover:text-white/80 transition-colors"
          >
            Voir tout →
          </a>
        </div>

        <ul className="divide-y divide-white/[0.05]">
          {dernieresTransactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                {/* Avatar catégorie */}
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: `${tx.couleur}18`,
                    color: tx.couleur,
                  }}
                >
                  {tx.categorie[0]}
                </span>

                <div>
                  <p className="text-sm font-medium leading-tight">{tx.description}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {tx.date} · {tx.categorie}
                  </p>
                </div>
              </div>

              <span
                className={`text-sm font-semibold tabular-nums ${
                  tx.montant > 0 ? "text-emerald-400" : "text-white/70"
                }`}
              >
                {tx.montant > 0 ? "+" : ""}
                {formatEur(tx.montant)} €
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
