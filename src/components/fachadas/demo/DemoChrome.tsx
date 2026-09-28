"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function DemoNav() {
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
          <nav className="flex items-center gap-1">
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
        <span className="text-xs text-muted-foreground">Cristóbal Dittborn</span>
      </div>
    </header>
  );
}

export function DemoSidebar() {
  return (
    <aside className="hidden w-[220px] shrink-0 border-r border-[#e6e3de] bg-[#f6f5f2] md:flex md:flex-col">
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
  return (
    <div className={cn("flex min-h-full flex-col", fondo && "fachadas-demo-bg")}>
      <DemoSwitcher />
      <DemoNav />
      <div className="flex min-h-0 flex-1">
        {sidebar ? <DemoSidebar /> : null}
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
