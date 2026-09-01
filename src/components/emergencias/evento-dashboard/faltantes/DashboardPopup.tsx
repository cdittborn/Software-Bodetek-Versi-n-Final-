"use client";

import { useEffect, useRef } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatMontoClp,
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  isGravedadLluvias,
} from "@/lib/trabajos";
import {
  TIPO_PROBLEMA_CHIP,
  etiquetaTipo,
  nombreFichaPopup,
  type PopupAbierto,
} from "@/lib/filtracion/dashboardFaltantes";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import { cn } from "@/lib/utils";

type DashboardPopupProps = {
  popup: PopupAbierto;
  onCerrar: () => void;
  onEditar: (p: ProyectoFiltracionEnriquecido) => void;
  puedeEditar: boolean;
};

export function DashboardPopup({
  popup,
  onCerrar,
  onEditar,
  puedeEditar,
}: DashboardPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-[#18181b]/45"
        onClick={onCerrar}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-popup-titulo"
        tabIndex={-1}
        className="relative z-10 flex max-h-[78vh] w-full max-w-[620px] flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/10 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2
              id="dashboard-popup-titulo"
              className="text-base font-semibold leading-snug"
            >
              {popup.titulo}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {popup.categoria} · {popup.items.length}
              {popup.items.some((i) => i.valorRecinto != null)
                ? ` · ${formatMontoClp(
                    popup.items.reduce(
                      (acc, i) => acc + (i.valorRecinto ?? 0),
                      0,
                    ),
                  )}`
                : null}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 min-h-[44px] min-w-[44px] shrink-0"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {popup.items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No hay fichas en esta cifra.
            </p>
          ) : (
            <ol className="flex flex-col">
              {popup.items.map((item, i) => {
                const g = item.proyecto.gravedad;
                return (
                  <li
                    key={item.key}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50"
                  >
                    <span className="w-7 shrink-0 font-mono text-xs tabular-nums text-zinc-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {nombreFichaPopup(item.proyecto)}
                      </p>
                      {item.valorRecinto != null ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.proveedorLabel?.trim()
                            ? item.proveedorLabel
                            : "Sin proveedor"}
                          {" · "}
                          {formatMontoClp(item.valorRecinto)}
                        </p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tipos.map((tipo) => (
                          <span
                            key={tipo}
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                              TIPO_PROBLEMA_CHIP[tipo],
                            )}
                          >
                            {etiquetaTipo(tipo)}
                          </span>
                        ))}
                        {g && isGravedadLluvias(g) ? (
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                              GRAVEDAD_LLUVIAS_BADGE[g],
                            )}
                          >
                            {GRAVEDAD_LLUVIAS_LABEL[g]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {puedeEditar ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 min-h-[44px] min-w-[44px] shrink-0"
                        aria-label={`Editar filtración ${nombreFichaPopup(item.proyecto)}`}
                        onClick={() => {
                          onEditar(item.proyecto);
                          onCerrar();
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {puedeEditar
              ? "Haz clic en el lápiz para abrir la ficha"
              : "Listado de las fichas que componen esta cifra"}
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-[44px]"
            onClick={onCerrar}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
