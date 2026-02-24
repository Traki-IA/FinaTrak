"use client";

import { Trash2, Check, X } from "lucide-react";

interface IConfirmDeleteButtonProps {
  isConfirming: boolean;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  size?: number;
}

export default function ConfirmDeleteButton({
  isConfirming,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  size = 13,
}: IConfirmDeleteButtonProps) {
  if (isConfirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onDeleteConfirm}
          className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
          title="Confirmer la suppression"
        >
          <Check size={size} />
        </button>
        <button
          onClick={onDeleteCancel}
          className="p-1.5 rounded-lg bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.1] transition-colors"
          title="Annuler"
        >
          <X size={size} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onDeleteRequest}
      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
      title="Supprimer"
    >
      <Trash2 size={size} />
    </button>
  );
}
