"use client";

import { Controller, type Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BloqueEjecucionProblema } from "@/components/emergencias/filtracion-form/fields/BloqueEjecucionProblema";
import {
  EtiquetaFalta,
  TituloSeccion,
} from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import type { FiltracionFormSchema } from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import {
  mediaCotizacionDeTipo,
  type ResultadoCompletitud,
} from "@/lib/filtracion/completitud";
import {
  idDescripcionProblema,
  idPlanProblema,
  TIPOS_PROBLEMA,
  TIPO_PROBLEMA_LABEL,
  type TipoProblema,
} from "@/lib/filtracion/problemas";
import type { ProveedorOption } from "@/lib/proveedores";
import type { TrabajoMediaItem } from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type Props = {
  control: Control<FiltracionFormSchema>;
  completitud: ResultadoCompletitud;
  proveedores: ProveedorOption[];
  onProveedoresChange: (next: ProveedorOption[]) => void;
  trabajoId: string | null;
  puedeSubir: boolean;
  mediaCotizacion: TrabajoMediaItem[];
  pendingCotizacionPorTipo: Partial<Record<TipoProblema, File[]>>;
  onPendingCotizacionPorTipo: (
    tipo: TipoProblema,
    files: File[],
  ) => void;
  onUploaded: () => void;
};

function CasillaTipo({
  tipo,
  checked,
  onToggle,
}: {
  tipo: TipoProblema;
  checked: boolean;
  onToggle: (next: boolean) => void;
}) {
  const id = `tipo-problema-${tipo}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
        checked
          ? "border-[#c8102e] bg-[#fdeced] text-[#a4131f]"
          : "border-[#e4e4e7] bg-white text-[#3f3f46] hover:bg-[#fafafa]",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="size-5 shrink-0 accent-[#c8102e]"
      />
      {TIPO_PROBLEMA_LABEL[tipo]}
    </label>
  );
}

export function Seccion02Diagnostico({
  control,
  completitud,
  proveedores,
  onProveedoresChange,
  trabajoId,
  puedeSubir,
  mediaCotizacion,
  pendingCotizacionPorTipo,
  onPendingCotizacionPorTipo,
  onUploaded,
}: Props) {
  const faltaTipos = completitud.faltantes.some((f) => f.id === "tipos_problema");

  return (
    <section
      id="sec-02"
      className="-mx-4 mb-10 scroll-mt-4 bg-[#faf9f7] px-4 py-6 md:-mx-6 md:px-6"
    >
      <TituloSeccion numero="02" titulo="Diagnóstico y plan" />
      <span className="mb-4 inline-block rounded-md bg-[#fdf4e3] px-2 py-1 text-xs font-medium text-[#7a4e10]">
        Anotar acá mucho detalle
      </span>

      <div className="mb-5 space-y-2">
        <Label className="text-[#3f3f46]">
          Tipo de problema
          <EtiquetaFalta visible={faltaTipos} />
        </Label>
        <p className="text-xs text-[#71717a]">
          Marca uno o más. Cada tipo abre su propio bloque, con ejecutado por,
          estado y fechas independientes.
        </p>
        <Controller
          name="problemas"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
              {TIPOS_PROBLEMA.map((tipo) => (
                <CasillaTipo
                  key={tipo}
                  tipo={tipo}
                  checked={field.value[tipo].activo}
                  onToggle={(activo) =>
                    field.onChange({
                      ...field.value,
                      [tipo]: { ...field.value[tipo], activo },
                    })
                  }
                />
              ))}
            </div>
          )}
        />
      </div>

      <Controller
        name="problemas"
        control={control}
        render={({ field }) => (
          <div className="grid gap-4">
            {TIPOS_PROBLEMA.filter((tipo) => field.value[tipo].activo).map(
              (tipo) => {
                const faltaDesc = completitud.faltantes.some(
                  (f) => f.id === idDescripcionProblema(tipo),
                );
                const faltaPlan = completitud.faltantes.some(
                  (f) => f.id === idPlanProblema(tipo),
                );
                return (
                  <div
                    key={tipo}
                    id={`bloque-problema-${tipo}`}
                    className="rounded-xl border border-[#e4e4e7] bg-white p-4"
                  >
                    <h4 className="mb-3 text-sm font-semibold text-[#18181b]">
                      {TIPO_PROBLEMA_LABEL[tipo]}
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`descripcion-${tipo}`}
                          className="text-[#3f3f46]"
                        >
                          Descripción del problema *
                          <EtiquetaFalta visible={faltaDesc} />
                        </Label>
                        <Textarea
                          id={`descripcion-${tipo}`}
                          rows={6}
                          className="min-h-[160px] text-[15px]"
                          value={field.value[tipo].descripcion}
                          onChange={(e) =>
                            field.onChange({
                              ...field.value,
                              [tipo]: {
                                ...field.value[tipo],
                                descripcion: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`plan-${tipo}`}
                          className="text-[#3f3f46]"
                        >
                          Plan de acción
                          <EtiquetaFalta visible={faltaPlan} />
                        </Label>
                        <Textarea
                          id={`plan-${tipo}`}
                          rows={6}
                          className="min-h-[160px] text-[15px]"
                          value={field.value[tipo].plan}
                          onChange={(e) =>
                            field.onChange({
                              ...field.value,
                              [tipo]: {
                                ...field.value[tipo],
                                plan: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <BloqueEjecucionProblema
                      tipo={tipo}
                      bloque={field.value[tipo]}
                      onChange={(next) =>
                        field.onChange({
                          ...field.value,
                          [tipo]: next,
                        })
                      }
                      completitud={completitud}
                      proveedores={proveedores}
                      onProveedoresChange={onProveedoresChange}
                      trabajoId={trabajoId}
                      puedeSubir={puedeSubir}
                      mediaCotizacion={mediaCotizacionDeTipo(
                        mediaCotizacion,
                        tipo,
                        field.value,
                      )}
                      pendingCotizacion={pendingCotizacionPorTipo[tipo] ?? []}
                      onPendingCotizacion={(files) =>
                        onPendingCotizacionPorTipo(tipo, files)
                      }
                      onUploaded={onUploaded}
                    />
                  </div>
                );
              },
            )}
          </div>
        )}
      />
    </section>
  );
}
