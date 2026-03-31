"use client";

import { useState } from "react";
import { GripVertical, Plus, Pencil } from "lucide-react";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderCategories, deleteCategorie } from "@/app/(main)/parametres/actions";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import CategorieModal, { ICONE_MAP } from "@/app/(main)/parametres/CategorieModal";
import type { TCategorie } from "@/types";

function CategorieIcon({ icone, size = 14, color }: { icone: string; size?: number; color: string }) {
  const Icon = ICONE_MAP[icone];
  if (!Icon) return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />;
  return <Icon size={size} className="flex-shrink-0" />;
}

function SortableCategoryItem({
  category,
  isConfirming,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  category: TCategorie;
  isConfirming: boolean;
  onEdit: (c: TCategorie) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  async function handleDeleteConfirm() {
    onDeleteConfirm(category.id);
    const result = await deleteCategorie(category.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Catégorie supprimée");
    router.refresh();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors group"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-white/15 group-hover:text-white/35 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
      >
        <GripVertical size={12} />
      </button>
      <span
        className="flex items-center justify-center w-5 h-5 rounded flex-shrink-0"
        style={{ backgroundColor: `${category.couleur}20`, color: category.couleur }}
      >
        <CategorieIcon icone={category.icone} size={12} color={category.couleur} />
      </span>
      <span className="text-xs truncate flex-1">{category.nom}</span>

      {/* Actions (visibles au hover) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isConfirming && (
          <button
            onClick={() => onEdit(category)}
            className="p-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.07] transition-colors"
            title="Modifier"
          >
            <Pencil size={11} />
          </button>
        )}
        <ConfirmDeleteButton
          isConfirming={isConfirming}
          onDeleteRequest={() => onDeleteRequest(category.id)}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={onDeleteCancel}
          size={11}
        />
      </div>
    </div>
  );
}

interface ICategoryListProps {
  categories: TCategorie[];
}

export default function CategoryList({ categories }: ICategoryListProps) {
  const router = useRouter();
  const [localCategories, setLocalCategories] = useState(categories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TCategorie | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Sync quand les données serveur changent
  const serverKey = JSON.stringify(categories);
  const [prevServerKey, setPrevServerKey] = useState(serverKey);
  if (serverKey !== prevServerKey) {
    setPrevServerKey(serverKey);
    setLocalCategories(categories);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function openAddModal() {
    setEditingCategory(undefined);
    setModalOpen(true);
  }

  function openEditModal(cat: TCategorie) {
    setEditingCategory(cat);
    setModalOpen(true);
  }

  function handleDeleteConfirm(id: string) {
    setConfirmingDeleteId(null);
    setLocalCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalCategories((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);

      reorderCategories(reordered.map((c) => c.id)).then((result) => {
        if ("error" in result) {
          toast.error("Erreur lors de la réorganisation");
          router.refresh();
        }
      });

      return reordered;
    });
  }

  return (
    <>
      {/* Header avec bouton ajouter */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-white/30">
          {localCategories.length} catégorie{localCategories.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          <Plus size={13} />
          Ajouter
        </button>
      </div>

      {/* Liste drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localCategories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {localCategories.map((cat) => (
              <SortableCategoryItem
                key={cat.id}
                category={cat}
                isConfirming={confirmingDeleteId === cat.id}
                onEdit={openEditModal}
                onDeleteRequest={setConfirmingDeleteId}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setConfirmingDeleteId(null)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Modal */}
      <CategorieModal
        key={editingCategory?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        categorie={editingCategory}
      />
    </>
  );
}
