"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Barra superior al instante al hacer clic en un link interno.
 * No espera a que el servidor termine: cubre el hueco de loading.tsx.
 * `/trabajos` redirige al evento: no apagar la barra en ese hop intermedio.
 */
export function IndicadorNavegacion() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const destRef = useRef<string | null>(null);

  useEffect(() => {
    const dest = destRef.current;
    if (!dest) {
      setPending(false);
      return;
    }
    if (dest === "/trabajos" && pathname === "/trabajos") {
      const t = window.setTimeout(() => {
        destRef.current = null;
        setPending(false);
      }, 2000);
      return () => window.clearTimeout(t);
    }
    destRef.current = null;
    setPending(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (href.startsWith("http") || href.startsWith("//")) return;
      const dest = href.split("?")[0];
      if (dest === pathname) return;
      destRef.current = dest;
      setPending(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  if (!pending) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-brand-muted"
      role="progressbar"
      aria-label="Cargando"
      aria-busy="true"
    >
      <div className="h-full w-1/3 animate-[nav-indeterminate_1s_ease-in-out_infinite] bg-brand" />
    </div>
  );
}
