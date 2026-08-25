"use client";

import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  contarPorGravedad,
  desgloseGravedadEnCondicion,
  desgloseGravedadResto,
  esEntregado,
  esSinEmpezar,
  coincideKpi,
  type FiltroTarjetaDashboard,
} from "@/lib/filtracion/filtrosEvento";
import { EventoDashboardTarjetaTotal } from "@/components/emergencias/evento-dashboard/EventoDashboardTarjetaTotal";
import { EventoDashboardTarjetaMetrica } from "@/components/emergencias/evento-dashboard/EventoDashboardTarjetaMetrica";

type EventoDashboardFilaAvanceProps = {
  proyectos: ProyectoFiltracionEnriquecido[];
  tarjetaActiva: FiltroTarjetaDashboard | null;
  onToggleTarjeta: (id: FiltroTarjetaDashboard) => void;
  onVerTodos: () => void;
};

const AVANCE_TARJETAS: {
  id: FiltroTarjetaDashboard;
  label: string;
  hint: string;
  nota: string;
  dotClass: string;
  predicado: (p: ProyectoFiltracionEnriquecido) => boolean;
}[] = [
  {
    id: "entregados",
    label: "Entregados",
    hint: "Con fecha de entrega real registrada",
    nota: "Ver todas →",
    dotClass: "bg-emerald-600",
    predicado: esEntregado,
  },
  {
    id: "sin_empezar",
    label: "Sin empezar",
    hint: "Estados sin iniciar ejecución",
    nota: "Ver todas →",
    dotClass: "bg-stone-600",
    predicado: esSinEmpezar,
  },
  {
    id: "sin_fecha_entrega",
    label: "Sin fecha de entrega estimada",
    hint: "Falta fecha entrega estimada",
    nota: "Ver todas →",
    dotClass: "bg-violet-500",
    predicado: (p) => coincideKpi(p, "sin_fecha_entrega"),
  },
];

export function EventoDashboardFilaAvance({
  proyectos,
  tarjetaActiva,
  onToggleTarjeta,
  onVerTodos,
}: EventoDashboardFilaAvanceProps) {
  const total = proyectos.length;
  const desgloseTotal = contarPorGravedad(proyectos);

  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_1fr]">
      <EventoDashboardTarjetaTotal
        total={total}
        desglose={desgloseTotal}
        activo={tarjetaActiva === null}
        onVerTodos={onVerTodos}
      />
      {AVANCE_TARJETAS.map((t) => {
        const count = proyectos.filter(t.predicado).length;
        return (
          <EventoDashboardTarjetaMetrica
            key={t.id}
            label={t.label}
            hint={t.hint}
            nota={t.nota}
            dotClass={t.dotClass}
            count={count}
            total={total}
            activo={tarjetaActiva === t.id}
            onToggle={() => onToggleTarjeta(t.id)}
            desgloseEnCondicion={desgloseGravedadEnCondicion(
              proyectos,
              t.predicado,
            )}
            desgloseResto={desgloseGravedadResto(proyectos, t.predicado)}
          />
        );
      })}
    </div>
  );
}
