"use client";

import { Controller, type Control, type FieldErrors } from "react-hook-form";
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
import {
  EtiquetaAtrasadaBadge,
  EtiquetaFaltaBadge,
} from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import type { FiltracionFormSchema } from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import type { ResultadoCompletitud } from "@/components/emergencias/filtracion-form/lib/completitudFiltracion";
import { etiquetaRecintoSelector, formatFechaCl, type RecintoOption } from "@/lib/trabajos";
import { entregaAtrasadaDesdeProblemas } from "@/lib/filtracion/completitud";
import { fechaEntregaEstimadaFicha } from "@/lib/filtracion/problemas";

type Props = {
  control: Control<FiltracionFormSchema>;
  errors: FieldErrors<FiltracionFormSchema>;
  recintos: RecintoOption[];
  completitud: ResultadoCompletitud;
};

export function Seccion01Ubicacion({
  control,
  errors,
  recintos,
  completitud,
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
          <Controller
            name="problemas"
            control={control}
            render={({ field }) => {
              const fecha = fechaEntregaEstimadaFicha(field.value);
              const atrasada = entregaAtrasadaDesdeProblemas(field.value);
              const falta = !fecha;
              return (
                <div className="space-y-1.5">
                  <Label className="text-[#3f3f46]">
                    Fecha de entrega estimada
                    <EtiquetaFalta visible={falta} />
                  </Label>
                  <p className="text-xs text-[#71717a]">
                    Calculada automáticamente: la fecha más lejana entre los
                    problemas marcados. No se edita acá.
                  </p>
                  <div
                    className={
                      atrasada
                        ? "flex min-h-[44px] items-center rounded-md border border-amber-400 bg-amber-50 px-3 text-sm"
                        : "flex min-h-[44px] items-center rounded-md border border-[#e4e4e7] bg-[#fafafa] px-3 text-sm text-[#18181b]"
                    }
                  >
                    {fecha ? (
                      <span className={atrasada ? "font-semibold text-amber-900" : undefined}>
                        {formatFechaCl(fecha)}
                      </span>
                    ) : (
                      <EtiquetaFaltaBadge />
                    )}
                  </div>
                  {atrasada ? (
                    <p className="flex items-center gap-1.5 text-xs text-amber-900">
                      <EtiquetaAtrasadaBadge />
                      Hay al menos un problema con fecha estimada vencida y sin
                      entrega real
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
