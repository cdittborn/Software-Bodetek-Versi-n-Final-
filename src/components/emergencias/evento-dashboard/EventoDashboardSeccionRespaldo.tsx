"use client";

import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  coincideKpi,
  desgloseGravedadEnCondicion,
  type FiltroTarjetaDashboard,
  type KpiFiltro,
} from "@/lib/filtracion/filtrosEvento";
import { EventoDashboardTarjetaMetrica } from "@/components/emergencias/evento-dashboard/EventoDashboardTarjetaMetrica";

type EventoDashboardSeccionRespaldoProps = {
  proyectos: ProyectoFiltracionEnriquecido[];
  tarjetaActiva: FiltroTarjetaDashboard | null;
  onToggleTarjeta: (id: FiltroTarjetaDashboard) => void;
};

const TARJETAS: {
  id: KpiFiltro;
  label: string;
  hint: string;
  dotClass: string;
}[] = [
  {
    id: "sin_antes",
    label: "Sin fotos/videos de antes",
    hint: "Sin evidencia tipo «antes»",
    dotClass: "bg-amber-500",
  },
  {
    id: "sin_despues",
    label: "Sin fotos/videos de después",
    hint: "Sin evidencia tipo «después»",
    dotClass: "bg-orange-500",
  },
  {
    id: "sin_plano_agua",
    label: "Sin plano (agua)",
    hint: "Sin archivo plano de agua",
    dotClass: "bg-sky-500",
  },
  {
    id: "sin_plano_reparacion",
    label: "Sin plano (reparación)",
    hint: "Sin archivo plano de reparación",
    dotClass: "bg-indigo-500",
  },
];

export function EventoDashboardSeccionRespaldo({
  proyectos,
  tarjetaActiva,
  onToggleTarjeta,
}: EventoDashboardSeccionRespaldoProps) {
  const total = proyectos.length;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Respaldo faltante</h2>
        <p className="text-sm text-muted-foreground">
          Sin estos archivos el trabajo no se puede revisar ni cerrar
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {TARJETAS.map((t) => {
          const predicado = (p: ProyectoFiltracionEnriquecido) =>
            coincideKpi(p, t.id);
          const count = proyectos.filter(predicado).length;
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
                predicado,
              )}
            />
          );
        })}
      </div>
    </section>
  );
}
