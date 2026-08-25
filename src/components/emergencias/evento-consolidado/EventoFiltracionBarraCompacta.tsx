"use client";

import type { AgregadoCompletitudEvento } from "@/lib/filtracion/completitud";
import type { KpiFiltro } from "@/lib/filtracion/filtrosEvento";
import { BarraCompletitud } from "@/components/emergencias/evento-consolidado/ui/BarraCompletitud";
import {
  KPI_INDICADOR_DEFS,
  KpiIndicadorPill,
} from "@/components/emergencias/evento-consolidado/ui/KpiIndicadorPill";

type EventoFiltracionBarraCompactaProps = {
  agregado: AgregadoCompletitudEvento;
  kpis: Record<KpiFiltro, number>;
  kpiActivo: KpiFiltro | null;
  onToggleKpi: (kpi: KpiFiltro) => void;
};

export function EventoFiltracionBarraCompacta({
  agregado,
  kpis,
  kpiActivo,
  onToggleKpi,
}: EventoFiltracionBarraCompactaProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#f2c3c8] bg-[#fdf3f4] p-3 md:flex-row md:items-center md:gap-4 md:p-4">
      <div className="shrink-0 border-border md:border-r md:pr-4">
        <p className="text-xl font-bold leading-none text-[#18181b]">
          {agregado.porcentajeGlobal}%
        </p>
        <BarraCompletitud
          porcentaje={agregado.porcentajeGlobal}
          className="mt-2 w-[132px]"
          altura="evento"
        />
        <p className="mt-1.5 text-[11px] text-[#71717a]">
          {agregado.proyectosCompletos} de {agregado.totalProyectos} completas
        </p>
      </div>

      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {KPI_INDICADOR_DEFS.map((k) => (
          <KpiIndicadorPill
            key={k.id}
            label={k.label}
            count={kpis[k.id]}
            dotClass={k.dotClass}
            activo={kpiActivo === k.id}
            onToggle={() => onToggleKpi(k.id)}
          />
        ))}
      </div>
    </div>
  );
}
