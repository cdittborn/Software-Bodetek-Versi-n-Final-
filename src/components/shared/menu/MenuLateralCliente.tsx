"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowRightLeft,
  Briefcase,
  ChevronRight,
  House,
  Menu,
  Pencil,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BotonLogout } from "@/components/shared/BotonLogout";
import { EditorCategorias } from "@/components/shared/menu/EditorCategorias";
import { colorCategoria, moduloActivo, subtipoActivo } from "@/lib/menu";
import type { ModuloKey } from "@/lib/modulos";
import type { CategoriaMenu } from "@/lib/categorias/editorMenu";
import { subtipoHref } from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type ModuloMenu = { modulo: ModuloKey; href: string; label: string };

type Props = {
  fecha: string;
  modulos: ModuloMenu[];
  categorias: CategoriaMenu[];
  puedeEditar: boolean;
  usuarioNombre: string;
  usuarioRol: string;
};

const ICONO_MODULO: Partial<Record<ModuloKey, LucideIcon>> = {
  trabajos: Briefcase,
  recintos: House,
  proveedores: ArrowRightLeft,
  usuarios: Users,
};

function LogoB({ size }: { size: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[7px] bg-[#c8102e] font-bold text-white",
        size === "md" ? "size-7 text-sm" : "size-[26px] text-[13px]",
      )}
    >
      B
    </span>
  );
}

export function MenuLateralCliente({
  fecha,
  modulos,
  categorias,
  puedeEditar,
  usuarioNombre,
  usuarioRol,
}: Props) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [rutaMenu, setRutaMenu] = useState(pathname);
  const [cerradas, setCerradas] = useState<Set<string>>(() => new Set());
  const [editando, setEditando] = useState(false);

  if (rutaMenu !== pathname) {
    setRutaMenu(pathname);
    setAbierto(false);
    setEditando(false);
  }

  function alternarCategoria(id: string) {
    setCerradas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-line bg-menu text-ink max-[759px]:border-b min-[760px]:sticky min-[760px]:top-0 min-[760px]:h-svh min-[760px]:shrink-0 min-[760px]:border-r",
        editando ? "min-[760px]:w-[300px]" : "min-[760px]:w-[260px]",
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-line bg-white py-1.5 pr-2 pl-4 min-[760px]:hidden">
        <LogoB size="sm" />
        <span className="flex-1 text-[14.5px] font-semibold">Bodetek</span>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="menu-lateral-contenido"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="flex size-11 items-center justify-center rounded-lg text-ink"
        >
          {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div className="hidden items-center gap-2.5 px-4 pt-4 pb-3 min-[760px]:flex">
        <LogoB size="md" />
        <div>
          <div className="text-[14.5px] leading-tight font-semibold">Bodetek</div>
          <div className="text-[11.5px] text-ink-faint">{fecha}</div>
        </div>
      </div>

      <div
        id="menu-lateral-contenido"
        className={cn(
          "min-h-0 flex-1 flex-col overflow-y-auto min-[760px]:flex",
          abierto ? "flex" : "hidden",
        )}
      >
        <nav aria-label="Módulos" className="flex flex-col gap-px px-2 py-1 max-[759px]:pt-2">
          {modulos.map((m) => {
            const Icono = ICONO_MODULO[m.modulo];
            const activo = moduloActivo(pathname, m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex min-h-[34px] items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] text-ink max-[759px]:min-h-11",
                  activo
                    ? "bg-activo font-semibold text-activo-ink"
                    : "hover:bg-[#EEF1F7]",
                )}
              >
                {Icono ? <Icono className="size-4" strokeWidth={1.8} aria-hidden /> : null}
                {m.label}
              </Link>
            );
          })}
        </nav>

        {categorias.length > 0 ? (
          <>
            <div className="mx-2 mt-2.5 mb-1 border-t border-line px-2.5 pt-3 pb-0.5">
              <span className="text-[10.5px] font-bold tracking-[1.3px] text-ink-faint uppercase">
                Categorías
              </span>
            </div>
            <div className="flex flex-col gap-0.5 px-2">
              {categorias.map((cat, i) => {
                const { color, tinte } = colorPorPosicion(i);
                const open = !cerradas.has(cat.id);
                return (
                  <div key={cat.id}>
                    <button
                      type="button"
                      onClick={() => alternarCategoria(cat.id)}
                      aria-expanded={open}
                      className="flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold text-[#3A3F4E] hover:bg-[#EEF1F7] max-[759px]:min-h-11"
                    >
                      <span
                        aria-hidden
                        className="size-[9px] shrink-0 rounded-[3px]"
                        style={{ background: color }}
                      />
                      <span className="min-w-0 flex-1">{cat.nombre}</span>
                      <ChevronRight
                        aria-hidden
                        strokeWidth={2.4}
                        className={cn(
                          "size-3 shrink-0 text-[#A3A8B6] transition-transform",
                          open && "rotate-90",
                        )}
                      />
                    </button>
                    {open ? (
                      <div
                        className="mb-1.5 ml-3.5 border-l-[1.5px] pl-2.5"
                        style={{ borderLeftColor: tinte }}
                      >
                        {cat.subtipos.length === 0 ? (
                          <div className="px-2.5 py-1 text-xs text-[#8A8FA0]">
                            Sin subcategorías
                          </div>
                        ) : (
                          cat.subtipos.map((sub) => {
                            const activo = subtipoActivo(pathname, cat.id, sub.id);
                            return (
                              <Link
                                key={sub.id}
                                href={subtipoHref(cat.id, sub.id)}
                                aria-current={activo ? "page" : undefined}
                                className={cn(
                                  "flex min-h-[30px] items-center gap-[9px] rounded-[7px] px-2.5 py-[5px] text-[13px] max-[759px]:min-h-11",
                                  activo
                                    ? "bg-white font-semibold text-ink shadow-[0_0_0_1px_#E3E6EE]"
                                    : "text-[#3A3F4E] hover:bg-[#EEF1F7] hover:text-ink",
                                )}
                              >
                                <span
                                  aria-hidden
                                  className="size-[5px] shrink-0 rounded-full"
                                  style={{ background: color }}
                                />
                                <span className="min-w-0 flex-1">{sub.nombre}</span>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-4 py-3 max-[759px]:mt-4">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{usuarioNombre}</div>
            <div className="text-[11.5px] text-ink-faint">{usuarioRol}</div>
          </div>
          <BotonLogout />
        </div>
      </div>
    </aside>
  );
}
