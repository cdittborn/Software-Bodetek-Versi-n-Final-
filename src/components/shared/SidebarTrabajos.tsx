"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Menu, PanelLeftClose, PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/shared/NavLink";
import { subtipoHref, type CategoriaNav } from "@/lib/trabajos";

type SidebarTrabajosProps = {
  categorias: CategoriaNav[];
};

export function SidebarTrabajos({ categorias }: SidebarTrabajosProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [movilAbierto, setMovilAbierto] = useState(false);
  const [rutaMenu, setRutaMenu] = useState(pathname);
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(categorias.map((c) => c.id)),
  );

  if (rutaMenu !== pathname) {
    setRutaMenu(pathname);
    setMovilAbierto(false);
  }

  function toggleCategoria(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
    <button
      type="button"
      className="fixed top-2.5 right-16 z-40 inline-flex size-10 items-center justify-center rounded-md border border-border bg-card md:hidden"
      aria-label="Abrir categorías"
      onClick={() => setMovilAbierto(true)}
    >
      <Menu className="size-5" />
    </button>
    {movilAbierto ? (
      <div className="fixed inset-0 z-50 md:hidden">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          aria-label="Cerrar categorías"
          onClick={() => setMovilAbierto(false)}
        />
        <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <span className="text-sm font-semibold">Categorías</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Cerrar menú"
              onClick={() => setMovilAbierto(false)}
            >
              <X />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            <ArbolCategorias
              categorias={categorias}
              openIds={openIds}
              pathname={pathname}
              collapsed={false}
              onToggle={toggleCategoria}
            />
          </nav>
        </aside>
      </div>
    ) : null}
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
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
        <ArbolCategorias
          categorias={categorias}
          openIds={openIds}
          pathname={pathname}
          collapsed={collapsed}
          onToggle={(id) => {
            if (collapsed) setCollapsed(false);
            toggleCategoria(id);
          }}
        />
      </nav>
    </aside>
    </>
  );
}

function ArbolCategorias({
  categorias,
  openIds,
  pathname,
  collapsed,
  onToggle,
}: {
  categorias: CategoriaNav[];
  openIds: Set<string>;
  pathname: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
}) {
  if (categorias.length === 0) {
    return collapsed ? null : (
      <p className="px-2 text-xs text-muted-foreground">No hay categorías</p>
    );
  }
  return (
    <>
      {categorias.map((cat) => {
        const open = openIds.has(cat.id);
        return (
          <div key={cat.id} className="mb-1">
            <button
              type="button"
              onClick={() => onToggle(cat.id)}
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
                  <li className="px-2 py-1 text-xs text-muted-foreground">Sin subtipos</li>
                ) : (
                  cat.subtipos.map((sub) => {
                    const href = subtipoHref(cat.id, sub.id);
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <li key={sub.id}>
                        <NavLink
                          href={href}
                          className={cn(
                            "block rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                            active && "bg-brand-muted font-medium text-accent-foreground",
                          )}
                        >
                          {sub.nombre}
                        </NavLink>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
