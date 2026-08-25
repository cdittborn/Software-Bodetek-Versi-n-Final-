"use client";

import { Controller, type Control } from "react-hook-form";
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
import {
  EtiquetaFalta,
  TituloSeccion,
} from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import type { FiltracionFormSchema } from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import { NONE } from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import type { ResultadoCompletitud } from "@/components/emergencias/filtracion-form/lib/completitudFiltracion";
import {
  EJECUTADO_POR_LABEL,
  EJECUTADO_POR_OPCIONES,
  ESTADO_TRABAJO_LABEL,
  ESTADOS_LLUVIAS,
  type EstadoLluvias,
} from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

type Props = {
  control: Control<FiltracionFormSchema>;
  ejecutadoPor: string;
  completitud: ResultadoCompletitud;
  proveedores: ProveedorOption[];
  onProveedoresChange: (next: ProveedorOption[]) => void;
};

export function Seccion05Ejecucion({
  control,
  ejecutadoPor,
  completitud,
  proveedores,
  onProveedoresChange,
}: Props) {
  const mostrarProveedor =
    ejecutadoPor === "proveedor_externo" || ejecutadoPor === "ambos";
  const mostrarHoras = ejecutadoPor === "maestros_bodetek";

  return (
    <section id="sec-05" className="mb-10 scroll-mt-4">
      <TituloSeccion numero="05" titulo="Ejecutado por y fechas" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[#3f3f46]">
            Ejecutado por
            <EtiquetaFalta
              visible={completitud.faltantes.some(
                (f) => f.id === "ejecutado_por",
              )}
            />
          </Label>
          <Controller
            name="ejecutadoPor"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || NONE}
                onValueChange={(v) => field.onChange(v ?? NONE)}
              >
                <SelectTrigger className="h-11 min-h-[44px] w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin asignar</SelectItem>
                  {EJECUTADO_POR_OPCIONES.filter((op) => op !== "ambos").map(
                    (op) => (
                      <SelectItem key={op} value={op}>
                        {EJECUTADO_POR_LABEL[op]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#3f3f46]">Estado</Label>
          <Controller
            name="estado"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) =>
                  field.onChange((v as EstadoLluvias) ?? "sin_asignar")
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
            )}
          />
        </div>

        {mostrarProveedor ? (
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[#3f3f46]">
              Proveedor
              <EtiquetaFalta
                visible={completitud.faltantes.some((f) => f.id === "proveedor")}
              />
            </Label>
            <Controller
              name="proveedorId"
              control={control}
              render={({ field }) => (
                <SelectorProveedor
                  value={
                    !field.value || field.value === NONE ? null : field.value
                  }
                  onChange={(id) => field.onChange(id ?? NONE)}
                  proveedores={proveedores}
                  onProveedoresChange={onProveedoresChange}
                />
              )}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="fechaEntregaReal" className="text-[#3f3f46]">
            Fecha de entrega real
          </Label>
          <Controller
            name="fechaEntregaReal"
            control={control}
            render={({ field }) => (
              <Input id="fechaEntregaReal" type="date" className="h-11 min-h-[44px]" {...field} />
            )}
          />
        </div>

        {mostrarHoras ? (
          <div className="space-y-1.5">
            <Label htmlFor="horasMaestros" className="text-[#3f3f46]">
              Horas trabajadas · Maestros Bodetek
              <EtiquetaFalta
                visible={completitud.faltantes.some(
                  (f) => f.id === "horas_maestros",
                )}
              />
            </Label>
            <Controller
              name="horasMaestros"
              control={control}
              render={({ field }) => (
                <Input
                  id="horasMaestros"
                  inputMode="decimal"
                  placeholder="Ej. 12,5"
                  className="h-11 min-h-[44px]"
                  {...field}
                />
              )}
            />
            <p className="text-xs text-[#71717a]">
              Obligatorio solo cuando el trabajo lo ejecutan los Maestros Bodetek.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
