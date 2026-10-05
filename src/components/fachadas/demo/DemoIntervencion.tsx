"use client";

import { useRouter } from "next/navigation";
import { DetalleFachadaVista } from "@/components/fachadas/DetalleFachadaVista";
import { FormularioIntervencion } from "@/components/fachadas/FormularioIntervencion";
import { DemoShell } from "@/components/fachadas/demo/DemoChrome";
import {
  DEMO_CATEGORIA,
  DEMO_CONTEOS_BORRAR,
  DEMO_FACHADA_B14,
  DEMO_HOY,
  DEMO_INTERVENCION_NUEVA,
  DEMO_INTERVENCIONES_B14,
  DEMO_PROVEEDORES,
  DEMO_RECINTOS,
  DEMO_SUBTIPO,
} from "@/lib/fachadas/demo-datos";

export function DemoIntervencion() {
  const router = useRouter();
  return (
    <DemoShell>
      <div className="fd-form-backdrop pointer-events-none select-none opacity-40">
        <DetalleFachadaVista
          categoriaId={DEMO_CATEGORIA}
          subtipoId={DEMO_SUBTIPO}
          fachada={DEMO_FACHADA_B14}
          intervenciones={DEMO_INTERVENCIONES_B14}
          recintos={DEMO_RECINTOS}
          proveedores={DEMO_PROVEEDORES}
          puedeEditar={false}
          puedeBorrar={false}
          conteos={DEMO_CONTEOS_BORRAR}
          modoDemo
          hoy={DEMO_HOY}
        />
      </div>
      <FormularioIntervencion
        categoriaId={DEMO_CATEGORIA}
        subtipoId={DEMO_SUBTIPO}
        inicial={DEMO_INTERVENCION_NUEVA}
        proveedores={DEMO_PROVEEDORES}
        puedeEditar
        modoDemo
        variant="modal"
        titulo="Nueva intervención"
        onCancelar={() => router.push("/trabajos/fachadas/demo/ficha")}
      />
    </DemoShell>
  );
}
