"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ALL_NAV_ITEMS } from "@/components/NavList";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#07070f]/95 backdrop-blur border-t border-white/[0.07] flex z-30 px-1 pb-[max(8px,env(safe-area-inset-bottom))]">
      {ALL_NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={key}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              isActive ? "text-orange-400" : "text-white/35"
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
            {label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
