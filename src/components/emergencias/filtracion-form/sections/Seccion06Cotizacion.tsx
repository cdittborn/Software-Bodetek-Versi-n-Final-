"use client";

import { Controller, type Control } from "react-hook-form";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TituloSeccion } from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import { ZonaEvidenciaUpload } from "@/components/emergencias/filtracion-form/fields/ZonaEvidenciaUpload";
import type { FiltracionFormSchema } from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import type { ResultadoCompletitud } from "@/components/emergencias/filtracion-form/lib/completitudFiltracion";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type Props = {
  control: Control<FiltracionFormSchema>;
  completitud: ResultadoCompletitud;
  trabajoId: string | null;
  puedeSubir: boolean;
  mediaCotizacion: TrabajoMediaItem[];
  pendingCotizacion: File[];
  onPendingCotizacion: (files: File[]) => void;
  onUploaded: () => void;
  proveedorId: string | null;
};

export function Seccion06Cotizacion({
  control,
  completitud,
  trabajoId,
  puedeSubir,
  mediaCotizacion,
  pendingCotizacion,
  onPendingCotizacion,
  onUploaded,
  proveedorId,
}: Props) {
  const faltaCotizacion = completitud.faltantes.some((f) => f.id === "cotizacion");

  return (
    <section id="sec-06" className="mb-6 scroll-mt-4">
      <TituloSeccion numero="06" titulo="Cotización" />
      <p className="mb-4 text-xs text-[#71717a]">
        Obligatoria solo para trabajos de proveedor externo
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="numeroCotizacion" className="text-[#3f3f46]">
            N° de cotización
          </Label>
          <Controller
            name="numeroCotizacion"
            control={control}
            render={({ field }) => (
              <Input id="numeroCotizacion" {...field} />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="valorRecinto" className="text-[#3f3f46]">
            Valor del trabajo · este recinto
          </Label>
          <Controller
            name="valorRecinto"
            control={control}
            render={({ field }) => (
              <Input
                id="valorRecinto"
                inputMode="numeric"
                placeholder="Ej. 1.500.000"
                {...field}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="valorTotalCotizacion" className="text-[#3f3f46]">
            Valor total de la cotización
          </Label>
          <Controller
            name="valorTotalCotizacion"
            control={control}
            render={({ field }) => (
              <Input
                id="valorTotalCotizacion"
                inputMode="numeric"
                placeholder="Ej. 6.200.000"
                {...field}
              />
            )}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ZonaEvidenciaUpload
          tipo="cotizacion"
          maxArchivos={5}
          instruccion="Adjuntar cotización (PDF o imagen)"
          items={mediaCotizacion}
          pendingFiles={pendingCotizacion}
          onPendingChange={onPendingCotizacion}
          trabajoId={trabajoId}
          puedeSubir={puedeSubir}
          onUploaded={onUploaded}
          proveedorId={proveedorId}
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

        {faltaCotizacion ? (
          <p className="text-xs font-medium text-[#a4131f]">
            Falta adjuntar la cotización
          </p>
        ) : null}
      </div>
    </section>
  );
}
