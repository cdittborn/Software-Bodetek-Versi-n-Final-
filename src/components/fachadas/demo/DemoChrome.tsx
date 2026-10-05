"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_BASE, DEMO_SIDEBAR } from "@/lib/fachadas/demo-datos";
import "@/components/fachadas/fachadas.css";

const VISTAS = [
  { href: DEMO_BASE, label: "Dashboard", match: (p: string) => p === DEMO_BASE || p === `${DEMO_BASE}/` },
  { href: `${DEMO_BASE}/ficha`, label: "Ficha", match: (p: string) => p.endsWith("/ficha") },
  { href: `${DEMO_BASE}/intervencion`, label: "Nueva intervención", match: (p: string) => p.endsWith("/intervencion") },
  { href: `${DEMO_BASE}/nueva`, label: "Nueva fachada", match: (p: string) => p.endsWith("/nueva") },
  { href: `${DEMO_BASE}/reporte`, label: "Reporte", match: (p: string) => p.endsWith("/reporte") },
];

export function DemoSwitcher() {
  const pathname = usePathname();
  return (
    <nav
      data-demo-switcher
      className="flex flex-wrap gap-1 border-b border-[#e6e3de] bg-white px-3 py-1.5 text-xs"
    >
      {VISTAS.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          className={cn(
            "rounded-md px-2 py-1",
            v.match(pathname) ? "bg-[#f6f5f2] font-semibold" : "text-muted-foreground",
          )}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  );
}

export function DemoNav({ onMenu }: { onMenu?: () => void }) {
  return (
    <header className="border-b border-[#e6e3de] bg-white">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-bodetek.png"
            alt="Bodetek"
            className="h-8 w-auto"
          />
          <nav className="hidden items-center gap-1 md:flex">
            {["Trabajos", "Recintos", "Proveedores", "Usuarios"].map((label) => (
              <span
                key={label}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  label === "Trabajos"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">Cristóbal Dittborn</span>
          {onMenu ? (
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-md border border-[#e6e3de] md:hidden"
              aria-label="Abrir categorías"
              onClick={onMenu}
            >
              <Menu className="size-5" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function DemoSidebar({ movil = false }: { movil?: boolean }) {
  return (
    <aside
      className={cn(
        "w-[220px] shrink-0 border-r border-[#e6e3de] bg-[#f6f5f2]",
        movil ? "flex h-full w-full flex-col border-0" : "hidden md:flex md:flex-col",
      )}
    >
      <p className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Categorías
      </p>
      <nav className="flex-1 px-2 pb-4 text-sm">
        {DEMO_SIDEBAR.map((cat) => (
          <div key={cat.id} className="mb-1">
            <p
              className={cn(
                "rounded-md px-2 py-1.5 font-medium",
                cat.id === "cat-imagen" && "font-semibold",
              )}
            >
              {cat.nombre}
            </p>
            {cat.subtipos.map((s) => (
              <p
                key={s.id}
                className={cn(
                  "ml-2 rounded-md px-2 py-1.5",
                  s.id === "sub-fachadas"
                    ? "bg-[#fde8ea] font-medium text-[#9b1b2e]"
                    : "text-muted-foreground",
                )}
              >
                {s.nombre}
              </p>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function DemoShell({
  children,
  sidebar = false,
  fondo = true,
}: {
  children: React.ReactNode;
  sidebar?: boolean;
  fondo?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div className={cn("flex min-h-full flex-col", fondo && "fachadas-demo-bg")}>
      <DemoSwitcher />
      <DemoNav onMenu={sidebar ? () => setMenu(true) : undefined} />
      {menu && sidebar ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar categorías"
            onClick={() => setMenu(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-3 py-3">
              <span className="text-sm font-semibold">Categorías</span>
              <button type="button" aria-label="Cerrar menú" onClick={() => setMenu(false)}>
                <X className="size-5" />
              </button>
            </div>
            <DemoSidebar movil />
          </div>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        {sidebar ? <DemoSidebar /> : null}
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
