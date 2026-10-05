"use client";

import { EditorInformeSeguro } from "@/components/informe-seguro/EditorInformeSeguro";
import {
  borradorDemo,
  fuenteDemo,
  previewsDemo,
} from "@/lib/informe-seguro/demo-datos";
import { fuenteSinNotas } from "@/lib/informe-seguro/fuente";
import type { ResultadoPersistir } from "@/lib/informe-seguro/resultado";

const sinEscritura: ResultadoPersistir = {
  ok: true,
  tokenActivo: false,
  linkPath: null,
};

export function DemoEditor() {
  return (
    <EditorInformeSeguro
      modoDemo
      fuente={fuenteSinNotas(fuenteDemo)}
      inicial={borradorDemo}
      previews={previewsDemo}
      versiones={[]}
      tokenActivo={false}
      linkPath={null}
      tieneInforme={false}
      categoriaId="demo-cat"
      subtipoId="demo-sub"
      eventoId="demo-evento"
      onGuardar={async () => sinEscritura}
      onDesactivar={async () => sinEscritura}
      onRegenerar={async () => sinEscritura}
    />
  );
}
