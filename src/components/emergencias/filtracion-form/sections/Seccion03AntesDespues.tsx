"use client";

import { TituloSeccion } from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import { ZonaEvidenciaUpload } from "@/components/emergencias/filtracion-form/fields/ZonaEvidenciaUpload";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type Props = {
  trabajoId: string | null;
  puedeSubir: boolean;
  mediaAntes: TrabajoMediaItem[];
  mediaDespues: TrabajoMediaItem[];
  pendingAntes: File[];
  pendingDespues: File[];
  onPendingAntes: (files: File[]) => void;
  onPendingDespues: (files: File[]) => void;
  onUploaded: () => void;
};

export function Seccion03AntesDespues({
  trabajoId,
  puedeSubir,
  mediaAntes,
  mediaDespues,
  pendingAntes,
  pendingDespues,
  onPendingAntes,
  onPendingDespues,
  onUploaded,
}: Props) {
  return (
    <section id="sec-03" className="mb-10 scroll-mt-4">
      <TituloSeccion numero="03" titulo="Respaldo del trabajo · antes y después" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#ecdfc9] bg-[#fdfaf3] p-4">
          <h4 className="mb-3 text-sm font-semibold text-[#7a4e10]">Antes</h4>
          <ZonaEvidenciaUpload
            tipo="antes"
            theme="amber"
            instruccion="Arrastra fotos o videos del estado inicial"
            items={mediaAntes}
            pendingFiles={pendingAntes}
            onPendingChange={onPendingAntes}
            trabajoId={trabajoId}
            puedeSubir={puedeSubir}
            onUploaded={onUploaded}
          />
        </div>

        <div className="rounded-xl border border-[#d5e6d8] bg-[#f6fbf7] p-4">
          <h4 className="mb-3 text-sm font-semibold text-[#1d5c34]">Después</h4>
          <ZonaEvidenciaUpload
            tipo="despues"
            theme="green"
            instruccion="Arrastra el respaldo del trabajo terminado"
            subtexto="Requerido para cerrar la filtración"
            items={mediaDespues}
            pendingFiles={pendingDespues}
            onPendingChange={onPendingDespues}
            trabajoId={trabajoId}
            puedeSubir={puedeSubir}
            onUploaded={onUploaded}
          />
          {mediaDespues.length + pendingDespues.length === 0 ? (
            <p className="mt-2 text-xs font-medium text-[#a4131f]">
              Falta evidencia «Después». No se puede cerrar la filtración sin al
              menos un archivo.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
