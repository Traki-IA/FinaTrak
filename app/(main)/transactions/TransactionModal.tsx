"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Pencil, Plus, ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { insertTransaction, updateTransaction, upsertCategorie, deleteCategorie } from "./actions";
import type { TCategorie, TObjectif, TBudgetItem, TTransactionWithCategorie } from "@/types";

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#06b6d4", "#84cc16", "#6b7280",
];

interface ITransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TCategorie[];
  objectifs: TObjectif[];
  budgetItems: TBudgetItem[];
  transaction?: TTransactionWithCategorie;
  compteId: string;
}

const INITIAL_FORM = {
  montant: "",
  type: "depense" as "revenu" | "depense",
  categorie_id: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  objectif_id: "",
  budget_item_id: "",
};

export default function TransactionModal({
  open,
  onOpenChange,
  categories,
  objectifs,
  budgetItems,
  transaction,
  compteId,
}: ITransactionModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(transaction);

  // Local categories state (for optimistic updates)
  const [localCategories, setLocalCategories] = useState<TCategorie[]>(categories);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [catForm, setCatForm] = useState<{ id?: string; nom: string; couleur: string } | null>(null);
  const [catSaving, setCatSaving] = useState(false);

  function buildForm(t: TTransactionWithCategorie) {
    return {
      montant: t.montant.toString(),
      type: t.type,
      categorie_id: t.categorie_id ?? "",
      description: t.description ?? "",
      date: t.date,
      objectif_id: "",
      budget_item_id: t.budget_item_id ?? "",
    };
  }

  const [form, setForm] = useState(() =>
    transaction ? buildForm(transaction) : INITIAL_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form when transaction prop changes (React render-time adjustment)
  const [prevTransactionId, setPrevTransactionId] = useState(transaction?.id);
  if (transaction?.id !== prevTransactionId) {
    setPrevTransactionId(transaction?.id);
    setForm(transaction ? buildForm(transaction) : INITIAL_FORM);
    setErrors({});
  }

  function set<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
    onOpenChange(nextOpen);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    const montant = parseFloat(form.montant);
    if (!form.montant || isNaN(montant) || montant <= 0)
      next.montant = "Montant invalide (doit être > 0)";
    if (!form.date) next.date = "La date est requise";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCatSave() {
    if (!catForm || !catForm.nom.trim()) return;
    setCatSaving(true);
    const result = await upsertCategorie({ id: catForm.id, nom: catForm.nom.trim(), couleur: catForm.couleur });
    setCatSaving(false);
    if ("error" in result) { toast.error(result.error); return; }
    if (catForm.id) {
      setLocalCategories((prev) => prev.map((c) => c.id === catForm.id ? { ...c, nom: catForm.nom.trim(), couleur: catForm.couleur } : c));
    } else {
      const newCat: TCategorie = { id: crypto.randomUUID(), nom: catForm.nom.trim(), couleur: catForm.couleur, icone: "", sort_order: 0, created_at: new Date().toISOString() };
      setLocalCategories((prev) => [...prev, newCat]);
      set("categorie_id", newCat.id);
    }
    setCatForm(null);
  }

  async function handleCatDelete(id: string) {
    const result = await deleteCategorie(id);
    if ("error" in result) { toast.error(result.error); return; }
    setLocalCategories((prev) => prev.filter((c) => c.id !== id));
    if (form.categorie_id === id) set("categorie_id", "");
    setCatForm(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isEditMode && transaction) {
      const result = await updateTransaction({
        id: transaction.id,
        montant: parseFloat(form.montant),
        type: form.type,
        categorie_id: form.categorie_id || null,
        description: form.description || null,
        date: form.date,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Transaction modifiée !");
    } else {
      const result = await insertTransaction({
        montant: parseFloat(form.montant),
        type: form.type,
        categorie_id: form.categorie_id || null,
        description: form.description || null,
        date: form.date,
        compte_id: compteId,
        objectif_id: form.objectif_id || null,
        budget_item_id: form.budget_item_id || null,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.objectifUpdated) {
        const objectif = objectifs.find((o) => o.id === form.objectif_id);
        toast.success(
          `Transaction ajoutée · Progression de « ${objectif?.nom} » mise à jour`
        );
      } else {
        toast.success("Transaction ajoutée !");
      }
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content className="fixed z-50 bg-[#0f0f1a] border-white/[0.1] shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out inset-x-0 bottom-0 border-t rounded-t-2xl p-6 pb-10 max-h-[92dvh] overflow-y-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:border sm:rounded-2xl sm:pb-6 sm:max-h-[90dvh] sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">
              {isEditMode ? "Modifier la transaction" : "Nouvelle transaction"}
            </Dialog.Title>
            <Dialog.Close className="text-white/40 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/[0.06]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Montant */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Montant (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={form.montant}
                onChange={(e) => set("montant", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors"
              />
              {errors.montant && (
                <p className="text-red-400 text-xs">{errors.montant}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">Type</label>
              <div className="flex gap-2">
                {(["depense", "revenu"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("type", t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      form.type === t
                        ? t === "revenu"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-red-500/15 border-red-500/40 text-red-400"
                        : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {t === "revenu" ? "Revenu" : "Dépense"}
                  </button>
                ))}
              </div>
            </div>

            {/* Catégorie */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">Catégorie</label>

              {/* Bouton sélection */}
              <button
                type="button"
                onClick={() => { setCatPickerOpen((v) => !v); setCatForm(null); }}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 text-left transition-colors hover:border-white/20"
              >
                {form.categorie_id ? (
                  <>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: localCategories.find((c) => c.id === form.categorie_id)?.couleur ?? "#6b7280" }} />
                    <span>{localCategories.find((c) => c.id === form.categorie_id)?.nom ?? "—"}</span>
                  </>
                ) : (
                  <span className="text-white/40">Aucune catégorie</span>
                )}
                <span className="ml-auto text-white/30 text-xs">{catPickerOpen ? "▲" : "▼"}</span>
              </button>

              {/* Picker inline */}
              <AnimatePresence>
                {catPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-white/[0.1] overflow-hidden bg-white/[0.03]">
                      <AnimatePresence mode="wait">
                        {catForm ? (
                          /* ── Formulaire catégorie ── */
                          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }} className="p-3 space-y-3">
                            {/* Header form */}
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setCatForm(null)} className="text-white/40 hover:text-white transition-colors">
                                <ArrowLeft size={14} />
                              </button>
                              <span className="text-sm font-medium text-white">{catForm.id ? "Modifier" : "Nouvelle catégorie"}</span>
                            </div>
                            {/* Nom */}
                            <input
                              type="text"
                              placeholder="Nom de la catégorie"
                              value={catForm.nom}
                              onChange={(e) => setCatForm((f) => f ? { ...f, nom: e.target.value } : f)}
                              className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/60"
                            />
                            {/* Palette couleurs */}
                            <div>
                              <p className="text-[10px] text-white/40 uppercase tracking-[0.08em] mb-2">Couleur</p>
                              <div className="grid grid-cols-7 gap-2">
                                {COLOR_PALETTE.map((col) => (
                                  <button
                                    key={col}
                                    type="button"
                                    onClick={() => setCatForm((f) => f ? { ...f, couleur: col } : f)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                                    style={{ background: col, outline: catForm.couleur === col ? `2px solid white` : "none", outlineOffset: "2px" }}
                                  >
                                    {catForm.couleur === col && <Check size={12} className="text-white" />}
                                  </button>
                                ))}
                                {/* Custom color picker */}
                                <label className="relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 border-2 border-dashed border-white/30 hover:border-white/60"
                                  style={!COLOR_PALETTE.includes(catForm.couleur) ? { background: catForm.couleur, border: "2px solid white" } : {}}>
                                  {!COLOR_PALETTE.includes(catForm.couleur)
                                    ? <Check size={12} className="text-white" />
                                    : <Plus size={12} className="text-white/50" />}
                                  <input
                                    type="color"
                                    value={catForm.couleur}
                                    onChange={(e) => setCatForm((f) => f ? { ...f, couleur: e.target.value } : f)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                </label>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-2">
                              {catForm.id && (
                                <button type="button" onClick={() => handleCatDelete(catForm.id!)} className="px-3 py-2 rounded-lg text-[12px] font-medium text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors">
                                  Supprimer
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleCatSave}
                                disabled={catSaving || !catForm.nom.trim()}
                                className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-1"
                              >
                                {catSaving && <Loader2 size={11} className="animate-spin" />}
                                Enregistrer
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          /* ── Liste catégories ── */
                          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            {/* Aucune */}
                            <button
                              type="button"
                              onClick={() => { set("categorie_id", ""); setCatPickerOpen(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/40 hover:bg-white/[0.05] transition-colors border-b border-white/[0.06]"
                            >
                              <span className="w-3 h-3 rounded-full bg-white/10 shrink-0" />
                              <span>Aucune catégorie</span>
                              {!form.categorie_id && <Check size={12} className="ml-auto text-orange-500" />}
                            </button>
                            {/* Liste */}
                            {localCategories.map((cat) => (
                              <div key={cat.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors">
                                <button
                                  type="button"
                                  onClick={() => { set("categorie_id", cat.id); setCatPickerOpen(false); }}
                                  className="flex items-center gap-2 flex-1 text-sm text-white text-left"
                                >
                                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.couleur }} />
                                  <span>{cat.nom}</span>
                                  {form.categorie_id === cat.id && <Check size={12} className="text-orange-500" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCatForm({ id: cat.id, nom: cat.nom, couleur: cat.couleur })}
                                  className="text-white/25 hover:text-white/60 transition-colors p-1"
                                >
                                  <Pencil size={11} />
                                </button>
                              </div>
                            ))}
                            {/* Nouvelle */}
                            <button
                              type="button"
                              onClick={() => setCatForm({ nom: "", couleur: COLOR_PALETTE[0] })}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-orange-400 hover:bg-white/[0.05] transition-colors"
                            >
                              <Plus size={13} />
                              <span>Nouvelle catégorie</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Description{" "}
                <span className="text-white/30 font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="Ex : Courses Monoprix"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={255}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
              {errors.date && (
                <p className="text-red-400 text-xs">{errors.date}</p>
              )}
            </div>

            {/* Objectif lié — création uniquement */}
            {!isEditMode && objectifs.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm text-white/60 font-medium">
                  Lier à un objectif{" "}
                  <span className="text-white/30 font-normal">(optionnel)</span>
                </label>
                <select
                  value={form.objectif_id}
                  onChange={(e) => {
                    set("objectif_id", e.target.value);
                    set("budget_item_id", "");
                  }}
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer appearance-none"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" className="bg-[#0f0f1a]">
                    Aucun objectif
                  </option>
                  {objectifs.map((obj) => {
                    const pct = Math.min(
                      Math.round(
                        (obj.montant_actuel / obj.montant_cible) * 100
                      ),
                      100
                    );
                    return (
                      <option
                        key={obj.id}
                        value={obj.id}
                        className="bg-[#0f0f1a]"
                      >
                        {obj.nom} ({pct}%)
                      </option>
                    );
                  })}
                </select>

                {/* Sélecteur de ligne de budget — conditionnel */}
                {form.objectif_id &&
                  (() => {
                    const linkedBudgetItems = budgetItems.filter(
                      (bi) => bi.objectif_id === form.objectif_id
                    );
                    if (linkedBudgetItems.length === 0) return null;
                    return (
                      <div className="space-y-1.5">
                        <label className="text-sm text-white/60 font-medium">
                          Ligne de budget{" "}
                          <span className="text-white/30 font-normal">
                            (optionnel)
                          </span>
                        </label>
                        <select
                          value={form.budget_item_id}
                          onChange={(e) => set("budget_item_id", e.target.value)}
                          className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer appearance-none"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="" className="bg-[#0f0f1a]">
                            Aucune ligne
                          </option>
                          {linkedBudgetItems.map((bi) => (
                            <option
                              key={bi.id}
                              value={bi.id}
                              className="bg-[#0f0f1a]"
                            >
                              {bi.nom} ({new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              }).format(bi.montant)})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}

                {/* Aperçu de la progression si un objectif est sélectionné */}
                {form.objectif_id &&
                  (() => {
                    const obj = objectifs.find((o) => o.id === form.objectif_id);
                    const montantSaisi = parseFloat(form.montant) || 0;
                    if (!obj) return null;
                    const apres = Math.min(
                      obj.montant_actuel + montantSaisi,
                      obj.montant_cible
                    );
                    const pctApres = Math.round(
                      (apres / obj.montant_cible) * 100
                    );
                    return (
                      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs space-y-1.5">
                        <p className="text-white/50">
                          Progression après ajout :
                        </p>
                        <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all duration-300"
                            style={{ width: `${pctApres}%` }}
                          />
                        </div>
                        <p className="text-white/70 font-medium">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(apres)}{" "}
                          /{" "}
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(obj.montant_cible)}{" "}
                          <span className="text-orange-400">({pctApres}%)</span>
                        </p>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all"
                >
                  Annuler
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-all"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting
                  ? isEditMode
                    ? "Modification…"
                    : "Ajout en cours…"
                  : isEditMode
                  ? "Modifier"
                  : "Ajouter"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
