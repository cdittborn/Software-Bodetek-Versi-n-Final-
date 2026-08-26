"use client";

import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectorProveedor } from "@/components/shared/SelectorProveedor";
import { EtiquetaFalta } from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import { ZonaEvidenciaUpload } from "@/components/emergencias/filtracion-form/fields/ZonaEvidenciaUpload";
import { NONE } from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import type { ResultadoCompletitud } from "@/lib/filtracion/completitud";
import {
  idCotizacionProblema,
  idEjecutadoPorProblema,
  idFechaEstimadaProblema,
  idHorasProblema,
  idProveedorProblema,
  type BloqueProblema,
  type TipoProblema,
} from "@/lib/filtracion/problemas";
import {
  EJECUTADO_POR_LABEL,
  ESTADO_TRABAJO_LABEL,
  ESTADOS_LLUVIAS,
  type EstadoLluvias,
} from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";
import type { TrabajoMediaItem } from "@/lib/trabajos";

const EJECUTADO_POR_BLOQUE = [
  "maestros_bodetek",
  "proveedor_externo",
] as const;

type Props = {
  tipo: TipoProblema;
  bloque: BloqueProblema;
  onChange: (next: BloqueProblema) => void;
  completitud: ResultadoCompletitud;
  proveedores: ProveedorOption[];
  onProveedoresChange: (next: ProveedorOption[]) => void;
  trabajoId: string | null;
  puedeSubir: boolean;
  mediaCotizacion: TrabajoMediaItem[];
  pendingCotizacion: File[];
  onPendingCotizacion: (files: File[]) => void;
  onUploaded: () => void;
};

