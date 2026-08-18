"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { subtipoHref, type CategoriaNav } from "@/lib/trabajos";

type SidebarTrabajosProps = {
  categorias: CategoriaNav[];
};

export function SidebarTrabajos({ categorias }: SidebarTrabajosProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(categorias.map((c) => c.id)),
  );

  function toggleCategoria(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-2 py-2">
        {!collapsed ? (
          <span className="truncate px-1 text-xs font-medium text-muted-foreground">
            Categorías
          </span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <PanelLeft /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {categorias.length === 0 ? (
          collapsed ? null : (
            <p className="px-2 text-xs text-muted-foreground">
              No hay categorías
            </p>
          )
        ) : (
          categorias.map((cat) => {
            const open = openIds.has(cat.id);
            return (
              <div key={cat.id} className="mb-1">
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    toggleCategoria(cat.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm font-medium text-foreground hover:bg-muted",
                    collapsed && "justify-center px-0",
                  )}
                  title={cat.nombre}
                >
                  {collapsed ? (
                    <span className="text-xs">{cat.nombre.slice(0, 1)}</span>
                  ) : (
                    <>
                      {open ? (
                        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{cat.nombre}</span>
                    </>
                  )}
                </button>
                {!collapsed && open ? (
                  <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {cat.subtipos.length === 0 ? (
                      <li className="px-2 py-1 text-xs text-muted-foreground">
                        Sin subtipos
                      </li>
                    ) : (
                      cat.subtipos.map((sub) => {
                        const href = subtipoHref(cat.id, sub.id);
                        const active = pathname === href || pathname.startsWith(`${href}/`);
                        return (
                          <li key={sub.id}>
                            <Link
                              href={href}
                              className={cn(
                                "block rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                                active && "bg-brand-muted font-medium text-accent-foreground",
                              )}
                            >
                              {sub.nombre}
                            </Link>
                          </li>
                        );
                      })
                    )}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
}
