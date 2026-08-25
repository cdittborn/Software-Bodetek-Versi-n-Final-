"use client";

import type { KpiFiltro } from "@/lib/filtracion/filtrosEvento";
import { cn } from "@/lib/utils";

type KpiIndicadorPillProps = {
  label: string;
  count: number;
  dotClass: string;
  activo: boolean;
  onToggle: () => void;
};

export function KpiIndicadorPill({
  label,
  count,
  dotClass,
  activo,
  onToggle,
}: KpiIndicadorPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
        activo
          ? "border-[#c8102e] bg-[#fdeced] text-[#a4131f]"
          : "border-border bg-muted/40 hover:bg-muted",
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", dotClass)} aria-hidden />
      <span className="font-bold tabular-nums">{count}</span>
      <span className="whitespace-nowrap text-[11px]">{label}</span>
    </button>
  );
}

export const KPI_INDICADOR_DEFS: {
  id: KpiFiltro;
  label: string;
  dotClass: string;
}[] = [
  { id: "sin_antes", label: "Sin antes", dotClass: "bg-amber-500" },
  { id: "sin_despues", label: "Sin después", dotClass: "bg-orange-500" },
  { id: "sin_plano_agua", label: "Sin pl. agua", dotClass: "bg-sky-500" },
  { id: "sin_plano_reparacion", label: "Sin pl. rep.", dotClass: "bg-indigo-500" },
  { id: "sin_asignar", label: "Sin asignar", dotClass: "bg-zinc-500" },
  { id: "asignados_proveedor", label: "Proveedor ext.", dotClass: "bg-sky-600" },
  { id: "sin_cotizacion", label: "Sin cotiz.", dotClass: "bg-[#c8102e]" },
  { id: "sin_fecha_entrega", label: "Sin f. entrega", dotClass: "bg-violet-500" },
  { id: "sin_empezar", label: "Sin empezar", dotClass: "bg-stone-600" },
];
