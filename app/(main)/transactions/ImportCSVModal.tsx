"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, ChevronRight, Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { parseCSVBancaire } from "@/lib/csv-import";
import { bulkInsertTransactions } from "./actions";
import type { TCSVRow } from "@/lib/csv-import";
import type { TCategorie } from "@/types";

interface IImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TCategorie[];
  compteId: string;
}

type TStep = "upload" | "mapping" | "done";

function formatMontant(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ImportCSVModal({ open, onOpenChange, categories, compteId }: IImportCSVModalProps) {
  const [step, setStep] = useState<TStep>("upload");
  const [rows, setRows] = useState<TCSVRow[]>([]);
  const [csvCategories, setCsvCategories] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({}); // csvCat → categorie_id | null
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    if (importing) return;
    onOpenChange(false);
    setTimeout(() => {
      setStep("upload");
      setRows([]);
      setCsvCategories([]);
      setParseErrors([]);
      setMapping({});
      setImportCount(0);
    }, 300);
  }

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Veuillez sélectionner un fichier .csv");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSVBancaire(text);
      setRows(result.rows);
      setCsvCategories(result.categories);
      setParseErrors(result.errors);

      // Init mapping : null = pas de catégorie
      const initMapping: Record<string, string | null> = {};
      for (const cat of result.categories) {
        // Auto-match par nom similaire
        const match = categories.find(
          (c) => c.nom.toLowerCase() === cat.toLowerCase()
        );
        initMapping[cat] = match?.id ?? null;
      }
      setMapping(initMapping);
      setStep("mapping");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    setImporting(true);
    const toInsert = rows.map((r) => ({
      date: r.date,
      description: r.description,
      montant: r.montant,
      type: r.type,
      categorie_id: mapping[r.categorieLabel] ?? null,
      compte_id: compteId,
    }));

    const result = await bulkInsertTransactions(toInsert);
    setImporting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setImportCount(result.count);
    setStep("done");
  }

  const totalDepenses = rows.filter((r) => r.type === "depense").reduce((s, r) => s + r.montant, 0);
  const totalRevenus = rows.filter((r) => r.type === "revenu").reduce((s, r) => s + r.montant, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] overflow-hidden"
            style={{ background: "var(--bg2)", maxHeight: "90dvh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-[15px] font-semibold text-[var(--text)]">Importer un CSV</span>
              <button onClick={handleClose} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.06] text-[var(--text2)]">
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(90dvh - 60px)" }}>

              {/* ── STEP 1 : UPLOAD ─────────────────────────────────── */}
              {step === "upload" && (
                <div className="p-4 flex flex-col gap-4">
                  <p className="text-[13px] text-[var(--text2)] leading-relaxed">
                    Importe tes transactions depuis un export CSV de ta banque.
                    Format supporté : séparateur <span className="text-[var(--text)] font-medium">;</span>, colonnes Date, Libellé, Débit, Crédit.
                  </p>

                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 py-10 rounded-[14px] border-2 border-dashed text-[var(--text3)] transition-colors hover:text-[var(--text2)] hover:border-[var(--border2)]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Upload size={28} />
                    <span className="text-[13px]">Appuyer pour sélectionner un fichier CSV</span>
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>
              )}

              {/* ── STEP 2 : MAPPING ────────────────────────────────── */}
              {step === "mapping" && (
                <div className="p-4 flex flex-col gap-4">
                  {/* Résumé */}
                  <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg3)" }}>
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <FileText size={14} className="text-[var(--orange)]" />
                      <span className="text-[13px] font-semibold text-[var(--text)]">{rows.length} transactions détectées</span>
                    </div>
                    <div className="grid grid-cols-2 divide-x" style={{ borderColor: "var(--border)" }}>
                      <div className="px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)] mb-1">Dépenses</div>
                        <div className="text-[15px] font-bold text-[var(--red)]">-{formatMontant(totalDepenses)} €</div>
                        <div className="text-[11px] text-[var(--text3)]">{rows.filter(r => r.type === "depense").length} ops</div>
                      </div>
                      <div className="px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)] mb-1">Revenus</div>
                        <div className="text-[15px] font-bold text-[var(--green)]">+{formatMontant(totalRevenus)} €</div>
                        <div className="text-[11px] text-[var(--text3)]">{rows.filter(r => r.type === "revenu").length} ops</div>
                      </div>
                    </div>
                  </div>

                  {/* Erreurs de parsing */}
                  {parseErrors.length > 0 && (
                    <div className="rounded-[10px] px-3 py-2.5 flex gap-2" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
                      <AlertCircle size={14} className="text-[var(--red)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-semibold text-[var(--red)] mb-0.5">{parseErrors.length} ligne(s) ignorée(s)</p>
                        {parseErrors.slice(0, 3).map((e, i) => (
                          <p key={i} className="text-[11px] text-[var(--red)]/80">{e}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mapping catégories */}
                  {csvCategories.length > 0 && (
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--text2)] uppercase tracking-widest mb-2">
                        Associer les catégories
                      </p>
                      <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        {csvCategories.map((cat, i) => (
                          <div
                            key={cat}
                            className="flex items-center gap-2 px-3 py-2.5"
                            style={{ borderBottom: i < csvCategories.length - 1 ? "1px solid var(--border)" : "none" }}
                          >
                            <span className="flex-1 text-[13px] text-[var(--text)] truncate">{cat}</span>
                            <select
                              value={mapping[cat] ?? ""}
                              onChange={(e) => setMapping((prev) => ({ ...prev, [cat]: e.target.value || null }))}
                              className="text-[12px] rounded-lg px-2 py-1.5 outline-none border"
                              style={{
                                background: "var(--bg3)",
                                color: "var(--text)",
                                borderColor: "var(--border)",
                                maxWidth: 140,
                              }}
                            >
                              <option value="">Sans catégorie</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.nom}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bouton import */}
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full py-3.5 rounded-[12px] font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                    style={{ background: "var(--orange)" }}
                  >
                    {importing ? (
                      <><Loader2 size={16} className="animate-spin" />Import en cours…</>
                    ) : (
                      <><ChevronRight size={16} />Importer {rows.length} transactions</>
                    )}
                  </button>
                </div>
              )}

              {/* ── STEP 3 : DONE ───────────────────────────────────── */}
              {step === "done" && (
                <div className="p-4 flex flex-col items-center gap-4 py-10">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(74,222,128,0.15)" }}>
                    <CheckCircle size={32} className="text-[var(--green)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[17px] font-bold text-[var(--text)] mb-1">{importCount} transactions importées</p>
                    <p className="text-[13px] text-[var(--text2)]">Elles apparaissent maintenant dans ta liste.</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-8 py-3 rounded-[12px] font-semibold text-[14px] text-white"
                    style={{ background: "var(--orange)" }}
                  >
                    Fermer
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
