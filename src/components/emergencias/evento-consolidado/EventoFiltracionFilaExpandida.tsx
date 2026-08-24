"use client";

import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/media/MediaGrid";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  EJECUTADO_POR_LABEL,
  type EjecutadoPor,
} from "@/lib/trabajos";
import { EtiquetaFaltaBadge } from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";

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

  return (
    <div className="grid gap-4 border-t border-border bg-muted/20 p-4 md:grid-cols-3">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Diagnóstico y plan</h4>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Descripción</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {p.descripcion?.trim() || (
              <EtiquetaFaltaBadge />
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Plan de acción</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {p.plan_accion?.trim() || (
              <EtiquetaFaltaBadge />
            )}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Evidencia y planos</h4>
        <p className="text-xs text-muted-foreground">
          {totalMedia} archivo{totalMedia === 1 ? "" : "s"} · Antes {p.media.antes.length} ·
          Después {p.media.despues.length} · Planos{" "}
          {p.media.plano_agua.length + p.media.plano_reparacion.length}
        </p>
        {totalMedia > 0 ? (
          <MediaGrid items={mediaItems} bordered />
        ) : (
          <p className="text-sm text-muted-foreground">Sin archivos todavía</p>
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
        {p.sinDespues ? (
          <p className="text-xs text-amber-800">
            Falta evidencia «Después» (requerida para cerrar como terminado)
          </p>
        ) : null}
        {p.ejecutado_por === "maestros_bodetek" &&
        p.horas_maestros_bodetek != null ? (
          <p className="text-sm text-muted-foreground">
            Horas maestros Bodetek: {p.horas_maestros_bodetek}
          </p>
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
        ) : null}
      </div>
    </div>
  );
}
