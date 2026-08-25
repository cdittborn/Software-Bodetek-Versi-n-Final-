"use client";

import { Button } from "@/components/ui/button";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  LABEL_FILTRO_TARJETA,
  type FiltroTarjetaDashboard,
} from "@/lib/filtracion/filtrosEvento";
import {
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  type GravedadLluvias,
} from "@/lib/trabajos";
import { EventoDashboardTabla } from "@/components/emergencias/evento-dashboard/EventoDashboardTabla";
import { EventoDashboardCardLista } from "@/components/emergencias/evento-dashboard/EventoDashboardCardLista";
import { cn } from "@/lib/utils";

type EventoDashboardListadoProps = {
  proyectos: ProyectoFiltracionEnriquecido[];
  total: number;
  tarjetaActiva: FiltroTarjetaDashboard | null;
  gravedades: GravedadLluvias[];
  onToggleGravedad: (g: GravedadLluvias) => void;
  onVerTodos: () => void;
  onEditar: (p: ProyectoFiltracionEnriquecido) => void;
  puedeEditar: boolean;
};

const GRAVEDAD_OPTS: GravedadLluvias[] = ["critico", "medio", "bajo"];

export function EventoDashboardListado({
  proyectos,
  total,
  tarjetaActiva,
  gravedades,
  onToggleGravedad,
  onVerTodos,
  onEditar,
  puedeEditar,
}: EventoDashboardListadoProps) {
  const titulo = tarjetaActiva
    ? LABEL_FILTRO_TARJETA[tarjetaActiva]
    : "Todos los proyectos";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">
            {proyectos.length} de {total} mostrados
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] shrink-0"
          onClick={onVerTodos}
        >
          Ver todos
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {GRAVEDAD_OPTS.map((g) => {
          const activo = gravedades.includes(g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => onToggleGravedad(g)}
              className={cn(
                "min-h-[44px] rounded-full px-3 py-2 text-sm font-medium transition-colors",
                activo
                  ? "ring-2 ring-[#c8102e] ring-offset-1"
                  : "opacity-80 hover:opacity-100",
                GRAVEDAD_LLUVIAS_BADGE[g],
              )}
            >
              {GRAVEDAD_LLUVIAS_LABEL[g]}
            </button>
          );
        })}
      </div>

      <EventoDashboardTabla
        proyectos={proyectos}
        onEditar={onEditar}
        puedeEditar={puedeEditar}
      />
      <EventoDashboardCardLista
        proyectos={proyectos}
        onEditar={onEditar}
        puedeEditar={puedeEditar}
      />
    </section>
  );
}
