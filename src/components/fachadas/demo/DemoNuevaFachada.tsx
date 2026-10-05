"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FachadasSubtipoVista } from "@/components/fachadas/FachadasSubtipoVista";
import { FormularioFachada } from "@/components/fachadas/FormularioFachada";
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

export function DemoNuevaFachada() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  return (
    <DemoShell sidebar>
      <div className="fd-form-backdrop pointer-events-none select-none opacity-40">
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
          puedeEditar={false}
          tablasAusentes={false}
          error={null}
          modoDemo
          hoy={DEMO_HOY}
        />
      </div>
      <FormularioFachada
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) router.push("/trabajos/fachadas/demo");
        }}
        modoDemo
        semilla={{
          nombre: "Bodega 14 frente",
          altoM: 6.2,
          anchoM: 18,
          superficieM2: 111.6,
          frecuenciaLimpiezaMeses: 6,
          frecuenciaReparacionMeses: 24,
          frecuenciaPinturaMeses: 24,
          ultimaLimpiezaFecha: "2022-11-20",
          ultimaReparacionFecha: "2021-08-15",
          ultimaPinturaFecha: "2020-04-10",
        }}
        onSuccess={() => router.push("/trabajos/fachadas/demo")}
      />
    </DemoShell>
  );
}
