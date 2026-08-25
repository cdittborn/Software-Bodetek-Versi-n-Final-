"use client";

import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  desgloseGravedadEnCondicion,
  esAsignadoMaestrosBodetek,
  esAsignadoProveedorExterno,
  esSinAsignarEjecutado,
  esSinCotizacionProveedor,
  type FiltroTarjetaDashboard,
} from "@/lib/filtracion/filtrosEvento";
import { EventoDashboardTarjetaMetrica } from "@/components/emergencias/evento-dashboard/EventoDashboardTarjetaMetrica";

type EventoDashboardSeccionAsignacionProps = {
  proyectos: ProyectoFiltracionEnriquecido[];
  tarjetaActiva: FiltroTarjetaDashboard | null;
  onToggleTarjeta: (id: FiltroTarjetaDashboard) => void;
};

const TARJETAS: {
  id: FiltroTarjetaDashboard;
  label: string;
  hint: string;
  dotClass: string;
  predicado: (p: ProyectoFiltracionEnriquecido) => boolean;
}[] = [
  {
    id: "sin_asignar",
    label: "Sin asignar",
    hint: "Sin ejecutado por definido",
    dotClass: "bg-zinc-500",
    predicado: esSinAsignarEjecutado,
  },
  {
    id: "asignados_maestros",
    label: "Asignados a Maestros Bodetek",
    hint: "Solo maestros Bodetek",
    dotClass: "bg-violet-600",
    predicado: esAsignadoMaestrosBodetek,
  },
  {
    id: "asignados_proveedor",
    label: "Asignados a proveedor externo",
    hint: "Solo proveedor externo",
    dotClass: "bg-sky-600",
    predicado: esAsignadoProveedorExterno,
  },
  {
    id: "sin_cotizacion",
    label: "Sin cotización",
    hint: "Proveedor externo sin cotización completa",
    dotClass: "bg-[#c8102e]",
    predicado: esSinCotizacionProveedor,
  },
];

export function EventoDashboardSeccionAsignacion({
  proyectos,
  tarjetaActiva,
  onToggleTarjeta,
}: EventoDashboardSeccionAsignacionProps) {
  const total = proyectos.length;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Asignación y cotización</h2>
        <p className="text-sm text-muted-foreground">
          Quién ejecuta cada trabajo y si está cotizado
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {TARJETAS.map((t) => {
          const count = proyectos.filter(t.predicado).length;
          return (
            <EventoDashboardTarjetaMetrica
              key={t.id}
              label={t.label}
              hint={t.hint}
              nota="Ver todas →"
              dotClass={t.dotClass}
              count={count}
              total={total}
              activo={tarjetaActiva === t.id}
              onToggle={() => onToggleTarjeta(t.id)}
              desgloseEnCondicion={desgloseGravedadEnCondicion(
                proyectos,
                t.predicado,
              )}
            />
          );
        })}
      </div>
    </section>
  );
}
