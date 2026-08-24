"use client";

import type { ResultadoCompletitud } from "@/components/emergencias/filtracion-form/lib/completitudFiltracion";
import { seccionParaItemCompletitud } from "@/components/emergencias/filtracion-form/lib/seccionFiltracionMap";
import { cn } from "@/lib/utils";

type FiltracionCompletitudIndicadorProps = {
  completitud: ResultadoCompletitud;
  onNavigateToSection?: (sectionId: string) => void;
};

export function FiltracionCompletitudIndicador({
  completitud,
  onNavigateToSection,
}: FiltracionCompletitudIndicadorProps) {
  const { completos, total, faltantes, porcentaje, todoCompleto } = completitud;

  return (
    <div className="shrink-0 border-b border-[#f2c3c8] bg-[#fdf3f4] px-4 py-3 md:px-6">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            todoCompleto ? "bg-emerald-600" : "bg-[#c8102e]",
          )}
          aria-hidden
        />
        <p className="text-sm font-bold text-[#a4131f]">
          {todoCompleto
            ? "Todo completo"
            : `Faltan ${faltantes.length} dato${faltantes.length === 1 ? "" : "s"}`}
        </p>
        <span className="text-xs text-[#71717a]">
          {completos} de {total} completos
        </span>
      </div>

      <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-[#efdcde]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            todoCompleto ? "bg-emerald-600" : "bg-[#c8102e]",
          )}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      {faltantes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {faltantes.map((item) => {
            const sectionId = seccionParaItemCompletitud(item.id);
            const puedeNavegar = Boolean(onNavigateToSection && sectionId);

            if (puedeNavegar && sectionId) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateToSection?.(sectionId)}
                  className="rounded-md border border-[#f2c3c8] bg-white px-2 py-0.5 text-[11px] font-bold text-[#a4131f] transition-colors hover:bg-[#fdeced]"
                >
                  {item.label}
                </button>
              );
            }

            return (
              <span
                key={item.id}
                className="rounded-md border border-[#f2c3c8] bg-white px-2 py-0.5 text-[11px] font-bold text-[#a4131f]"
              >
                {item.label}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
