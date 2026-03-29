export type TCSVRow = {
  date: string;          // YYYY-MM-DD
  description: string;
  montant: number;
  type: "revenu" | "depense";
  categorieLabel: string; // catégorie brute issue du CSV
};

export type TCSVParseResult = {
  rows: TCSVRow[];
  categories: string[];  // catégories uniques trouvées
  errors: string[];
};

/**
 * Parse un CSV exporté depuis une banque française.
 * Format attendu (séparateur `;`) :
 *   Date de comptabilisation;Libelle simplifie;Libelle operation;Categorie;Sous categorie;Debit;Credit
 *
 * Les montants utilisent la virgule comme séparateur décimal.
 * Les dates sont au format DD/MM/YYYY.
 */
export function parseCSVBancaire(text: string): TCSVParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const errors: string[] = [];
  const rows: TCSVRow[] = [];

  if (lines.length < 2) {
    return { rows, categories: [], errors: ["Le fichier est vide ou ne contient pas de données."] };
  }

  // Détection du séparateur (;  ou ,)
  const header = lines[0];
  const sep = header.includes(";") ? ";" : ",";

  // Détection des colonnes par en-tête
  const headers = header.split(sep).map((h) => h.trim().toLowerCase());
  const idx = {
    date: headers.findIndex((h) => h.includes("date")),
    libelle: headers.findIndex((h) => h.includes("libell") && h.includes("simpl")),
    categorie: headers.findIndex((h) => h.includes("categorie") && !h.includes("sous")),
    debit: headers.findIndex((h) => h.includes("debit") || h.includes("débit")),
    credit: headers.findIndex((h) => h.includes("credit") || h.includes("crédit")),
  };

  // Fallback : si libellé simplifié absent, prend le premier libellé
  if (idx.libelle === -1) idx.libelle = headers.findIndex((h) => h.includes("libell"));

  if (idx.date === -1 || idx.debit === -1 || idx.credit === -1) {
    return {
      rows,
      categories: [],
      errors: ["Colonnes obligatoires introuvables (Date, Debit, Credit). Vérifiez le format du fichier."],
    };
  }

  const categoriesSet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(sep);

    const rawDate = parts[idx.date]?.trim() ?? "";
    const libelle = (idx.libelle >= 0 ? parts[idx.libelle]?.trim() : "") ?? "";
    const categorie = (idx.categorie >= 0 ? parts[idx.categorie]?.trim() : "") ?? "";
    const rawDebit = parts[idx.debit]?.trim() ?? "";
    const rawCredit = parts[idx.credit]?.trim() ?? "";

    // Conversion date DD/MM/YYYY → YYYY-MM-DD
    const dateParts = rawDate.split("/");
    if (dateParts.length !== 3) {
      errors.push(`Ligne ${i + 1} : date invalide "${rawDate}"`);
      continue;
    }
    const [day, month, year] = dateParts;
    const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    // Conversion montants (virgule → point)
    const debitVal = rawDebit ? Math.abs(parseFloat(rawDebit.replace(",", "."))) : 0;
    const creditVal = rawCredit ? parseFloat(rawCredit.replace(",", ".")) : 0;

    if (debitVal === 0 && creditVal === 0) continue;

    const type: "revenu" | "depense" = creditVal > 0 ? "revenu" : "depense";
    const montant = creditVal > 0 ? creditVal : debitVal;

    if (isNaN(montant) || montant <= 0) {
      errors.push(`Ligne ${i + 1} : montant invalide`);
      continue;
    }

    if (categorie) categoriesSet.add(categorie);

    rows.push({ date, description: libelle, montant, type, categorieLabel: categorie });
  }

  return {
    rows,
    categories: Array.from(categoriesSet).sort(),
    errors,
  };
}
