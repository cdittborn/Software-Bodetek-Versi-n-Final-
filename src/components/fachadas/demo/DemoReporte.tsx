"use client";

import { ReporteDirectorio } from "@/components/fachadas/ReporteDirectorio";
import { DemoSwitcher } from "@/components/fachadas/demo/DemoChrome";
import {
  DEMO_CATEGORIA,
  DEMO_FACHADAS,
  DEMO_HOY,
  DEMO_INTERVENCIONES,
  DEMO_PORTADAS,
  DEMO_SUBTIPO,
} from "@/lib/fachadas/demo-datos";

export function DemoReporte() {
  return (
    <div className="min-h-full bg-white">
      <DemoSwitcher />
      <ReporteDirectorio
        categoriaId={DEMO_CATEGORIA}
        subtipoId={DEMO_SUBTIPO}
        fachadas={DEMO_FACHADAS}
        intervenciones={DEMO_INTERVENCIONES}
        portadas={DEMO_PORTADAS}
        modoDemo
        hoy={DEMO_HOY}
      />
    </div>
  );
}
