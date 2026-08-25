"use client";

import { Fragment } from "react";
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
import { EventoFiltracionFilaExpandida } from "@/components/emergencias/evento-consolidado/EventoFiltracionFilaExpandida";
import { BarraCompletitud } from "@/components/emergencias/evento-consolidado/ui/BarraCompletitud";
import { IndicadorAntesDespues } from "@/components/emergencias/evento-consolidado/ui/IndicadorAntesDespues";
import { IndicadorPlanos } from "@/components/emergencias/evento-consolidado/ui/IndicadorPlanos";
import {
  EtiquetaFaltaBadge,
  ValorOFalta,
} from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import { IndicadorEntrega } from "@/components/emergencias/evento-consolidado/ui/IndicadorEntrega";
import { ChipsProblemaCompletitud } from "@/components/emergencias/evento-consolidado/ui/ChipsProblemaCompletitud";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  EJECUTADO_POR_LABEL,
  ESTADO_LLUVIAS_BADGE,
  ESTADO_TRABAJO_LABEL,
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  formatMontoClp,
  isEstadoLluvias,
  isGravedadLluvias,
  type EjecutadoPor,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EventoFiltracionTablaProps = {
  proyectos: ProyectoFiltracionEnriquecido[];
  expandidoId: string | null;
  onToggleExpand: (id: string) => void;
  onEditar: (p: ProyectoFiltracionEnriquecido) => void;
  puedeEditar: boolean;
  hayProyectosEnEvento?: boolean;
};

function CeldaCotizacion({ p }: { p: ProyectoFiltracionEnriquecido }) {
  const ep = p.ejecutado_por;
  if (ep === "maestros_bodetek") {
    return p.horas_maestros_bodetek != null && p.horas_maestros_bodetek > 0 ? (
      <span className="text-sm">{p.horas_maestros_bodetek} h</span>
    ) : (
      <EtiquetaFaltaBadge />
    );
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
            <>Valor recinto: {formatMontoClp(p.valor_reparacion)}</>
          ) : (
            <EtiquetaFaltaBadge />
          )}
          {p.valor_total_cotizacion != null ? (
            <> · Total: {formatMontoClp(p.valor_total_cotizacion)}</>
          ) : null}
        </div>
      </div>
    );
  }
  return <EtiquetaFaltaBadge />;
}

function CeldaEntrega({ p }: { p: ProyectoFiltracionEnriquecido }) {
  return (
    <IndicadorEntrega
      fechaEstimada={p.fecha_entrega_estimada}
      fechaReal={p.fecha_termino}
      atrasada={p.entregaAtrasada}
    />
  );
}

export function EventoFiltracionTabla({
  proyectos,
  expandidoId,
  onToggleExpand,
  onEditar,
  puedeEditar,
  hayProyectosEnEvento = true,
}: EventoFiltracionTablaProps) {
  if (proyectos.length === 0) {
    return (
      <p className="hidden rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground md:block">
        {hayProyectosEnEvento
          ? "Ninguna ficha cumple estos filtros."
          : "Ningún proyecto coincide con los filtros actuales."}
      </p>
    );
  }

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[10rem]">Recinto</TableHead>
            <TableHead>Gravedad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="min-w-[12rem]">Diagnóstico y plan</TableHead>
            <TableHead>Antes / Después</TableHead>
            <TableHead>Planos</TableHead>
            <TableHead className="min-w-[9rem]">Cotización</TableHead>
            <TableHead className="min-w-[8rem]">Ejecución</TableHead>
            <TableHead>Entrega est. / real</TableHead>
            <TableHead className="min-w-[8rem]">Completitud</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proyectos.map((p) => {
            const expandido = expandidoId === p.id;
            return (
              <Fragment key={p.id}>
                <TableRow
                  className={cn(
                    "cursor-pointer hover:bg-muted/40",
                    expandido && "bg-muted/30",
                  )}
                  onClick={() => onToggleExpand(p.id)}
                >
                  <TableCell>
                    <div className="flex items-start gap-2">
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
                      <div className="min-w-0">
                        <p className="font-bold">
                          <ValorOFalta value={p.recinto_codigo} />
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          <ValorOFalta
                            value={
                              p.recinto_arrendatario?.trim() || p.recinto_nombre
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.gravedad && isGravedadLluvias(p.gravedad) ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          GRAVEDAD_LLUVIAS_BADGE[p.gravedad],
                        )}
                      >
                        {GRAVEDAD_LLUVIAS_LABEL[p.gravedad]}
                      </span>
                    ) : (
                      <EtiquetaFaltaBadge />
                    )}
                  </TableCell>
                  <TableCell>
                    {isEstadoLluvias(p.estado) ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          ESTADO_LLUVIAS_BADGE[p.estado],
                        )}
                      >
                        {ESTADO_TRABAJO_LABEL[p.estado]}
                      </span>
                    ) : (
                      p.estado
                    )}
                  </TableCell>
                  <TableCell>
                    <ChipsProblemaCompletitud
                      problemas={p.problemas}
                      completitud={p.completitud}
                    />
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
                    <CeldaCotizacion p={p} />
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
                    <CeldaEntrega p={p} />
                  </TableCell>
                  <TableCell>
                    <BarraCompletitud porcentaje={p.completitud.porcentaje} />
                    <p className="mt-1 text-[11px] text-muted-foreground">
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
                  </TableCell>
                </TableRow>
                {expandido ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={10} className="p-0">
                      <EventoFiltracionFilaExpandida
                        proyecto={p}
                        puedeEditar={puedeEditar}
                        onCompletar={() => onEditar(p)}
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
