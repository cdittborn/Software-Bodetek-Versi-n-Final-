"use client";

import { FachadasSubtipoVista } from "@/components/fachadas/FachadasSubtipoVista";
import { DemoShell } from "@/components/fachadas/demo/DemoChrome";
import {
  DEMO_CATEGORIA,
  DEMO_FACHADAS,
  DEMO_HOY,
  DEMO_INTERVENCIONES,
  DEMO_PORTADAS,
  DEMO_PROVEEDORES,
  DEMO_RECINTOS,
  DEMO_SUBTIPO,
} from "@/lib/fachadas/demo-datos";

export function DemoDashboard() {
  return (
    <DemoShell sidebar>
      <FachadasSubtipoVista
        categoriaId={DEMO_CATEGORIA}
        subtipoId={DEMO_SUBTIPO}
        titulo="Fachadas"
        subtitulo="Imagen"
        fachadas={DEMO_FACHADAS}
        intervenciones={DEMO_INTERVENCIONES}
        portadas={DEMO_PORTADAS}
        recintos={DEMO_RECINTOS}
        proveedores={DEMO_PROVEEDORES}
        puedeEditar
        tablasAusentes={false}
        error={null}
        modoDemo
        hoy={DEMO_HOY}
      />
    </DemoShell>
  );
}
