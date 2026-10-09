"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FachadasSubtipoVista } from "@/components/fachadas/FachadasSubtipoVista";
import {
  fachadasDevMain,
  HOY_DEV_MAIN,
  intervencionesDevMain,
} from "@/app/dev/fachadas-v2/datos-main";

export function VistaMain({ puedeEditar }: { puedeEditar: boolean }) {
  const router = useRouter();
  const fachadas = useMemo(() => fachadasDevMain(), []);
  const intervenciones = useMemo(() => intervencionesDevMain(), []);

  return (
    <div data-vista="main">
      <FachadasSubtipoVista
        categoriaId="dev"
        subtipoId="fachadas"
        titulo="Fachadas"
        subtitulo="Imagen"
        fachadas={fachadas}
        intervenciones={intervenciones}
        portadas={[]}
        recintos={[]}
        proveedores={[]}
        puedeEditar={puedeEditar}
        tablasAusentes={false}
        error={null}
        hoy={HOY_DEV_MAIN}
        enlaceFachada={(id) => `/dev/fachadas-v2/ficha?id=${encodeURIComponent(id)}`}
        onRegistrarIntervencion={(id) => {
          router.push(`/dev/fachadas-v2/ficha?id=${encodeURIComponent(id)}&nueva=1`);
        }}
      />
    </div>
  );
}
