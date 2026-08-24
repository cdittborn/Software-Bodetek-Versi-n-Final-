"use client";

import { Label } from "@/components/ui/label";
import {
  EtiquetaFalta,
  TituloSeccion,
} from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import { ZonaEvidenciaUpload } from "@/components/emergencias/filtracion-form/fields/ZonaEvidenciaUpload";
import type { ResultadoCompletitud } from "@/components/emergencias/filtracion-form/lib/completitudFiltracion";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type Props = {
  trabajoId: string | null;
  puedeSubir: boolean;
  completitud: ResultadoCompletitud;
  mediaAgua: TrabajoMediaItem[];
  mediaReparacion: TrabajoMediaItem[];
  pendingAgua: File[];
  pendingReparacion: File[];
  onPendingAgua: (files: File[]) => void;
  onPendingReparacion: (files: File[]) => void;
  onUploaded: () => void;
};

export function Seccion04Planos({
  trabajoId,
  puedeSubir,
  completitud,
  mediaAgua,
  mediaReparacion,
  pendingAgua,
  pendingReparacion,
  onPendingAgua,
  onPendingReparacion,
  onUploaded,
}: Props) {
  return (
    <section id="sec-04" className="mb-10 scroll-mt-4">
      <TituloSeccion numero="04" titulo="Plano con marcas" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[#3f3f46]">
            Dónde cayó el agua
            <EtiquetaFalta
              visible={completitud.faltantes.some((f) => f.id === "plano_agua")}
            />
          </Label>
          <ZonaEvidenciaUpload
            tipo="plano_agua"
            maxArchivos={4}
            instruccion="Subir foto del plano con marcas de los lugares visibles por donde cayó agua"
            items={mediaAgua}
            pendingFiles={pendingAgua}
            onPendingChange={onPendingAgua}
            trabajoId={trabajoId}
            puedeSubir={puedeSubir}
            onUploaded={onUploaded}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#3f3f46]">
            Dónde hay que reparar
            <EtiquetaFalta
              visible={completitud.faltantes.some(
                (f) => f.id === "plano_reparacion",
              )}
            />
          </Label>
          <ZonaEvidenciaUpload
            tipo="plano_reparacion"
            maxArchivos={4}
            instruccion="Subir foto del plano con marcas del punto de reparación"
            items={mediaReparacion}
            pendingFiles={pendingReparacion}
            onPendingChange={onPendingReparacion}
            trabajoId={trabajoId}
            puedeSubir={puedeSubir}
            onUploaded={onUploaded}
          />
        </div>
      </div>
    </section>
  );
}
