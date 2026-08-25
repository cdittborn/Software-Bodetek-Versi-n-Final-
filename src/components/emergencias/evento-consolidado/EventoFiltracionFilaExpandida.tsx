"use client";

import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/media/MediaGrid";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  EJECUTADO_POR_LABEL,
  type EjecutadoPor,
} from "@/lib/trabajos";
import { EtiquetaFaltaBadge } from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import { IndicadorEntrega } from "@/components/emergencias/evento-consolidado/ui/IndicadorEntrega";
import {
  TIPOS_PROBLEMA,
  TIPO_PROBLEMA_LABEL,
} from "@/lib/filtracion/problemas";

type EventoFiltracionFilaExpandidaProps = {
  proyecto: ProyectoFiltracionEnriquecido;
  puedeEditar: boolean;
  onCompletar: () => void;
};

export function EventoFiltracionFilaExpandida({
  proyecto,
  puedeEditar,
  onCompletar,
}: EventoFiltracionFilaExpandidaProps) {
  const p = proyecto;
  const mediaItems = [
    ...p.media.antes,
    ...p.media.despues,
    ...p.media.plano_agua,
    ...p.media.plano_reparacion,
  ];
  const totalMedia = mediaItems.length;
  const ejecutado =
    p.ejecutado_por && EJECUTADO_POR_LABEL[p.ejecutado_por as EjecutadoPor]
      ? EJECUTADO_POR_LABEL[p.ejecutado_por as EjecutadoPor]
      : null;
  const activos = TIPOS_PROBLEMA.filter((t) => p.problemas[t].activo);

  return (
    <div className="grid gap-4 border-t border-border bg-muted/20 p-4 md:grid-cols-3">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Diagnóstico y plan</h4>
        {activos.length === 0 ? (
          <EtiquetaFaltaBadge />
        ) : (
          activos.map((tipo) => (
            <div key={tipo} className="space-y-1">
              <p className="text-xs font-semibold text-[#18181b]">
                {TIPO_PROBLEMA_LABEL[tipo]}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Problema
              </p>
              <p className="whitespace-pre-wrap text-sm">
                {p.problemas[tipo].descripcion.trim() || <EtiquetaFaltaBadge />}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Plan</p>
              <p className="whitespace-pre-wrap text-sm">
                {p.problemas[tipo].plan.trim() || <EtiquetaFaltaBadge />}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Evidencia y planos</h4>
        <p className="text-xs text-muted-foreground">
          {totalMedia} archivo{totalMedia === 1 ? "" : "s"} · Antes{" "}
          {p.media.antes.length} · Después {p.media.despues.length} · Planos{" "}
          {p.media.plano_agua.length + p.media.plano_reparacion.length}
        </p>
        {totalMedia > 0 ? (
          <MediaGrid items={mediaItems} bordered />
        ) : (
          <EtiquetaFaltaBadge />
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Falta por llenar</h4>
        {p.completitud.faltantes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {p.completitud.faltantes.map((f) => (
              <span
                key={f.id}
                className="rounded-md border border-[#f2c3c8] bg-[#fdeced] px-2 py-0.5 text-[11px] font-bold text-[#a4131f]"
              >
                {f.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-emerald-700">Completo</p>
        )}
        <IndicadorEntrega
          fechaEstimada={p.fecha_entrega_estimada}
          fechaReal={p.fecha_termino}
          atrasada={p.entregaAtrasada}
        />
        {p.sinDespues ? (
          <p className="text-xs font-medium text-[#a4131f]">
            Falta evidencia «Después» (no se puede cerrar la filtración)
          </p>
        ) : null}
        {p.ejecutado_por === "maestros_bodetek" ? (
          p.horas_maestros_bodetek != null && p.horas_maestros_bodetek > 0 ? (
            <p className="text-sm text-muted-foreground">
              Horas maestros Bodetek: {p.horas_maestros_bodetek}
            </p>
          ) : (
            <EtiquetaFaltaBadge />
          )
        ) : null}
        {puedeEditar ? (
          <Button
            type="button"
            className="min-h-[44px] bg-[#c8102e] text-white hover:bg-[#a4131f]"
            onClick={onCompletar}
          >
            Completar ficha
          </Button>
        ) : null}
        {ejecutado ? (
          <p className="text-xs text-muted-foreground">Ejecutado por: {ejecutado}</p>
        ) : (
          <EtiquetaFaltaBadge />
        )}
      </div>
    </div>
  );
}
