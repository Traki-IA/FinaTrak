"use client";

import { useState, useEffect, useCallback } from "react";

type TBreakpoint = "mobile" | "tablet" | "desktop";

const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

function getBreakpoint(width: number): TBreakpoint {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}

export function useBreakpoint(): TBreakpoint {
  const [breakpoint, setBreakpoint] = useState<TBreakpoint>("mobile");

  const update = useCallback(() => {
    setBreakpoint(getBreakpoint(window.innerWidth));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialisation SSR-safe : window.innerWidth n'est disponible qu'au montage côté client
    update();

    const mqTablet = window.matchMedia(
      `(min-width: ${BREAKPOINTS.tablet}px)`
    );
    const mqDesktop = window.matchMedia(
      `(min-width: ${BREAKPOINTS.desktop}px)`
    );

    mqTablet.addEventListener("change", update);
    mqDesktop.addEventListener("change", update);

    return () => {
      mqTablet.removeEventListener("change", update);
      mqDesktop.removeEventListener("change", update);
    };
  }, [update]);

  return breakpoint;
}

export { BREAKPOINTS };
export type { TBreakpoint };
