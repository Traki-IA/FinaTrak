"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Reorder, useDragControls } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  BarChart3,
  Target,
  Settings,
  GripVertical,
} from "lucide-react";

const DEFAULT_NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budget", label: "Budget", icon: Receipt },
  { href: "/bilan", label: "Bilan", icon: BarChart3 },
  { href: "/objectifs", label: "Objectifs", icon: Target },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

const STORAGE_KEY = "finatrak_nav_order";

type TNavItem = (typeof DEFAULT_NAV_ITEMS)[number];

// ── Draggable nav item ────────────────────────────────────────────────────────

function DraggableNavItem({
  navItem,
  isActive,
}: {
  navItem: TNavItem;
  isActive: boolean;
}) {
  const controls = useDragControls();
  const Icon = navItem.icon;

  return (
    <Reorder.Item
      value={navItem}
      dragListener={false}
      dragControls={controls}
      as="div"
      className="group relative"
    >
      <div className="flex items-center gap-1">
        {/* Drag handle - visible on hover */}
        <GripVertical
          size={13}
          className="text-white/0 group-hover:text-white/20 hover:!text-white/50 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none transition-colors -mr-1"
          onPointerDown={(e) => controls.start(e)}
        />
        <Link
          href={navItem.href}
          className={`flex flex-1 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive
              ? "bg-orange-500/15 text-orange-400"
              : "text-white/40 hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
          {navItem.label}
        </Link>
      </div>
    </Reorder.Item>
  );
}

// ── Navbar component ──────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const [items, setItems] = useState<TNavItem[]>(DEFAULT_NAV_ITEMS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const order: string[] = JSON.parse(stored);
        const reordered = order
          .map((href) => DEFAULT_NAV_ITEMS.find((i) => i.href === href))
          .filter(Boolean) as TNavItem[];
        // Append any new items not in stored order
        const remaining = DEFAULT_NAV_ITEMS.filter(
          (i) => !order.includes(i.href)
        );
        setItems([...reordered, ...remaining]);
      }
    } catch {
      // ignore
    }
  }, []);

  function handleReorder(newItems: TNavItem[]) {
    setItems(newItems);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newItems.map((i) => i.href))
      );
    } catch {
      // ignore
    }
  }

  // Use default order until mounted (avoid hydration mismatch)
  const displayItems = mounted ? items : DEFAULT_NAV_ITEMS;

  return (
    <>
      {/* ── Sidebar desktop (md+) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-[#07070f] border-r border-white/[0.06] flex-col z-30">
        {/* Logo */}
        <div className="px-5 pt-7 pb-6">
          <span className="text-white font-bold text-xl tracking-tight">
            Fina<span className="text-orange-500">Trak</span>
          </span>
        </div>

        {/* Nav links - draggable */}
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          as="nav"
          className="flex-1 px-3 space-y-0.5 overflow-visible"
        >
          {displayItems.map((navItem) => (
            <DraggableNavItem
              key={navItem.href}
              navItem={navItem}
              isActive={pathname === navItem.href}
            />
          ))}
        </Reorder.Group>

        {/* Footer */}
        <div className="px-5 py-5 border-t border-white/[0.05]">
          <p className="text-[11px] text-white/20">FinaTrak · v0.1</p>
        </div>
      </aside>

      {/* ── Bottom bar mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#07070f]/95 backdrop-blur border-t border-white/[0.07] flex z-30 pb-safe">
        {displayItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-orange-400" : "text-white/35"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
              {label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
