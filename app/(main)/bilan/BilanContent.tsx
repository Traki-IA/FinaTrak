"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Shell from "@/components/layout/Shell";
import BarComp from "@/components/ui/Bar";
import { formatEur } from "@/lib/format";
import type { TBilanMois, TDashboardStats } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type TPeriod = "3m" | "6m";

// ── Helpers ───────────────────────────────────────────────────────────────────

function savingsColor(taux: number): string {
  if (taux >= 50) return "#22c55e";
  if (taux >= 30) return "#14b8a6";
  if (taux >= 10) return "#f97316";
  return "#ef4444";
}

// ── Custom tooltip for Recharts ───────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-white/40 mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-semibold">{formatEur(p.value)} €</span>
        </div>
      ))}
    </div>
  );
}

// ── Desktop KPI Card ──────────────────────────────────────────────────────────

function KpiCard({ label, value, color, pct }: { label: string; value: string; color: string; pct: number }) {
  return (
    <div className="flex-1 bg-[#0d0d1a] border border-white/[0.06] rounded-xl p-3">
      <p className="text-[9px] text-white/28 uppercase tracking-[0.14em] font-semibold mb-1">{label}</p>
      <p className="text-[18px] font-[900] tracking-tight mb-2 leading-none" style={{ color }}>{value}</p>
      <BarComp pct={pct} color={color} height={3} />
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface IBilanContentProps {
  parMois: TBilanMois[];
  stats: TDashboardStats;
}

// ── Desktop Bilan ─────────────────────────────────────────────────────────────

function DesktopBilan({ parMois }: IBilanContentProps) {
  const [period, setPeriod] = useState<TPeriod>("6m");
  const bars = period === "3m" ? parMois.slice(-3) : parMois;

  const totR = bars.reduce((s, b) => s + b.revenus, 0);
  const totD = bars.reduce((s, b) => s + b.depenses, 0);
  const totEp = bars.reduce((s, b) => s + b.epargne, 0);
  const tauxMoy = totR > 0 ? Math.round((totEp / totR) * 100) : 0;

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-0"
      >
        <div>
          <h1 className="text-[22px] font-black tracking-tight">Bilan</h1>
          <p className="text-[10px] text-white/28 mt-0.5">Historique financier</p>
        </div>
        <div className="flex gap-1">
          {(["3m", "6m"] as TPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
              style={{
                background: period === p ? "rgba(249,115,22,0.15)" : "transparent",
                color: period === p ? "#f97316" : "rgba(255,255,255,0.28)",
                border: period === p ? "1px solid rgba(249,115,22,0.25)" : "1px solid transparent",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="h-px bg-white/[0.06] my-3" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="flex gap-3 mb-4">
          <KpiCard label="Revenus" value={`${formatEur(totR)} €`} color="#22c55e" pct={Math.min(100, Math.round(totR / 20000 * 100))} />
          <KpiCard label="Dépenses" value={`${formatEur(totD)} €`} color="#ef4444" pct={Math.min(100, Math.round(totD / 10000 * 100))} />
          <KpiCard label="Épargne" value={`${formatEur(totEp)} €`} color="#f97316" pct={Math.min(100, Math.max(0, Math.round(totEp / 5000 * 100)))} />
          <KpiCard label="Taux moy." value={`${tauxMoy}%`} color={savingsColor(tauxMoy)} pct={Math.max(0, tauxMoy)} />
        </div>
      </motion.div>

      {bars.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4 bg-[#0d0d1a] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] text-white/28 uppercase tracking-[0.14em] font-semibold mb-3">Revenus vs Dépenses</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={bars} barGap={3} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mois" tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="revenus" name="Revenus" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="depenses" name="Dépenses" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      ) : (
        <div className="text-center py-12 text-white/28 text-[11px]">Aucune donnée pour cette période</div>
      )}

      {bars.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-[9px] text-white/28 uppercase tracking-[0.14em] font-semibold mb-3">
            Taux d&apos;épargne par mois
          </p>
          <div className="grid grid-cols-2 gap-2">
            {bars.map((b, i) => {
              const taux = b.revenus > 0 ? Math.round((b.epargne / b.revenus) * 100) : 0;
              const color = savingsColor(taux);
              return (
                <motion.div
                  key={b.moisKey}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  className="bg-[#0d0d1a] border border-white/[0.06] rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-white capitalize">{b.mois}</span>
                    <span className="text-[11px] font-bold" style={{ color }}>{taux}%</span>
                  </div>
                  <BarComp pct={Math.max(0, taux)} color={color} height={3} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] text-white/28">{formatEur(b.revenus)} € rev.</span>
                    <span className="text-[9px]" style={{ color: b.epargne >= 0 ? "#22c55e" : "#ef4444" }}>
                      {b.epargne >= 0 ? "+" : ""}{formatEur(b.epargne)} €
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </Shell>
  );
}

// ── Mobile Bilan (Pulse Flat) ─────────────────────────────────────────────────

function MobileBilan({ parMois }: IBilanContentProps) {
  const [period, setPeriod] = useState<TPeriod>("6m");
  const bars = period === "3m" ? parMois.slice(-3) : parMois;

  const totR = bars.reduce((s, b) => s + b.revenus, 0);
  const totD = bars.reduce((s, b) => s + b.depenses, 0);
  const totEp = bars.reduce((s, b) => s + b.epargne, 0);
  const tauxMoy = totR > 0 ? Math.round((totEp / totR) * 100) : 0;

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-0">
        <div>
          <h1 className="text-[22px] font-black tracking-tight">Bilan</h1>
          <p className="text-[10px] text-white/50 mt-0.5">Historique financier</p>
        </div>
        <div className="flex gap-1">
          {(["3m", "6m"] as TPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
              style={{
                background: period === p ? "rgba(249,115,22,0.15)" : "transparent",
                color: period === p ? "#f97316" : "rgba(255,255,255,0.28)",
                border: period === p ? "1px solid rgba(249,115,22,0.25)" : "1px solid transparent",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-white/[0.05] my-3" />

      {/* KPIs Pulse Flat — 3 colonnes */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="flex mb-4">
          <div className="flex-1 px-3 py-2 first:pl-0">
            <p className="text-[9px] text-white/55 uppercase tracking-[0.12em] font-semibold">Revenus</p>
            <p className="text-[15px] font-[800] tracking-tight mt-1 leading-none text-emerald-400">{formatEur(totR)} €</p>
          </div>
          <div className="border-r border-white/[0.05]" />
          <div className="flex-1 px-3 py-2">
            <p className="text-[9px] text-white/55 uppercase tracking-[0.12em] font-semibold">Dépenses</p>
            <p className="text-[15px] font-[800] tracking-tight mt-1 leading-none text-red-400">{formatEur(totD)} €</p>
          </div>
          <div className="border-r border-white/[0.05]" />
          <div className="flex-1 px-3 py-2 last:pr-0">
            <p className="text-[9px] text-white/55 uppercase tracking-[0.12em] font-semibold">Épargne</p>
            <p className="text-[15px] font-[800] tracking-tight mt-1 leading-none text-orange-400">{formatEur(totEp)} €</p>
          </div>
        </div>
      </motion.div>

      {/* Bar Chart */}
      {bars.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
          <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold mb-3">Revenus vs Dépenses</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={bars} barGap={3} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mois" tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="revenus" name="Revenus" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="depenses" name="Dépenses" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      ) : (
        <div className="text-center py-10 text-white/50 text-[10px]">Aucune donnée pour cette période</div>
      )}

      {/* Taux d'épargne par mois — Pulse Flat */}
      {bars.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold mb-2">
            Taux d&apos;épargne par mois
          </p>
          <div className="space-y-0">
            {bars.map((b, i) => {
              const taux = b.revenus > 0 ? Math.round((b.epargne / b.revenus) * 100) : 0;
              const color = savingsColor(taux);
              return (
                <motion.div
                  key={b.moisKey}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  className="border-b border-white/[0.05] py-2.5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-[600] text-white capitalize">{b.mois}</span>
                    <span className="text-[15px] font-[800]" style={{ color }}>{taux}%</span>
                  </div>
                  <BarComp pct={Math.max(0, taux)} color={color} height={2} className="opacity-60" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-white/50">{formatEur(b.revenus)} € rev.</span>
                    <span className="text-[10px]" style={{ color: b.epargne >= 0 ? "#22c55e" : "#ef4444" }}>
                      {b.epargne >= 0 ? "+" : ""}{formatEur(b.epargne)} €
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Taux moyen période */}
          <div className="mt-4 py-2.5 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold">Taux moyen période</p>
              <span className="text-[15px] font-[800]" style={{ color: savingsColor(tauxMoy) }}>{tauxMoy}%</span>
            </div>
            <BarComp pct={Math.max(0, tauxMoy)} color={savingsColor(tauxMoy)} height={2} className="opacity-60" />
          </div>
        </motion.div>
      )}
    </Shell>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function BilanContent({ parMois, stats }: IBilanContentProps) {
  return (
    <>
      <div className="md:hidden">
        <MobileBilan parMois={parMois} stats={stats} />
      </div>
      <div className="hidden md:block">
        <DesktopBilan parMois={parMois} stats={stats} />
      </div>
    </>
  );
}
