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
    id: "sin_asignar",
    label: "Sin asignar",
    hint: "Estado sin asignar",
    action: "Ver todas →",
    dotClass: "bg-zinc-500",
  },
  {
    id: "criticas_abiertas",
    label: "Críticas abiertas",
    hint: "Crítico y no terminado",
    action: "Ver todas →",
    dotClass: "bg-red-500",
  },
  {
    id: "sin_despues",
    label: "Sin Después",
    hint: "Sin evidencia después",
    action: "Ver todas →",
    dotClass: "bg-amber-500",
  },
  {
    id: "entrega_atrasada",
    label: "Entrega atrasada",
    hint: "Fecha est. vencida",
    action: "Ver todas →",
    dotClass: "bg-[#c8102e]",
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
      {/* Mobile: KPI scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-[280px] shrink-0 rounded-xl border border-[#f2c3c8] bg-[#fdf3f4] p-4">
          <TarjetaInfoEvento agregado={agregado} compact />
        </div>
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

      {/* Desktop: 5-col grid */}
      <div className="hidden gap-3 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div className="rounded-xl border border-[#f2c3c8] bg-[#fdf3f4] p-5">
          <TarjetaInfoEvento agregado={agregado} />
        </div>
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
  compact = false,
}: {
  agregado: AgregadoCompletitudEvento;
  compact?: boolean;
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
      <p
        className={cn(
          "mt-2 font-bold text-[#18181b]",
          compact ? "text-3xl" : "text-[38px] leading-none",
        )}
      >
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
        "min-h-[44px] min-w-[140px] shrink-0 rounded-xl border p-4 text-left transition-colors",
        compact && "p-3",
        activo
          ? "border-[#c8102e] bg-[#fdeced] ring-1 ring-[#c8102e]/30"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-[#71717a] uppercase">
        {kpi.label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("size-2 rounded-full", kpi.dotClass)} aria-hidden />
        <span className={cn("font-bold", compact ? "text-2xl" : "text-[34px] leading-none")}>
          {kpi.count}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{kpi.hint}</p>
      <p className="mt-1 text-xs font-medium text-[#c8102e]">{kpi.action}</p>
    </button>
  );
}
