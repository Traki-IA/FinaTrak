"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Receipt,
  TrendingDown,
  CalendarDays,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import BudgetModal from "./BudgetModal";
import { toggleBudgetItem, deleteBudgetItem } from "./actions";
import type { TBudgetItemWithRelations, TCategorie, TObjectif } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function annualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "mensuel" ? montant * 12 : montant;
}

function mensualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "annuel" ? montant / 12 : montant;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">
            {label}
          </p>
          <span
            className="p-1.5 rounded-lg"
            style={{ background: `${color}18`, color }}
          >
            {icon}
          </span>
        </div>
        <p className="text-2xl font-bold text-white tabular-nums leading-none">
          {value}
        </p>
        <p className="text-xs text-white/35 mt-2">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-orange-500" : "bg-white/[0.15]"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

// ── Budget Item Row ───────────────────────────────────────────────────────────

function BudgetItemRow({ item }: { item: TBudgetItemWithRelations }) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleToggle(actif: boolean) {
    setToggling(true);
    const result = await toggleBudgetItem(item.id, actif);
    setToggling(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteBudgetItem(item.id);
    setDeleting(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Charge supprimée");
    router.refresh();
  }

  const couleur = item.categories?.couleur ?? "#94a3b8";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
        item.actif
          ? "bg-white/[0.04] border-white/[0.07] hover:border-white/[0.12]"
          : "bg-white/[0.01] border-white/[0.04] opacity-50"
      }`}
    >
      {/* Icône catégorie */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: `${couleur}18`, color: couleur }}
      >
        {item.nom[0]?.toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.nom}</p>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
          {item.categories && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
              style={{
                background: `${couleur}18`,
                color: couleur,
              }}
            >
              {item.categories.nom}
            </span>
          )}
          {item.objectifs && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 flex items-center gap-1">
              <Link2 size={9} />
              {item.objectifs.nom}
            </span>
          )}
        </div>
      </div>

      {/* Montant */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-white tabular-nums">
          {formatEur(item.montant)}
        </p>
        <p className="text-[10px] text-white/35">
          /{item.frequence === "mensuel" ? "mois" : "an"}
        </p>
      </div>

      {/* Toggle */}
      <Toggle
        checked={item.actif}
        onChange={handleToggle}
        disabled={toggling}
      />

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-white/25 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 flex-shrink-0 disabled:opacity-50"
      >
        {deleting ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Trash2 size={15} />
        )}
      </button>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
        <Receipt size={24} className="text-orange-400" />
      </div>
      <p className="text-white font-semibold mb-1">Aucune charge planifiée</p>
      <p className="text-white/40 text-sm mb-6">
        Ajoutez vos charges fixes pour visualiser votre budget annuel
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
      >
        <Plus size={16} />
        Ajouter une charge
      </button>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  items,
  totalLabel,
  total,
}: {
  title: string;
  icon: React.ReactNode;
  items: TBudgetItemWithRelations[];
  totalLabel: string;
  total: number;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
          {icon}
          {title}
          <span className="text-white/25 text-xs font-normal ml-1">
            ({items.length})
          </span>
        </div>
        <span className="text-xs text-white/40">
          {totalLabel} :{" "}
          <span className="text-white/70 font-medium">{formatEur(total)}</span>
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {items.map((item) => (
            <BudgetItemRow key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface IBudgetContentProps {
  items: TBudgetItemWithRelations[];
  categories: TCategorie[];
  objectifs: TObjectif[];
}

export default function BudgetContent({
  items,
  categories,
  objectifs,
}: IBudgetContentProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const actifs = items.filter((i) => i.actif);
  const mensuels = items.filter((i) => i.frequence === "mensuel");
  const annuels = items.filter((i) => i.frequence === "annuel");

  const budgetMensuel = actifs.reduce(
    (sum, i) => sum + mensualise(i.montant, i.frequence),
    0
  );
  const budgetAnnuel = actifs.reduce(
    (sum, i) => sum + annualise(i.montant, i.frequence),
    0
  );

  const totalMensuels = mensuels
    .filter((i) => i.actif)
    .reduce((s, i) => s + i.montant, 0);
  const totalAnnuels = annuels
    .filter((i) => i.actif)
    .reduce((s, i) => s + i.montant, 0);

  const linkedObjectifs = new Set(
    items.filter((i) => i.objectif_id).map((i) => i.objectif_id)
  ).size;

  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Budget annuel</h1>
          <p className="text-white/40 text-sm mt-1">
            {items.length} charge{items.length !== 1 ? "s" : ""} planifiée
            {items.length !== 1 ? "s" : ""}
            {actifs.length !== items.length && (
              <span className="text-white/25 ml-1">
                · {actifs.length} active{actifs.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {items.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Ajouter
          </motion.button>
        )}
      </motion.div>

      {items.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <>
          {/* ── KPIs ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
          >
            <KpiCard
              label="Budget mensuel"
              value={formatEur(budgetMensuel)}
              sub="Charges fixes / mois"
              icon={<TrendingDown size={16} />}
              color="#f97316"
            />
            <KpiCard
              label="Budget annuel"
              value={formatEur(budgetAnnuel)}
              sub="Projection sur 12 mois"
              icon={<CalendarDays size={16} />}
              color="#6366f1"
            />
            <KpiCard
              label="Objectifs liés"
              value={String(linkedObjectifs)}
              sub={`sur ${items.length} charge${items.length !== 1 ? "s" : ""}`}
              icon={<Link2 size={16} />}
              color="#14b8a6"
            />
          </motion.div>

          {/* ── Sections ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            <Section
              title="Charges mensuelles"
              icon={<CalendarDays size={15} />}
              items={mensuels}
              totalLabel="Total actif / mois"
              total={totalMensuels}
            />
            <Section
              title="Charges annuelles"
              icon={<Receipt size={15} />}
              items={annuels}
              totalLabel="Total actif / an"
              total={totalAnnuels}
            />
          </motion.div>
        </>
      )}

      <BudgetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        categories={categories}
        objectifs={objectifs}
      />
    </main>
  );
}
