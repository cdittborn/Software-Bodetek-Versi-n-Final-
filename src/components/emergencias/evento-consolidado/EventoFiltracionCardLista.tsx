"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventoFiltracionFilaExpandida } from "@/components/emergencias/evento-consolidado/EventoFiltracionFilaExpandida";
import { BarraCompletitud } from "@/components/emergencias/evento-consolidado/ui/BarraCompletitud";
import { IndicadorAntesDespues } from "@/components/emergencias/evento-consolidado/ui/IndicadorAntesDespues";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  ESTADO_LLUVIAS_BADGE,
  ESTADO_TRABAJO_LABEL,
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  isEstadoLluvias,
  isGravedadLluvias,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EventoFiltracionCardListaProps = {
  proyectos: ProyectoFiltracionEnriquecido[];
  expandidoId: string | null;
  onToggleExpand: (id: string) => void;
  onEditar: (p: ProyectoFiltracionEnriquecido) => void;
  puedeEditar: boolean;
};

export function EventoFiltracionCardLista({
  proyectos,
  expandidoId,
  onToggleExpand,
  onEditar,
  puedeEditar,
}: EventoFiltracionCardListaProps) {
  if (proyectos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground md:hidden">
        Ningún proyecto coincide con los filtros actuales.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {proyectos.map((p) => {
        const expandido = expandidoId === p.id;
        return (
          <article
            key={p.id}
            className={cn(
              "overflow-hidden rounded-xl border border-border bg-card",
              expandido && "ring-1 ring-[#c8102e]/20",
            )}
          >
            <button
              type="button"
              className="w-full p-4 text-left"
              onClick={() => onToggleExpand(p.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{p.recinto_codigo ?? "—"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.recinto_arrendatario?.trim() || p.recinto_nombre || "—"}
                  </p>
                </div>
                {puedeEditar ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="default"
                    className="size-11 shrink-0"
                    aria-label="Editar"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditar(p);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {p.gravedad && isGravedadLluvias(p.gravedad) ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      GRAVEDAD_LLUVIAS_BADGE[p.gravedad],
                    )}
                  >
                    {GRAVEDAD_LLUVIAS_LABEL[p.gravedad]}
                  </span>
                ) : null}
                {isEstadoLluvias(p.estado) ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      ESTADO_LLUVIAS_BADGE[p.estado],
                    )}
                  >
                    {ESTADO_TRABAJO_LABEL[p.estado]}
                  </span>
                ) : null}
              </div>

              <div className="mt-3">
                <IndicadorAntesDespues
                  antes={p.media.antes.length}
                  despues={p.media.despues.length}
                />
              </div>

              <div className="mt-3">
                <BarraCompletitud porcentaje={p.completitud.porcentaje} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.completitud.todoCompleto ? (
                    <span className="font-medium text-emerald-700">Completo</span>
                  ) : (
                    <>
                      Faltan {p.completitud.faltantes.length} de{" "}
                      {p.completitud.total}
                    </>
                  )}
                </p>
              </div>
            </button>

            {expandido ? (
              <EventoFiltracionFilaExpandida
                proyecto={p}
                puedeEditar={puedeEditar}
                onCompletar={() => onEditar(p)}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
