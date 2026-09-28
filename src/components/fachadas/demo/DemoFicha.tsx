"use client";

import { DetalleFachadaVista } from "@/components/fachadas/DetalleFachadaVista";
import { DemoShell } from "@/components/fachadas/demo/DemoChrome";
import {
  DEMO_CATEGORIA,
  DEMO_CONTEOS_BORRAR,
  DEMO_FACHADA_B14,
  DEMO_HOY,
  DEMO_INTERVENCIONES_B14,
  DEMO_PROVEEDORES,
  DEMO_RECINTOS,
  DEMO_SUBTIPO,
} from "@/lib/fachadas/demo-datos";

export function DemoFicha() {
  return (
    <DemoShell>
      <DetalleFachadaVista
        categoriaId={DEMO_CATEGORIA}
        subtipoId={DEMO_SUBTIPO}
        fachada={DEMO_FACHADA_B14}
        intervenciones={DEMO_INTERVENCIONES_B14}
        recintos={DEMO_RECINTOS}
        proveedores={DEMO_PROVEEDORES}
        puedeEditar
        puedeBorrar={false}
        conteos={DEMO_CONTEOS_BORRAR}
        modoDemo
        hoy={DEMO_HOY}
      />
    </DemoShell>
  );
}
