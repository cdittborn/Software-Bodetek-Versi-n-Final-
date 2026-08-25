"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarraCompletitud } from "@/components/emergencias/evento-consolidado/ui/BarraCompletitud";
import { EtiquetaFaltaBadge } from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import { IndicadorAntesDespues } from "@/components/emergencias/evento-consolidado/ui/IndicadorAntesDespues";
import { IndicadorPlanos } from "@/components/emergencias/evento-consolidado/ui/IndicadorPlanos";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  EJECUTADO_POR_LABEL,
  ESTADO_LLUVIAS_BADGE,
  ESTADO_TRABAJO_LABEL,
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  formatFechaCl,
  formatMontoClp,
  isEstadoLluvias,
  isGravedadLluvias,
  type EjecutadoPor,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EventoDashboardTablaProps = {
  proyectos: ProyectoFiltracionEnriquecido[];
  onEditar: (p: ProyectoFiltracionEnriquecido) => void;
  puedeEditar: boolean;
};

function CeldaCotizacion({ p }: { p: ProyectoFiltracionEnriquecido }) {
  const ep = p.ejecutado_por;
  if (ep === "maestros_bodetek") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (ep === "proveedor_externo" || ep === "ambos") {
    return (
      <div className="space-y-0.5 text-xs">
        <div>
          {p.numero_cotizacion?.trim() ? (
            <span>N° {p.numero_cotizacion}</span>
          ) : (
            <EtiquetaFaltaBadge />
          )}
        </div>
        <div className="text-muted-foreground">
          {p.valor_reparacion != null ? (
            formatMontoClp(p.valor_reparacion)
          ) : (
            <EtiquetaFaltaBadge />
          )}
          {p.valor_total_cotizacion != null ? (
            <> · {formatMontoClp(p.valor_total_cotizacion)}</>
          ) : null}
        </div>
      </div>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}

export function EventoDashboardTabla({
  proyectos,
  onEditar,
  puedeEditar,
}: EventoDashboardTablaProps) {
  if (proyectos.length === 0) {
    return (
      <p className="hidden rounded-xl border border-dashed p-8 text-center text-sm text-emerald-800 md:block">
        Ningún proyecto en esta condición. Buena señal.
      </p>
    );
  }

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[9rem]">Recinto</TableHead>
            <TableHead>Gravedad / estado</TableHead>
            <TableHead className="min-w-[10rem]">Problema</TableHead>
            <TableHead>Evidencia</TableHead>
            <TableHead>Planos</TableHead>
            <TableHead className="min-w-[8rem]">Ejecución</TableHead>
            <TableHead className="min-w-[8rem]">Cotización</TableHead>
            <TableHead className="min-w-[9rem]">Entrega / falta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proyectos.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-start gap-2">
                  {puedeEditar ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="default"
                      className="size-11 shrink-0"
                      aria-label="Editar"
                      onClick={() => onEditar(p)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-bold">{p.recinto_codigo ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.recinto_arrendatario?.trim() ||
                        p.recinto_nombre ||
                        "—"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {p.gravedad && isGravedadLluvias(p.gravedad) ? (
                    <span
                      className={cn(
                        "w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                        GRAVEDAD_LLUVIAS_BADGE[p.gravedad],
                      )}
                    >
                      {GRAVEDAD_LLUVIAS_LABEL[p.gravedad]}
                    </span>
                  ) : (
                    <EtiquetaFaltaBadge />
                  )}
                  {isEstadoLluvias(p.estado) ? (
                    <span
                      className={cn(
                        "w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                        ESTADO_LLUVIAS_BADGE[p.estado],
                      )}
                    >
                      {ESTADO_TRABAJO_LABEL[p.estado]}
                    </span>
                  ) : (
                    <span className="text-xs">{p.estado}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <p className="line-clamp-2 text-sm">
                  {p.descripcion?.trim() || <EtiquetaFaltaBadge />}
                </p>
              </TableCell>
              <TableCell>
                <IndicadorAntesDespues
                  antes={p.media.antes.length}
                  despues={p.media.despues.length}
                />
              </TableCell>
              <TableCell>
                <IndicadorPlanos
                  tieneAgua={p.media.plano_agua.length > 0}
                  tieneReparacion={p.media.plano_reparacion.length > 0}
                />
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  {p.ejecutado_por ? (
                    EJECUTADO_POR_LABEL[p.ejecutado_por as EjecutadoPor]
                  ) : (
                    <EtiquetaFaltaBadge />
                  )}
                  {p.proveedor_nombre ? (
                    <p className="mt-0.5 text-muted-foreground">
                      {p.proveedor_nombre}
                    </p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <CeldaCotizacion p={p} />
              </TableCell>
              <TableCell>
                <div className="space-y-1.5">
                  <div className="text-xs">
                    {p.fecha_entrega_estimada ? (
                      formatFechaCl(p.fecha_entrega_estimada)
                    ) : (
                      <EtiquetaFaltaBadge />
                    )}
                  </div>
                  <BarraCompletitud porcentaje={p.completitud.porcentaje} />
                  <p className="text-[11px] text-muted-foreground">
                    {p.completitud.todoCompleto ? (
                      <span className="font-medium text-emerald-700">
                        Completo
                      </span>
                    ) : (
                      <>
                        Faltan {p.completitud.faltantes.length} de{" "}
                        {p.completitud.total}
                      </>
                    )}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
