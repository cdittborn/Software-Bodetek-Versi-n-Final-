"use client";

import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EtiquetaFalta,
  TituloSeccion,
} from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import { EtiquetaAtrasadaBadge } from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import type { FiltracionFormSchema } from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import type { ResultadoCompletitud } from "@/components/emergencias/filtracion-form/lib/completitudFiltracion";
import { etiquetaRecintoSelector, type RecintoOption } from "@/lib/trabajos";
import { esEntregaAtrasada } from "@/lib/filtracion/completitud";

type Props = {
  control: Control<FiltracionFormSchema>;
  errors: FieldErrors<FiltracionFormSchema>;
  recintos: RecintoOption[];
  completitud: ResultadoCompletitud;
  fechaEntregaReal: string;
};

export function Seccion01Ubicacion({
  control,
  errors,
  recintos,
  completitud,
  fechaEntregaReal,
}: Props) {
  return (
    <section id="sec-01" className="mb-10 scroll-mt-4">
      <TituloSeccion numero="01" titulo="Ubicación" />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[#3f3f46]">
            Bodega y recinto *
            <EtiquetaFalta visible={!completitud.items.find((i) => i.id === "recinto")?.completo} />
          </Label>
          <Controller
            name="recintoId"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="h-11 min-h-[44px] w-full">
                  <SelectValue placeholder="Seleccionar bodega" />
                </SelectTrigger>
                <SelectContent>
                  {recintos.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {etiquetaRecintoSelector(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.recintoId ? (
            <p className="text-sm text-[#a4131f]">{errors.recintoId.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fechaEntregaEstimada" className="text-[#3f3f46]">
            Fecha de entrega estimada
            <EtiquetaFalta
              visible={
                completitud.faltantes.some((f) => f.id === "fecha_entrega")
              }
            />
          </Label>
          <Controller
            name="fechaEntregaEstimada"
            control={control}
            render={({ field }) => {
              const atrasada = esEntregaAtrasada(field.value, fechaEntregaReal);
              return (
                <div className="space-y-1.5">
                  <Input
                    id="fechaEntregaEstimada"
                    type="date"
                    className={
                      atrasada
                        ? "h-11 min-h-[44px] border-amber-400 bg-amber-50"
                        : "h-11 min-h-[44px]"
                    }
                    {...field}
                  />
                  {atrasada ? (
                    <p className="flex items-center gap-1.5 text-xs text-amber-900">
                      <EtiquetaAtrasadaBadge />
                      Fecha estimada vencida y sin entrega real
                    </p>
                  ) : null}
                </div>
              );
            }}
          />
        </div>
      </div>
    </section>
  );
}
