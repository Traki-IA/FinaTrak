"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Wallet, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { updateSoldeInitial } from "./actions";

interface IParametresContentProps {
  soldeInitial: number;
  isLocked: boolean;
}

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default function ParametresContent({
  soldeInitial,
  isLocked,
}: IParametresContentProps) {
  const [inputValue, setInputValue] = useState(String(soldeInitial));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const montant = parseFloat(inputValue.replace(",", "."));
    if (isNaN(montant)) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    startTransition(async () => {
      const result = await updateSoldeInitial(montant);
      if (result.success) {
        setSaved(true);
        toast.success("Solde initial enregistré");
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour");
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 lg:px-8 lg:py-8">
      {/* ── Header ── */}
      <motion.header
        className="mb-8"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs text-white/35 uppercase tracking-widest font-medium mb-1">
          Configuration
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      </motion.header>

      <motion.div
        variants={FADE_UP}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.35 }}
        className="max-w-lg"
      >
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wallet size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  Solde initial
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  Montant de départ avant toute transaction
                </p>
              </div>
              {isLocked && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/40 text-xs font-medium">
                  <Lock size={11} />
                  Verrouillé
                </span>
              )}
            </div>

            {isLocked ? (
              /* ── Locked: read-only display ── */
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                    Montant (€)
                  </p>
                  <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
                    <Lock size={15} className="text-white/25 flex-shrink-0" />
                    <span className="text-white text-lg font-semibold tabular-nums">
                      {formatEur(soldeInitial)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-white/25">
                  Le solde initial a été défini et ne peut plus être modifié.
                  Il est utilisé pour calculer votre solde total actuel.
                </p>
              </div>
            ) : (
              /* ── Unlocked: one-time setup form ── */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="solde-initial"
                    className="block text-xs text-white/40 uppercase tracking-widest mb-2"
                  >
                    Montant (€)
                  </label>
                  <div className="relative">
                    <input
                      id="solde-initial"
                      type="number"
                      step="0.01"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold outline-none focus:border-orange-500/50 transition-colors pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium pointer-events-none">
                      €
                    </span>
                  </div>
                  <p className="text-xs text-white/25 mt-2">
                    Ce solde est utilisé pour calculer votre solde total actuel.
                    Une fois enregistré, il ne pourra plus être modifié.
                  </p>
                </div>

                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saved ? (
                    <>
                      <Check size={16} />
                      Enregistré
                    </>
                  ) : isPending ? (
                    "Enregistrement…"
                  ) : (
                    "Enregistrer le solde initial"
                  )}
                </motion.button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
