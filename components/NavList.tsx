"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  BarChart3,
  Target,
  Settings,
  GripVertical,
} from "lucide-react";
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
import { updateNavOrder } from "@/app/parametres/actions";

// ── Définition des items de navigation ───────────────────────────────────────

type TNavItem = {
  key: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const ALL_NAV_ITEMS: TNavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "transactions", href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { key: "budget", href: "/budget", label: "Budget", icon: Receipt },
  { key: "bilan", href: "/bilan", label: "Bilan", icon: BarChart3 },
  { key: "objectifs", href: "/objectifs", label: "Objectifs", icon: Target },
  { key: "parametres", href: "/parametres", label: "Paramètres", icon: Settings },
];

function getOrderedNavItems(savedOrder: string[]): TNavItem[] {
  if (savedOrder.length === 0) return ALL_NAV_ITEMS;

  const ordered: TNavItem[] = [];
  for (const key of savedOrder) {
    const item = ALL_NAV_ITEMS.find((i) => i.key === key);
    if (item) ordered.push(item);
  }
  // Ajouter les items manquants à la fin
  for (const item of ALL_NAV_ITEMS) {
    if (!ordered.find((o) => o.key === item.key)) {
      ordered.push(item);
    }
  }
  return ordered;
}

// ── Composant sortable ───────────────────────────────────────────────────────

function SortableNavItem({ item, isActive }: { item: TNavItem; isActive: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const Icon = item.icon;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center group">
      <button
        {...attributes}
        {...listeners}
        className="text-white/0 group-hover:text-white/20 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none p-1 -ml-1 transition-colors"
      >
        <GripVertical size={12} />
      </button>
      <Link
        href={item.href}
        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? "bg-orange-500/15 text-orange-400"
            : "text-white/40 hover:text-white hover:bg-white/[0.05]"
        }`}
      >
        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
        {item.label}
      </Link>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

interface INavListProps {
  savedOrder: string[];
}

export default function NavList({ savedOrder }: INavListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = useState(() => getOrderedNavItems(savedOrder));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Sync si savedOrder change
  const [prevOrder, setPrevOrder] = useState(savedOrder.join(","));
  const currentOrder = savedOrder.join(",");
  if (currentOrder !== prevOrder) {
    setPrevOrder(currentOrder);
    setItems(getOrderedNavItems(savedOrder));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.key === active.id);
      const newIndex = prev.findIndex((i) => i.key === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);

      updateNavOrder(reordered.map((i) => i.key)).then((result) => {
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
        items={items.map((i) => i.key)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0.5">
          {items.map((item) => (
            <SortableNavItem
              key={item.key}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export { ALL_NAV_ITEMS };
