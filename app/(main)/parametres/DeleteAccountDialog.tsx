"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/lib/toast";
import { deleteUserAccount } from "./actions";

interface IDeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  userEmail,
}: IDeleteAccountDialogProps) {
  const [emailInput, setEmailInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const isMatch =
    emailInput.toLowerCase().trim() === userEmail.toLowerCase().trim();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setEmailInput("");
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isMatch || isPending) return;

    startTransition(async () => {
      const result = await deleteUserAccount(emailInput.trim());
      if (result && "error" in result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 bg-[#0f0f1a] border-red-500/30 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out inset-x-0 bottom-0 border-t rounded-t-2xl px-5 pt-4 pb-8 max-h-[92dvh] overflow-y-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:border sm:rounded-2xl sm:pb-5 sm:max-h-[90dvh] sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95">
          <Dialog.Close className="absolute top-4 right-4 text-white/40 hover:text-white">
            <X size={18} />
          </Dialog.Close>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle size={20} />
            </span>
            <Dialog.Title className="text-lg font-bold text-white">
              Supprimer le compte
            </Dialog.Title>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-white/60 leading-relaxed">
              Cette action est{" "}
              <span className="text-red-400 font-semibold">
                irréversible
              </span>
              . Toutes vos données seront définitivement supprimées :
              comptes bancaires, transactions, objectifs et budgets.
            </p>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <p className="text-xs text-red-300/80">
                Pour confirmer, tapez votre adresse email :{" "}
                <span className="font-mono font-semibold text-red-300">
                  {userEmail}
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isPending}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 transition-colors placeholder:text-white/20"
                placeholder="votre@email.com"
                autoComplete="off"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/60 text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!isMatch || isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Suppression…
                    </>
                  ) : (
                    "Supprimer définitivement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
