"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useBreakpoint, type TBreakpoint } from "@/lib/hooks/useBreakpoint";

type TSidebarContext = {
  /** User preference for desktop collapsed state */
  collapsed: boolean;
  /** Toggle sidebar (only meaningful on desktop) */
  toggle: () => void;
  /** Current breakpoint */
  breakpoint: TBreakpoint;
  /** Effective collapsed state (tablet forces collapsed, desktop uses preference) */
  isIconic: boolean;
  /** Effective sidebar width in pixels (0 on mobile, 56 on tablet/iconic, 220 on desktop expanded) */
  sidebarWidth: number;
};

const SIDEBAR_WIDTH_ICONIC = 56;
const SIDEBAR_WIDTH_FULL = 220;

const SidebarContext = createContext<TSidebarContext>({
  collapsed: false,
  toggle: () => {},
  breakpoint: "mobile",
  isIconic: false,
  sidebarWidth: 0,
});

const STORAGE_KEY = "sidebar-collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const breakpoint = useBreakpoint();

  // Hydrate depuis localStorage après le mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Compute effective state based on breakpoint
  const isIconic = breakpoint === "tablet" || (breakpoint === "desktop" && collapsed);

  const sidebarWidth =
    breakpoint === "mobile"
      ? 0
      : isIconic
      ? SIDEBAR_WIDTH_ICONIC
      : SIDEBAR_WIDTH_FULL;

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggle, breakpoint, isIconic, sidebarWidth }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

export { SIDEBAR_WIDTH_ICONIC, SIDEBAR_WIDTH_FULL };