export function BloqueEjecucionProblema({
  tipo,
  bloque,
  onChange,
  completitud,
  proveedores,
  onProveedoresChange,
  trabajoId,
  puedeSubir,
  mediaCotizacion,
  pendingCotizacion,
  onPendingCotizacion,
  onUploaded,
}: Props) {
  const ejecutadoPor = bloque.ejecutadoPor || NONE;
  const mostrarCotizacion = bloque.ejecutadoPor === "proveedor_externo";
  const mostrarHoras = bloque.ejecutadoPor === "maestros_bodetek";
  const falta = (id: string) => completitud.faltantes.some((f) => f.id === id);

  function patch(partial: Partial<BloqueProblema>) {
    onChange({ ...bloque, ...partial });
  }

  return (
    <div className="mt-4 space-y-4 border-t border-[#e4e4e7] pt-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[#3f3f46]">
            Ejecutado por
            <EtiquetaFalta visible={falta(idEjecutadoPorProblema(tipo))} />
          </Label>
          <Select
            value={ejecutadoPor}
            onValueChange={(v) =>
              patch({
                ejecutadoPor:
                  v === NONE || !v
                    ? ""
                    : (v as BloqueProblema["ejecutadoPor"]),
              })
            }
          >
            <SelectTrigger className="h-11 min-h-[44px] w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin asignar</SelectItem>
              {EJECUTADO_POR_BLOQUE.map((op) => (
                <SelectItem key={op} value={op}>
                  {EJECUTADO_POR_LABEL[op]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#3f3f46]">Estado</Label>
          <Select
            value={bloque.estado}
            onValueChange={(v) =>
              patch({ estado: (v as EstadoLluvias) ?? "sin_asignar" })
            }
          >
            <SelectTrigger className="h-11 min-h-[44px] w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_LLUVIAS.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_TRABAJO_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`fecha-est-${tipo}`} className="text-[#3f3f46]">
            Fecha de entrega estimada
            <EtiquetaFalta visible={falta(idFechaEstimadaProblema(tipo))} />
          </Label>
          <Input
            id={`fecha-est-${tipo}`}
            type="date"
            className="h-11 min-h-[44px]"
            value={bloque.fechaEntregaEstimada}
            onChange={(e) => patch({ fechaEntregaEstimada: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`fecha-real-${tipo}`} className="text-[#3f3f46]">
            Fecha de entrega real
          </Label>
          <Input
            id={`fecha-real-${tipo}`}
            type="date"
            className="h-11 min-h-[44px]"
            value={bloque.fechaEntregaReal}
            onChange={(e) => patch({ fechaEntregaReal: e.target.value })}
          />
        </div>
      </div>

      {mostrarHoras ? (
        <div className="space-y-1.5">
          <Label htmlFor={`horas-${tipo}`} className="text-[#3f3f46]">
            Horas trabajadas
            <EtiquetaFalta visible={falta(idHorasProblema(tipo))} />
          </Label>
          <Input
            id={`horas-${tipo}`}
            inputMode="decimal"
            placeholder="Ej. 12,5"
            className="h-11 min-h-[44px] max-w-xs"
            value={bloque.horasMaestros}
            onChange={(e) => patch({ horasMaestros: e.target.value })}
          />
          <p className="text-xs text-[#71717a]">
            Horas ya trabajadas por Maestros Bodetek, no una estimación.
          </p>
        </div>
      ) : null}

      {mostrarCotizacion ? (
        <div className="space-y-4 rounded-lg border border-[#e4e4e7] bg-[#fafafa] p-3">
          <p className="text-xs font-medium text-[#3f3f46]">Cotización</p>
          <div className="space-y-1.5">
            <Label className="text-[#3f3f46]">
              Proveedor
              <EtiquetaFalta visible={falta(idProveedorProblema(tipo))} />
            </Label>
            <SelectorProveedor
              value={
                !bloque.proveedorId || bloque.proveedorId === NONE
                  ? null
                  : bloque.proveedorId
              }
              onChange={(id) => patch({ proveedorId: id ?? "" })}
              proveedores={proveedores}
              onProveedoresChange={onProveedoresChange}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor={`n-cot-${tipo}`} className="text-[#3f3f46]">
                N° de cotización
              </Label>
              <Input
                id={`n-cot-${tipo}`}
                value={bloque.numeroCotizacion}
                onChange={(e) => patch({ numeroCotizacion: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`valor-rec-${tipo}`} className="text-[#3f3f46]">
                Valor recinto
              </Label>
              <Input
                id={`valor-rec-${tipo}`}
                inputMode="numeric"
                placeholder="Ej. 1.500.000"
                value={bloque.valorRecinto}
                onChange={(e) => patch({ valorRecinto: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`valor-tot-${tipo}`} className="text-[#3f3f46]">
                Valor total
              </Label>
              <Input
                id={`valor-tot-${tipo}`}
                inputMode="numeric"
                placeholder="Ej. 6.200.000"
                value={bloque.valorTotalCotizacion}
                onChange={(e) =>
                  patch({ valorTotalCotizacion: e.target.value })
                }
              />
            </div>
          </div>
          <ZonaEvidenciaUpload
            tipo="cotizacion"
            maxArchivos={5}
            instruccion="Adjuntar cotización (PDF o imagen)"
            acceptExtra=".pdf,application/pdf"
            items={mediaCotizacion}
            pendingFiles={pendingCotizacion}
            onPendingChange={onPendingCotizacion}
            trabajoId={trabajoId}
            puedeSubir={puedeSubir}
            onUploaded={onUploaded}
            proveedorId={bloque.proveedorId || null}
            problemaTipo={tipo}
          />
          {mediaCotizacion.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {mediaCotizacion.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 rounded-full border border-[#e4e4e7] bg-white px-2 py-1 text-xs text-[#3f3f46]"
                >
                  <FileText className="size-3" />
                  {m.nombre_archivo ?? "Cotización"}
                </span>
              ))}
            </div>
          ) : null}
          {falta(idCotizacionProblema(tipo)) ? (
            <p className="text-xs font-medium text-[#a4131f]">
              Falta completar o adjuntar la cotización
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
