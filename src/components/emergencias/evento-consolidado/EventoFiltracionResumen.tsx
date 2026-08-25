"use client";

import type { AgregadoCompletitudEvento } from "@/lib/filtracion/completitud";
import type { KpiFiltro } from "@/lib/filtracion/filtrosEvento";
import { BarraCompletitud } from "@/components/emergencias/evento-consolidado/ui/BarraCompletitud";
import { cn } from "@/lib/utils";

type KpiDef = {
  id: KpiFiltro;
  label: string;
  hint: string;
  action: string;
  dotClass: string;
  count: number;
};

type EventoFiltracionResumenProps = {
  agregado: AgregadoCompletitudEvento;
  kpis: Record<KpiFiltro, number>;
  kpiActivo: KpiFiltro | null;
  onToggleKpi: (kpi: KpiFiltro) => void;
};

const KPI_DEFS: Omit<KpiDef, "count">[] = [
  {
    id: "sin_antes",
    label: "Sin fotos/videos de antes",
    hint: "Sin evidencia tipo «antes»",
    action: "Ver todas →",
    dotClass: "bg-amber-500",
  },
  {
    id: "sin_despues",
    label: "Sin fotos/videos de después",
    hint: "Sin evidencia tipo «después»",
    action: "Ver todas →",
    dotClass: "bg-orange-500",
  },
  {
    id: "sin_plano_agua",
    label: "Sin plano (agua)",
    hint: "Sin archivo plano de agua",
    action: "Ver todas →",
    dotClass: "bg-sky-500",
  },
  {
    id: "sin_plano_reparacion",
    label: "Sin plano (reparación)",
    hint: "Sin archivo plano de reparación",
    action: "Ver todas →",
    dotClass: "bg-indigo-500",
  },
  {
    id: "sin_asignar",
    label: "Sin asignar",
    hint: "Sin ejecutado por definido",
    action: "Ver todas →",
    dotClass: "bg-zinc-500",
  },
  {
    id: "asignados_proveedor",
    label: "Asignados a proveedor externo",
    hint: "Solo proveedor externo",
    action: "Ver todas →",
    dotClass: "bg-sky-600",
  },
  {
    id: "sin_cotizacion",
    label: "Sin cotización",
    hint: "Proveedor externo sin cotización completa",
    action: "Ver todas →",
    dotClass: "bg-[#c8102e]",
  },
  {
    id: "sin_fecha_entrega",
    label: "Sin fecha de entrega estimada",
    hint: "Falta fecha entrega estimada",
    action: "Ver todas →",
    dotClass: "bg-violet-500",
  },
  {
    id: "sin_empezar",
    label: "Sin empezar",
    hint: "Aún no ha comenzado la ejecución",
    action: "Ver todas →",
    dotClass: "bg-stone-600",
  },
];

export function EventoFiltracionResumen({
  agregado,
  kpis,
  kpiActivo,
  onToggleKpi,
}: EventoFiltracionResumenProps) {
  const kpiCards: KpiDef[] = KPI_DEFS.map((d) => ({ ...d, count: kpis[d.id] }));

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-[#f2c3c8] bg-[#fdf3f4] p-4 md:p-5">
        <TarjetaInfoEvento agregado={agregado} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {kpiCards.map((k) => (
          <KpiCard
            key={k.id}
            kpi={k}
            activo={kpiActivo === k.id}
            onToggle={() => onToggleKpi(k.id)}
            compact
          />
        ))}
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-4">
        {kpiCards.map((k) => (
          <KpiCard
            key={k.id}
            kpi={k}
            activo={kpiActivo === k.id}
            onToggle={() => onToggleKpi(k.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TarjetaInfoEvento({
  agregado,
}: {
  agregado: AgregadoCompletitudEvento;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-[#71717a] uppercase">
          Información del evento completa
        </p>
        <span className="text-xs text-[#71717a]">
          {agregado.proyectosCompletos} de {agregado.totalProyectos} completas
        </span>
      </div>
      <p className="mt-2 text-[38px] font-bold leading-none text-[#18181b] max-md:text-3xl">
        {agregado.porcentajeGlobal}%
      </p>
      <p className="mt-1 text-sm text-[#71717a]">
        de los datos exigidos están llenos
      </p>
      <BarraCompletitud
        porcentaje={agregado.porcentajeGlobal}
        altura="evento"
        className="mt-3"
      />
      {agregado.topFaltantes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agregado.topFaltantes.map((f) => (
            <span
              key={f.id}
              className="rounded-md border border-[#f2c3c8] bg-white px-2 py-0.5 text-[11px] font-bold text-[#a4131f]"
            >
              {f.label} ({f.count})
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

function KpiCard({
  kpi,
  activo,
  onToggle,
  compact = false,
}: {
  kpi: KpiDef;
  activo: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "min-h-[44px] shrink-0 rounded-xl border p-4 text-left transition-colors",
        compact ? "min-w-[160px] p-3" : "h-full",
        activo
          ? "border-[#c8102e] bg-[#fdeced] ring-1 ring-[#c8102e]/30"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-[#71717a] uppercase leading-snug">
        {kpi.label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", kpi.dotClass)} aria-hidden />
        <span
          className={cn(
            "font-bold",
            compact ? "text-2xl" : "text-[34px] leading-none",
          )}
        >
          {kpi.count}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{kpi.hint}</p>
      <p className="mt-1 text-xs font-medium text-[#c8102e]">{kpi.action}</p>
    </button>
  );
}
