"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
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
import { reorderCategories } from "@/app/parametres/actions";
import type { TCategorie } from "@/types";

function SortableCategoryItem({ category }: { category: TCategorie }) {
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
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: category.couleur }}
      />
      <span className="text-xs truncate">{category.nom}</span>
    </div>
  );
}

interface ICategoryListProps {
  categories: TCategorie[];
}

export default function CategoryList({ categories }: ICategoryListProps) {
  const router = useRouter();
  const [localCategories, setLocalCategories] = useState(categories);

  // Sync when server data changes
  if (
    categories.length !== localCategories.length ||
    categories.map((c) => c.id).join(",") !==
      localCategories.map((c) => c.id).join(",")
  ) {
    setLocalCategories(categories);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

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
            <SortableCategoryItem key={cat.id} category={cat} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
